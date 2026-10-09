"""Self-test for bake_metahuman_heads.py, before real MetaHuman files go through it.

Builds a MetaHuman-like file from Anny's own detailed head: metres, facing -X, a long
neck, teeth, eyeballs and eyelashes as named parts. Runs the bake into a copy of the
assets, and checks the result lands on the Anny face it stands in for (the same
person, so the surfaces should agree to a few millimetres). Measured when written:
median 0.33 cm, 90th percentile 0.58 cm (open versus closed eyes, and the reduction).

    .venv/bin/python tools/metahuman/selftest.py
"""

import gzip
import json
import os
import shutil
import subprocess
import sys
import tempfile
import warnings

warnings.filterwarnings("ignore")
import numpy as np
import trimesh

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "anny"))
import anny  # noqa: E402
from bake import regions_from_bones  # noqa: E402
from bake_heads import ANCESTRY, rest  # noqa: E402

ASSETS = os.path.join(HERE, "..", "..", "app-web", "public", "anny")


def fake_metahuman(path):
    d = anny.Anny(local_changes="default", phenotypes="all")
    regions, skull = regions_from_bones(d)
    faces = d.faces.numpy()
    v = rest(d, 1.0, {}, {}, ANCESTRY["a"])  # eyes open, as an unposed export
    n = len(v)
    par = np.arange(n)

    def find(a):
        while par[a] != a:
            par[a] = par[par[a]]
            a = par[a]
        return a

    for t in faces:
        for x, y in ((t[0], t[1]), (t[1], t[2])):
            rx, ry = find(x), find(y)
            if rx != ry:
                par[rx] = ry
    roots = np.array([find(i) for i in range(n)])
    counts = np.bincount(roots)
    order = np.argsort(-counts)
    chin = v[skull & (roots == order[0]), 1].min()
    others = [r for r in order[1:] if counts[r] > 10]
    eyes = sorted(others, key=lambda r: counts[r])[:2]
    teeth = [r for r in others if r not in eyes][0]
    masks = {
        "head_lod0_mesh": (roots == order[0]) & (v[:, 1] > chin - 14) & ((regions == 3) | (regions == 0)) & (np.hypot(v[:, 0], v[:, 2] - 2) < 14),
        "eyeLeft_lod0_mesh": roots == eyes[0],
        "eyeRight_lod0_mesh": roots == eyes[1],
        "teeth_lod0_mesh": roots == teeth,
    }
    scene = trimesh.Scene()
    for name, mask in masks.items():
        tri = faces[mask[faces].all(axis=1)]
        used = np.unique(tri)
        remap = -np.ones(n, dtype=int)
        remap[used] = np.arange(len(used))
        m = trimesh.Trimesh(v[used] / 100.0, remap[tri], process=False)
        m.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [0, 1, 0]))
        m.apply_translation([0.3, 1.2, -0.1])
        scene.add_geometry(m, node_name=name, geom_name=name)
    scene.add_geometry(trimesh.creation.box((0.02, 0.002, 0.005)), node_name="eyelashes_lod0_mesh", geom_name="eyelashes_lod0_mesh")
    scene.export(path)


def load(folder, fid):
    heads = json.load(open(os.path.join(folder, "heads.json")))
    m = next(f for f in heads["faces"] if f["id"] == fid)
    raw = gzip.decompress(open(os.path.join(folder, f"head-{fid}.bin.gz"), "rb").read())
    ic = m["faceCount"] * 3
    return np.frombuffer(raw, "<i2", offset=ic * 2, count=m["vertexCount"] * 3).reshape(-1, 3) / heads["unitPerCm"], m


def main():
    work = tempfile.mkdtemp()
    os.makedirs(os.path.join(work, "in"))
    fake_metahuman(os.path.join(work, "in", "f-a.glb"))
    shutil.copytree(ASSETS, os.path.join(work, "out"))
    env = {**os.environ, "FP_ANNY_OUT": os.path.join(work, "out")}
    subprocess.run([sys.executable, os.path.join(HERE, "bake_metahuman_heads.py"), os.path.join(work, "in"), "--keep-eyes"], check=True, env=env)
    new, meta = load(os.path.join(work, "out"), "f-a")
    old, _ = load(ASSETS, "f-a")
    assert meta["source"] == "metahuman"
    assert np.argmax(new[:, 2]) is not None and new[np.argmax(new[:, 2]), 2] > 10, "the face must look down +Z"
    sub = new[np.random.default_rng(0).choice(len(new), 1500, replace=False)]
    d = np.array([np.min(np.linalg.norm(old - q, axis=1)) for q in sub])
    print(f"distance to the Anny face: median {np.median(d):.2f} cm, 90th {np.percentile(d, 90):.2f} cm")
    assert np.median(d) < 0.6 and np.percentile(d, 90) < 1.0, "the bake does not land on the face it replaces"
    print("selftest passed")


if __name__ == "__main__":
    main()
