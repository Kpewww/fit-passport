"""Turn MetaHuman heads into /body's faces — Session 98h, the founder's option C.

Run by us, offline, with the Anny venv plus `pip install trimesh pyfqmr pygltflib`
(all MIT); Blender (any recent version) only if a file is FBX:

    .venv/bin/python tools/metahuman/bake_metahuman_heads.py <folder> [--keep-eyes]

<folder> holds up to six files named for the faces they replace: f-a, f-b, f-c, m-a,
m-b, m-c, each .glb, .gltf or .fbx, exported from Unreal (see README.md here). A face
with no file keeps its Anny version.

Licence (checked 2026-10-09 on metahuman.com/en-US/license, Epic's FAQ): MetaHuman
characters may be used "across all engines and creative software"; at runtime in
other engines they are "Non-Engine Products" and owe no royalties; over US$1M annual
gross revenue, rendering them outside Unreal needs an Unreal seat licence; they may not
be used to train AI. Nothing here trains anything.

What it does, per file:
  1. Lists every mesh in the file, keeps the head's skin (and, with --keep-eyes, the
     eyeballs, for a statue's blank eyes), drops teeth, tongue, saliva, eyelashes,
     eye shells and edges, cartilage, hair and brows. The list is printed: check it.
  2. Works out units (metres or centimetres) and which way the face looks, and turns
     it to face +Z, as the body does.
  3. Anchors it to the Anny face it replaces (tools/anny/bake_heads.py): the same chin
     height, the same chin-to-crown height, the same neck axis just under the chin. So
     the browser's placement (annyHead.ts placeFace) and neck join
     (neckCut.ts joinFaceAtNeck) work unchanged.
  4. Keeps the neck to 5 cm under the chin, reduces the mesh to about the Anny faces'
     size (pyfqmr, quadric decimation), and writes head-<id>.bin.gz in the same layout.

The anchors (each Anny face's chin, crown, neck axis, reference ellipsoid) are taken
from the Anny files the first time and kept in anchors.json, so a second run does not
anchor a MetaHuman head on another MetaHuman head.
"""

import argparse
import gzip
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
import pyfqmr
import trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("FP_ANNY_OUT", os.path.join(HERE, "..", "..", "app-web", "public", "anny"))
ANCHORS = os.path.join(HERE, "anchors.json")
BLENDER = os.environ.get("BLENDER", "/Applications/Blender.app/Contents/MacOS/Blender")
IDS = ["f-a", "f-b", "f-c", "m-a", "m-b", "m-c"]
UNIT_PER_CM = 100
NECK_BELOW_CHIN_CM = 5.0
TARGET_TRIANGLES = 8600

# Parts of a MetaHuman head that are not the sculpture (MetaHuman part names, matched
# loosely; the printed list is the check).
DROP = re.compile(r"teeth|tongue|saliva|eyeshell|eye_?shell|lash|eyeedge|eye_?edge|cartilage|hair|brow|beard|moustache|mustache|fuzz|peach|occlusion|cornea", re.I)
EYE = re.compile(r"eye_?(left|right|l\b|r\b)|eyeball|eye_?l_|eye_?r_", re.I)


# ---- reading ----------------------------------------------------------------

def to_glb(path):
    """An FBX file, converted to glTF binary through Blender; anything else as it is."""
    if not path.lower().endswith(".fbx"):
        return path
    out = os.path.join(tempfile.mkdtemp(), "head.glb")
    script = (
        "import bpy, sys\n"
        "bpy.ops.wm.read_factory_settings(use_empty=True)\n"
        f"bpy.ops.import_scene.fbx(filepath={path!r})\n"
        f"bpy.ops.export_scene.gltf(filepath={out!r}, export_format='GLB', export_apply=True)\n"
    )
    subprocess.run([BLENDER, "--background", "--python-expr", script], check=True, capture_output=True)
    return out


def parts(path):
    """Every mesh in the file, in world space, with its name."""
    scene = trimesh.load(path, force="scene")
    out = []
    for node in scene.graph.nodes_geometry:
        transform, geom = scene.graph[node]
        mesh = scene.geometry[geom].copy()
        mesh.apply_transform(transform)
        out.append((f"{node}/{geom}", mesh))
    return out


