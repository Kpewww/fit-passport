# Anny bake

`bake.py` turns NAVER's Anny body model (Apache 2.0; MakeHuman-derived assets CC0)
into `app-web/public/anny/body.bin.gz` + `body.json` + `NOTICE`, which
`app-web/src/lib/annyBody.ts` blends and fits in the browser. `bake_heads.py` then
bakes the sculpted, closed-eye faces (`head-f1|f2|m1|m2.bin.gz` + `heads.json`),
which `app-web/src/lib/annyHead.ts` places on the fitted body. Both run offline, by
us, and never at build time or on Vercel. Run `bake.py` first: the faces are aligned
to its ellipsoid head.

```
python3 -m venv .venv && .venv/bin/pip install anny==0.6.1
.venv/bin/python tools/anny/bake.py
.venv/bin/python tools/anny/bake_heads.py
```

The model's own docs say why the bake is exact (see the script's docstring). The output is
committed, gzipped, because Vercel served the raw `.bin` uncompressed (387 KB). The body is
90 KB and each face about 52 KB; the browser inflates them with `DecompressionStream`
(Session 98).
