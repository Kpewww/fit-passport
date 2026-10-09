"""Bake NAVER's Anny body model into a small file the browser can blend — Session 97.

Run by us, offline, never at build time or on Vercel:

    python -m venv .venv && .venv/bin/pip install anny==0.6.1
    .venv/bin/python tools/anny/bake.py            # writes app-web/public/anny/

What it writes (app-web/public/anny/):
  body.bin.gz  gzip of body.bin (Session 98: Vercel served the raw .bin uncompressed,
               387 KB; the browser inflates it with DecompressionStream). body.bin is
               little-endian, in this order:
               Uint16 indices      (faces x 3)
               Uint8  regions      (per vertex: 0 torso, 1 arm, 2 leg, 3 head)
               Int16  corners      (CORNERS x vertices x 3), 1 unit = 0.01 cm
               Int16  local deltas (LOCALS x 2 x vertices x 3), incr then decr
  body.json  the layout, the corners' phenotypes, the local labels, the licence
  NOTICE     Anny's Apache 2.0 attribution

Why it is exact. Anny's rest shape is template + sum(coefficient x blendshape)
(rigged_model.py get_rest_vertices), and a phenotype's coefficients are hat
functions over its anchors (phenotype.py). Between anchors the shape is therefore
multilinear in gender, muscle and weight, so blending the corner meshes at those
anchors reproduces Anny exactly; a local change adds its own blendshape linearly.
Age is fixed at the "young" anchor (2/3), height and proportions at 0.5 — the
browser scales to the wearer's stature instead.

The face. The skull's faces are dropped and an ellipsoid fitted to the skull takes
their place: a mannequin's head, not a person's, so the figure stays a form study.

Licences. Anny's code is Apache 2.0; the MakeHuman-derived assets it ships are CC0.
The smpl/smplx topologies are non-commercial and are never used here.
"""

import gzip
import json
import os
import struct
import sys
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import torch
import anny

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "app-web", "public", "anny")
TOPOLOGY = "notoes_collapse10pc"
AGE_YOUNG = 2 / 3
GENDERS = [0.0, 1.0]  # Anny: 0 = male, 1 = female
MUSCLES = [0.0, 0.5, 1.0]
WEIGHTS = [0.0, 0.5, 1.0]
LOCALS = [
    "measure-bust-circ-incr",
    "measure-underbust-circ-incr",
    "measure-waist-circ-incr",
    "measure-hips-circ-incr",
    "measure-shoulder-dist-incr",
    "measure-upperleg-height-incr",
    "measure-lowerleg-height-incr",
    # Helpers for when a measure change alone runs out of range (annyBody.ts FIT_CHAINS).
    "breast-volume-vert-up",
    "stomach-pregnant-incr",
    "hip-scale-horiz-incr",
    "torso-vshape-incr",
]
UNIT_PER_CM = 100  # Int16 units: 0.01 cm


def to_three_cm(v):
    """Anny is Z-up metres facing -Y; three.js is Y-up, facing +Z. Rotate and scale."""
    v = np.asarray(v, dtype=np.float64)
    out = np.stack([v[:, 0], v[:, 2], -v[:, 1]], axis=1) * 100.0
    return out


def regions_from_bones(model):
    labels = model.bone_labels
    idx = model.vertex_bone_indices.cpu().numpy()
    w = model.vertex_bone_weights.cpu().numpy()
    region_of_bone = []
    for b in labels:
        if any(k in b for k in ("upperarm", "lowerarm", "wrist", "finger", "metacarpal")):
            region_of_bone.append(1)
        elif any(k in b for k in ("upperleg", "lowerleg", "foot", "toe")):
            region_of_bone.append(2)
        elif b in ("neck02", "neck03", "head", "eye.L", "eye.R"):
            region_of_bone.append(3)
        else:
            region_of_bone.append(0)
    out = np.zeros(idx.shape[0], dtype=np.uint8)
    skull = np.zeros(idx.shape[0], dtype=bool)
    head_bones = {labels.index(b) for b in ("head", "eye.L", "eye.R") if b in labels}
    for v in range(idx.shape[0]):
        totals = {}
        on_head = 0.0
        for j in range(idx.shape[1]):
            r = region_of_bone[idx[v, j]]
            totals[r] = totals.get(r, 0.0) + float(w[v, j])
            if idx[v, j] in head_bones:
                on_head += float(w[v, j])
        out[v] = max(totals, key=totals.get)
        skull[v] = on_head > 0.5
    return out, skull


