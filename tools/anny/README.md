# Anny bake

`bake.py` turns NAVER's Anny body model (Apache 2.0; MakeHuman-derived assets CC0)
into `app-web/public/anny/body.bin` + `body.json` + `NOTICE`, which
`app-web/src/lib/annyBody.ts` blends and fits in the browser. It runs offline, by us,
and never at build time or on Vercel.

```
python3 -m venv .venv && .venv/bin/pip install anny==0.6.1
.venv/bin/python tools/anny/bake.py
```

The model's own docs say why the bake is exact (see the script's docstring). The output is
committed: about 380 KB raw, 90 KB gzipped (Session 97).