def select(meshes, keep_eyes):
    skin = max(meshes, key=lambda nm: len(nm[1].vertices))
    kept, report = [], []
    for name, mesh in meshes:
        if mesh is skin[1]:
            decision = "keep (skin: the largest part)"
        elif EYE.search(name) and not DROP.search(name):
            decision = "keep (eye)" if keep_eyes else "drop (eye; --keep-eyes keeps it)"
        elif DROP.search(name):
            decision = "drop"
        else:
            decision = "drop (not recognised)"
        report.append(f"    {len(mesh.vertices):7d} vertices  {decision:34s} {name}")
        if decision.startswith("keep"):
            kept.append(mesh)
    print("\n".join(report))
    merged = trimesh.util.concatenate(kept)
    merged.merge_vertices()
    return merged


# ---- measuring --------------------------------------------------------------

def to_cm_facing_z(v):
    """Centimetres, Y up, the face looking down +Z."""
    v = np.asarray(v, dtype=np.float64)
    if np.ptp(v[:, 1]) < 3:  # a head and neck under 3 units tall: metres
        v = v * 100.0
    # Front-to-back is the longer horizontal axis of a head; the face's side is the
    # one the vertices crowd towards (a face is far denser than the back of a skull).
    top = v[v[:, 1] > v[:, 1].min() + 0.4 * np.ptp(v[:, 1])]
    xz = top[:, [0, 2]] - top[:, [0, 2]].mean(axis=0)
    _, _, vt = np.linalg.svd(xz, full_matrices=False)
    axis = vt[0]
    lo, hi = (xz @ axis).min(), (xz @ axis).max()
    if (lo + hi) / 2 > 0:  # the bounding box's middle lies behind the mean: the face is on the + side
        axis = -axis
    angle = np.arctan2(axis[0], axis[1])  # rotate so `axis` becomes +Z
    c, s = np.cos(-angle), np.sin(-angle)
    x, z = v[:, 0] * c + v[:, 2] * s, -v[:, 0] * s + v[:, 2] * c
    return np.stack([x, v[:, 1], z], axis=1)


def landmarks(v):
    """Chin, crown, and the neck's centre (x, z) 2 cm under the chin.

    The chin is read off the face's midline profile, not against the bottom of the
    neck (a MetaHuman neck reaches lower and leans forward): from the nose tip down,
    the throat is the profile's deepest point, and the chin the lowest point of the
    bulge above it that stands at least three quarters of the way out to its tip.
    """
    y1 = v[:, 1].max()
    upper = v[v[:, 1] > v[:, 1].min() + 0.3 * np.ptp(v[:, 1])]
    cx = (upper[:, 0].min() + upper[:, 0].max()) / 2
    mid = v[np.abs(v[:, 0] - cx) < 1.0]
    step = 0.5
    ys = np.arange(mid[:, 1].min(), mid[:, 1].max(), step)
    prof = np.array([mid[(mid[:, 1] >= y) & (mid[:, 1] < y + step), 2].max(initial=-np.inf) for y in ys])
    ok = np.isfinite(prof)
    ys, prof = ys[ok], prof[ok]
    nose = ys[np.argmax(prof)]
    band = (ys > nose - 20) & (ys < nose - 6)
    throat = ys[band][np.argmin(prof[band])]
    above = (ys > throat) & (ys < nose - 4)
    tip = prof[above].max()
    zt = prof[ys == throat][0]
    chin = ys[above & (prof >= zt + 0.75 * (tip - zt))].min()
    ring = v[np.abs(v[:, 1] - (chin - 2.0)) < 0.5]
    centre = ((ring[:, 0].min() + ring[:, 0].max()) / 2, (ring[:, 2].min() + ring[:, 2].max()) / 2)
    return {"chin": float(chin), "crown": float(y1), "neck": [float(centre[0]), float(centre[1])]}


# ---- anchors from the Anny faces ---------------------------------------------

def read_head(path, meta, unit):
    raw = gzip.decompress(open(path, "rb").read())
    ic = meta["faceCount"] * 3
    tri = np.frombuffer(raw, dtype="<u2", count=ic).reshape(-1, 3)
    pos = np.frombuffer(raw, dtype="<i2", offset=ic * 2, count=meta["vertexCount"] * 3).reshape(-1, 3) / unit
    return pos.astype(np.float64), tri


