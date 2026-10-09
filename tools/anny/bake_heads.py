"""Bake sculpted, closed-eye faces for the realistic body — Session 98, phase 3.

Run by us, offline, after bake.py (same venv):

    .venv/bin/python tools/anny/bake_heads.py      # writes app-web/public/anny/head-*.bin.gz

The founder's choice: a sculpture's face, eyes closed, one per sex, not a person. So each face is Anny's own detailed head (its "anny" topology, 13,718
vertices for the whole body) with:
  - the eyes closed by Anny's eyeBlink facial actions (ARKit names, CC0 assets);
  - the eyeballs, teeth and tongue left out (they are separate pieces of the mesh;
    only the skin is kept), no hair, no lashes;
  - the shape varied only through Anny's face local changes (head, chin, cheek bones,
    nose, mouth, brows). Anny's ancestry phenotypes are not among the default
    phenotypes and are never set: a face here says nothing about where anyone is from.

How it sits on the body. The body (bake.py) has an ellipsoid where the skull was. A
face is stored in the same space as the body it was baked against (gender 0 or 1,
muscle and weight 0.5), together with that body's ellipsoid centre and semi-axes.
The browser moves and scales the face from that ellipsoid onto the fitted body's own
(annyHead.ts), and hides the ellipsoid. The face keeps a ring of neck below the jaw,
so the body's neck runs up inside it and no seam shows.

Each face is one file, fetched only when chosen:
  head-<id>.bin.gz   gzip of: Uint16 indices (faces x 3), then Int16 positions (x 3),
                     1 unit = 0.01 cm
  heads.json         per face: id, sex, vertex and face counts, the reference
                     ellipsoid (centre, semi-axes, cm)
"""

import gzip
import json
import os
import sys
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import anny

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bake import AGE_YOUNG, OUT, TOPOLOGY, UNIT_PER_CM, head_ellipsoid, regions_from_bones, to_three_cm  # noqa: E402

FACIAL = {"eyeBlinkLeft": 1.0, "eyeBlinkRight": 1.0}
# Anny: gender 0 = male, 1 = female. Local changes only; see the docstring.
FACES = [
    # The founder kept one face per sex (Session 98d); the B variants were dropped.
    {"id": "f1", "sex": "female", "gender": 1.0, "locals": {}},
    {"id": "m1", "sex": "male", "gender": 0.0, "locals": {}},
]
# How far below the chin the face's neck reaches, cm: enough to overlap the body's.
NECK_BELOW_CHIN_CM = 5.0


def rest(model, gender, local_changes=None, facial=None):
    _, ph, lc, fa = model.get_tensor_inputs(
        None,
        {"gender": gender, "age": AGE_YOUNG, "muscle": 0.5, "weight": 0.5, "height": 0.5, "proportions": 0.5},
        local_changes or {},
        facial or {},
    )
    c = model._get_phenotype_blendshape_coefficients(ph, lc, fa)
    return to_three_cm(model.get_rest_vertices(c)[0].detach().cpu().numpy())


def skin_component(faces, n):
    """The vertices of the largest connected piece: the skin, without eyes or teeth."""
    parent = np.arange(n)

    def find(a):
        while parent[a] != a:
            parent[a] = parent[parent[a]]
            a = parent[a]
        return a

    for a, b, c in faces:
        for x, y in ((a, b), (b, c)):
            rx, ry = find(x), find(y)
            if rx != ry:
                parent[rx] = ry
    roots = np.array([find(i) for i in range(n)])
    biggest = np.bincount(roots).argmax()
    return roots == biggest


def main():
    coarse = anny.Anny(topology=TOPOLOGY, local_changes="default")
    _, coarse_skull = regions_from_bones(coarse)
    detail = anny.Anny(local_changes="default", facial_actions=list(FACIAL))
    missing = [l for f in FACES for l in f["locals"] if l not in detail.local_change_labels]
    if missing:
        sys.exit(f"local changes not in this Anny: {missing}")

    regions, skull = regions_from_bones(detail)
    faces_all = detail.faces.cpu().numpy()
    n = len(regions)
    skin = skin_component(faces_all, n)

    out_meta = []
    for face in FACES:
        # The reference: the coarse body's ellipsoid at this sex, as bake.py makes it.
        ref = rest(coarse, face["gender"])
        _, centre, axes = head_ellipsoid(ref, coarse_skull)

        v = rest(detail, face["gender"], face["locals"], FACIAL)
        chin = v[skull & skin, 1].min()
        keep = skin & (regions == 3) & (v[:, 1] >= chin - NECK_BELOW_CHIN_CM)
        tri = np.array([t for t in faces_all if keep[t].all()])
        used = np.unique(tri)
        remap = -np.ones(n, dtype=np.int64)
        remap[used] = np.arange(len(used))
        tri = remap[tri]
        pos = v[used]

        q = np.round(pos * UNIT_PER_CM)
        if np.abs(q).max() > 32767 or len(used) > 65535:
            sys.exit("a face does not fit its Int16 / Uint16 layout")
        blob = tri.astype("<u2").tobytes() + q.astype("<i2").tobytes()
        path = os.path.join(OUT, f"head-{face['id']}.bin.gz")
        with open(path, "wb") as fh:
            fh.write(gzip.compress(blob, compresslevel=9, mtime=0))
        out_meta.append({
            "id": face["id"], "sex": face["sex"],
            "vertexCount": int(len(used)), "faceCount": int(len(tri)),
            "ref": {"centre": [round(float(x), 3) for x in centre], "axes": [round(float(x), 3) for x in axes]},
            "bytes": os.path.getsize(path),
        })
        print(f"{face['id']}: {len(used)} vertices, {len(tri)} faces, {os.path.getsize(path)} bytes gz; "
              f"centre {np.round(centre, 1)} axes {np.round(axes, 1)}; skull centre here {np.round(v[skull & skin].mean(0), 1)}")

    meta = {
        "source": f"Anny {anny.__version__} (NAVER LABS Europe), topology anny; baked by tools/anny/bake_heads.py",
        "licence": "Anny code Apache-2.0 (Copyright 2025 NAVER Corp.); MakeHuman-derived assets CC0 1.0. See NOTICE.",
        "unitPerCm": UNIT_PER_CM,
        "facialActions": FACIAL,
        "faces": out_meta,
    }
    with open(os.path.join(OUT, "heads.json"), "w") as fh:
        json.dump(meta, fh, indent=1)


if __name__ == "__main__":
    main()