HEAD_LAT, HEAD_LON = 14, 24


def head_ellipsoid(verts, skull):
    """A mannequin's head: an ellipsoid fitted to the skull's own vertices, centred on
    them, with each axis the 85th percentile of their reach, so a nose or a chin does
    not inflate it. It replaces the skull's faces (see main), so no eye, mouth or
    cavity is left to show. Projecting the skull's vertices onto an ellipsoid was
    tried first: the eye and mouth cavities folded inside out and showed as dark
    creases. Laplacian smoothing before that shrank the head into a spike."""
    h = verts[skull]
    centre = h.mean(axis=0)
    axes = np.maximum(np.percentile(np.abs(h - centre), 85, axis=0), 1e-6)
    # Up to the crown (Session 98). The 85th percentile alone stopped ~7 cm under it,
    # so the egg was wider than tall, and shorter than the stature the fit scales to
    # (measured with bake_heads.py: crown 95.1 cm, egg top 88.3 cm in bake space).
    # The bottom stays where it was, under the jaw; the top is the skull's highest point.
    bottom = centre[1] - axes[1]
    crown = h[:, 1].max()
    centre = centre.copy()
    centre[1] = (crown + bottom) / 2
    axes = axes.copy()
    axes[1] = (crown - bottom) / 2
    pts = [centre + np.array([0, axes[1], 0])]
    for i in range(1, HEAD_LAT):
        th = np.pi * i / HEAD_LAT
        for j in range(HEAD_LON):
            ph = 2 * np.pi * j / HEAD_LON
            pts.append(centre + axes * np.array([np.sin(th) * np.cos(ph), np.cos(th), np.sin(th) * np.sin(ph)]))
    pts.append(centre - np.array([0, axes[1], 0]))
    return np.array(pts), centre, axes


def onto_ellipsoid(verts, idx, centre, axes):
    """Move these vertices onto the head's ellipsoid, along their direction from its
    centre: the skull vertices still used by the neck's faces, so the neck closes
    onto the head instead of ending in the jaw's jagged edge."""
    v = verts.copy()
    for i in idx:
        d = v[i] - centre
        r = np.sqrt(((d / axes) ** 2).sum())
        if r > 1e-9:
            v[i] = centre + d / r
    return v


def ellipsoid_faces(offset):
    f = []
    top, bottom = offset, offset + 1 + (HEAD_LAT - 1) * HEAD_LON
    ring = lambda i, j: offset + 1 + i * HEAD_LON + (j % HEAD_LON)
    for j in range(HEAD_LON):
        f.append((top, ring(0, j + 1), ring(0, j)))
        f.append((bottom, ring(HEAD_LAT - 2, j), ring(HEAD_LAT - 2, j + 1)))
    for i in range(HEAD_LAT - 2):
        for j in range(HEAD_LON):
            a, b, c, d = ring(i, j), ring(i, j + 1), ring(i + 1, j), ring(i + 1, j + 1)
            f.append((a, b, d)); f.append((a, d, c))
    return f