def anchors():
    if os.path.exists(ANCHORS):
        return json.load(open(ANCHORS))
    heads = json.load(open(os.path.join(OUT, "heads.json")))
    out = {}
    for f in heads["faces"]:
        if f.get("source") == "metahuman":
            sys.exit("heads.json already has MetaHuman faces and anchors.json is missing: re-run tools/anny/bake_heads.py first")
        pos, _ = read_head(os.path.join(OUT, f"head-{f['id']}.bin.gz"), f, heads["unitPerCm"])
        lm = landmarks(pos)
        lm["chin"] = f["chinY"]  # the bake's own chin, the one the browser joins under
        out[f["id"]] = {**lm, "sex": f["sex"], "variant": f.get("variant"), "ref": f["ref"], "chinY": f["chinY"]}
    json.dump(out, open(ANCHORS, "w"), indent=1)
    return out


# ---- the bake ---------------------------------------------------------------

def bake(path, anchor, keep_eyes):
    head = select(parts(to_glb(path)), keep_eyes)
    v = to_cm_facing_z(head.vertices)
    f = np.asarray(head.faces)
    lm = landmarks(v)
    scale = (anchor["crown"] - anchor["chin"]) / (lm["crown"] - lm["chin"])
    v = np.stack([
        anchor["neck"][0] + (v[:, 0] - lm["neck"][0]) * scale,
        anchor["chin"] + (v[:, 1] - lm["chin"]) * scale,
        anchor["neck"][1] + (v[:, 2] - lm["neck"][1]) * scale,
    ], axis=1)
    keep = v[:, 1] >= anchor["chin"] - NECK_BELOW_CHIN_CM
    f = f[keep[f].all(axis=1)]
    simp = pyfqmr.Simplify()
    simp.setMesh(v, f)
    simp.simplify_mesh(target_count=TARGET_TRIANGLES, aggressiveness=5, preserve_border=True, verbose=False)
    v, f, _ = simp.getMesh()
    used = np.unique(f)
    remap = -np.ones(len(v), dtype=np.int64)
    remap[used] = np.arange(len(used))
    v, f = v[used], remap[f]
    q = np.round(v * UNIT_PER_CM)
    if np.abs(q).max() > 32767 or len(v) > 65535:
        sys.exit("a face does not fit its Int16 / Uint16 layout")
    return v, f, f.astype("<u2").tobytes() + q.astype("<i2").tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--keep-eyes", action="store_true", help="keep the eyeballs: a statue's blank eyes")
    args = ap.parse_args()
    marks = anchors()
    heads_path = os.path.join(OUT, "heads.json")
    heads = json.load(open(heads_path))
    by_id = {f["id"]: f for f in heads["faces"]}
    done = []
    for fid in IDS:
        src = next((os.path.join(args.folder, n) for n in os.listdir(args.folder)
                    if os.path.splitext(n)[0].lower() == fid and n.lower().endswith((".glb", ".gltf", ".fbx"))), None)
        if not src:
            continue
        print(f"{fid}: {os.path.basename(src)}")
        v, f, blob = bake(src, marks[fid], args.keep_eyes)
        out = os.path.join(OUT, f"head-{fid}.bin.gz")
        with open(out, "wb") as fh:
            fh.write(gzip.compress(blob, compresslevel=9, mtime=0))
        a = marks[fid]
        by_id[fid] = {
            "id": fid, "sex": a["sex"], "variant": a["variant"], "source": "metahuman",
            "vertexCount": int(len(v)), "faceCount": int(len(f)),
            "ref": a["ref"], "chinY": a["chinY"], "bytes": os.path.getsize(out),
        }
        print(f"    -> {len(v)} vertices, {len(f)} triangles, {os.path.getsize(out)} bytes gz")
        done.append(fid)
    heads["faces"] = [by_id[i] for i in IDS if i in by_id]
    if done:
        heads["metahuman"] = (
            "Faces marked source=metahuman are MetaHuman characters (Epic Games), used under the Unreal "
            "Engine EULA as Non-Engine Products; see metahuman.com/license."
        )
    json.dump(heads, open(heads_path, "w"), indent=1)
    print(f"replaced: {', '.join(done) or 'nothing'}")


if __name__ == "__main__":
    main()
