# Make six MetaHuman faces for /body

**Who:** the founder, or anyone with a capable PC and an Epic account. **Effort:** an
afternoon. **Why:** /body's faces (Anny's statistical averages) read as generic and
stereotyped. MetaHuman gives realistic, good-looking faces that a commercial web app
may use (licence checked: `tools/metahuman/README.md`). Unreal is a GUI tool, and only a
person can shape a face and judge whether it looks good. Everything after the export is
scripted and self-tested.

## Do

1. Install Unreal Engine 5.6+ with **MetaHuman Creator Core Data**; enable the
   **MetaHuman Creator** and **glTF Exporter** plugins.
2. Make six MetaHuman Characters: `f-a`, `f-b`, `f-c`, `m-a`, `m-b`, `m-c`.
   - Neutral expression, no hair or beard.
   - Never from a photo or scan of a real person, and never aimed at one.
   - Three visibly different faces per sex.
3. Autorig → Export → Geometry Export → Head → right-click the head Skeletal Mesh →
   Asset Actions → Export as `f-a.glb` (or `.fbx`), and so on for each face.
4. Send the six files.

Full steps: `tools/metahuman/README.md`.

## Decide

- **Eyes:** the export has them open. Choose a statue's blank eyes (default, no extra
  work) or try the UNVERIFIED closed-eye steps in the README.
- **Which machine:** a Windows PC with a dedicated GPU is the safer bet. Whether
  MetaHuman Creator runs on this Mac is not checked.

## Then (engineering)

Run `tools/metahuman/selftest.py`, then
`bake_metahuman_heads.py <folder> --keep-eyes`, review the screenshots with the
founder, and ship. Delete this file in that commit.