def main():
    model = anny.Anny(topology=TOPOLOGY, local_changes="default")
    faces = model.faces.cpu().numpy().astype(np.uint16)
    n = model.template_vertices.shape[0] if hasattr(model, "template_vertices") else None
    regions = None

    def rest(gender, muscle, weight, local=None):
        c = model.get_phenotype_blendshape_coefficients(
            gender=gender, age=AGE_YOUNG, muscle=muscle, weight=weight, height=0.5, proportions=0.5,
            local_changes=local or {},
        )
        return to_three_cm(model.get_rest_vertices(c)[0].detach().cpu().numpy())

    base = rest(0.5, 0.5, 0.5)
    n = base.shape[0]
    regions, skull = regions_from_bones(model)
    # The skull's faces go; an ellipsoid head takes their place (head_ellipsoid).
    # Faces that only touch the skull stay, so the neck is closed under the head.
    faces = np.array([f for f in faces if not all(skull[i] for i in f)], dtype=np.int64)
    seam = sorted({int(i) for f in faces for i in f if skull[i]})
    head_n = 2 + (HEAD_LAT - 1) * HEAD_LON
    faces = np.concatenate([faces, np.array(ellipsoid_faces(n), dtype=np.int64)]).astype(np.uint16)
    regions = np.concatenate([regions, np.full(head_n, 3, dtype=np.uint8)])

    corners = []
    meta_corners = []
    for g in GENDERS:
        for m in MUSCLES:
            for w in WEIGHTS:
                v = rest(g, m, w)
                head, centre, axes = head_ellipsoid(v, skull)
                corners.append(np.concatenate([onto_ellipsoid(v, seam, centre, axes), head]))
                meta_corners.append({"gender": g, "muscle": m, "weight": w})

    local_labels = [l for l in LOCALS if l in model.local_change_labels]
    missing = [l for l in LOCALS if l not in model.local_change_labels]
    if missing:
        sys.exit(f"local changes not in this Anny: {missing}")
    deltas = []
    zero_head = np.zeros((head_n, 3))
    for l in local_labels:
        deltas.append(np.concatenate([rest(0.5, 0.5, 0.5, {l: 1.0}) - base, zero_head]))
        deltas.append(np.concatenate([rest(0.5, 0.5, 0.5, {l: -1.0}) - base, zero_head]))

    def q(a):
        a = np.round(np.asarray(a) * UNIT_PER_CM)
        if np.abs(a).max() > 32767:
            sys.exit("a coordinate does not fit Int16 at this unit")
        return a.astype("<i2")

    os.makedirs(OUT, exist_ok=True)
    blob = faces.astype("<u2").tobytes() + regions.astype("u1").tobytes()
    pad = (-len(blob)) % 2
    blob += b"\0" * pad
    corners_offset = len(blob)
    blob += b"".join(q(c).tobytes() for c in corners)
    locals_offset = len(blob)
    blob += b"".join(q(d).tobytes() for d in deltas)
    with open(os.path.join(OUT, "body.bin.gz"), "wb") as f:
        f.write(gzip.compress(blob, compresslevel=9, mtime=0))
    stale = os.path.join(OUT, "body.bin")
    if os.path.exists(stale):
        os.remove(stale)

    meta = {
        "source": f"Anny {anny.__version__} (NAVER LABS Europe), topology {TOPOLOGY}; baked by tools/anny/bake.py",
        "licence": "Anny code Apache-2.0 (Copyright 2025 NAVER Corp.); MakeHuman-derived assets CC0 1.0. See NOTICE.",
        "vertexCount": int(n + head_n),
        "faceCount": int(faces.shape[0]),
        "unitPerCm": UNIT_PER_CM,
        "regions": {"torso": 0, "arm": 1, "leg": 2, "head": 3},
        "layout": {
            "indices": [0, int(faces.size)],
            "regions": [int(faces.size * 2), int(n + head_n)],
            "corners": [corners_offset, len(corners)],
            "locals": [locals_offset, len(local_labels)],
        },
        "age": AGE_YOUNG,
        "anchors": {"gender": GENDERS, "muscle": MUSCLES, "weight": WEIGHTS},
        "corners": meta_corners,
        "locals": local_labels,
        "head": "the skull's faces replaced by an ellipsoid fitted to its vertices (85th-percentile reach across, from under the jaw to the crown in height)",
        # The ellipsoid's vertices and faces are the last ones: a face (bake_heads.py)
        # replaces exactly these.
        "headEllipsoid": {"vertices": [int(n), int(head_n)], "faces": [int(faces.shape[0] - len(ellipsoid_faces(0))), int(len(ellipsoid_faces(0)))]},
    }
    with open(os.path.join(OUT, "body.json"), "w") as f:
        json.dump(meta, f, indent=1)
    with open(os.path.join(OUT, "NOTICE"), "w") as f:
        f.write(
            "The body in body.bin is derived from Anny, Copyright (c) 2025 NAVER Corp.,\n"
            "licensed under the Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0).\n"
            "https://github.com/naver/anny\n\n"
            "Anny's MakeHuman-derived assets are released under CC0 1.0 Universal.\n"
            "Changes: coarse topology only; head replaced by a plain ellipsoid; phenotypes sampled at fixed anchors;\n"
            "coordinates rotated to Y-up and quantised to 0.01 cm.\n"
            "head-*.bin.gz (tools/anny/bake_heads.py): Anny's detailed head with its eyeBlink facial actions applied\n"
            "and a few face local changes; eyeballs, teeth and tongue removed; quantised the same way.\n"
        )
    print(f"wrote {OUT}: {len(blob)} bytes, {n + head_n} vertices, {faces.shape[0]} faces, "
          f"{len(corners)} corners, {len(local_labels)} local changes; regions "
          f"{np.bincount(regions, minlength=4).tolist()}")


if __name__ == "__main__":
    main()
