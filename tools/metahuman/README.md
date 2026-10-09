# MetaHuman faces for /body

Option C of `todo/engineering/15-realistic-heads.md`, chosen by the founder on
2026-10-09. People make the faces in Unreal; `bake_metahuman_heads.py` does the rest.

## Licence

Checked on [metahuman.com/en-US/license](https://www.metahuman.com/en-US/license)
(Epic's FAQ, 2026-10-09):
- MetaHuman characters may be used "across all engines and creative software".
- At runtime in other engines they are "Non-Engine Products": no royalties.
- Over US$1M annual gross revenue, rendering them outside Unreal needs an Unreal seat
  licence.
- They may not be used to train AI.

The EULA page itself sits behind a bot check and was not read; the FAQ is Epic's own
summary of it.

## Making the faces (a person, in Unreal Engine 5.6 or later)

Epic's guides:
[MetaHuman Creator in Unreal Engine](https://dev.epicgames.com/documentation/metahuman/metahuman-creator-in-unreal-engine),
[creating a character](https://dev.epicgames.com/documentation/metahuman/creating-a-character),
[export tool](https://dev.epicgames.com/documentation/metahuman/metahuman-creator-export-tool-in-unreal-engine).

1. **Install.** Install Unreal Engine 5.6+ from the Epic Games Launcher with
   **MetaHuman Creator Core Data** ticked in the install options. Make a blank project
   and enable the **MetaHuman Creator** plugin, plus **glTF Exporter** for .glb files.
   Autorigging needs an internet connection.
2. **Create.** In the Content Browser, right-click → MetaHuman → MetaHuman Character.
   Make six, named `f-a`, `f-b`, `f-c`, `m-a`, `m-b`, `m-c`.
3. **Shape each face.** Brief:
   - **Neutral expression.** No hair, no beard; eyebrows and lashes do not matter, the
     script drops them.
   - **Not like any real person.** Never start from a photo or a scan of someone, and
     never aim at a named person. Aim at balanced proportions and symmetry.
   - **Three visibly different faces per sex:** face shape, nose, lips, eyes.
   - **No stereotypes.** They are labelled A, B and C only.
4. **Rig it.** Run the autorig. Then Export category → **Geometry Export → Head** into
   the project.
5. **Export the head.** Right-click the exported head Skeletal Mesh → Asset Actions →
   Export, and choose `.glb` (glTF) or `.fbx`. Name the file after the face (`f-a.glb`).
6. **Eyes (optional, UNVERIFIED steps).** The export is the neutral rig, eyes open. The
   default is to keep the eyeballs as a statue's blank eyes. To try closed eyes:
   - place the character in a level;
   - in Sequencer, set the face control rig's eye-blink controls to closed;
   - make a static mesh from that pose (Skeletal Mesh editor → Make Static Mesh, or
     Convert Actor to Static Mesh);
   - export that.
   If the closed version imports with the lids shut, use it.

Send the six files.

## Baking them

```
.venv/bin/pip install trimesh pyfqmr pygltflib      # MIT; Blender only for .fbx
.venv/bin/python tools/metahuman/selftest.py        # the converter still lands faces right
.venv/bin/python tools/metahuman/bake_metahuman_heads.py <folder> --keep-eyes
```

- Drop `--keep-eyes` if the files have the eyes closed.
- The script prints every part it keeps or drops; read that list.
- `anchors.json` holds where each Anny face sits. Each MetaHuman head is anchored to it
  by chin, crown and neck axis, so the browser's placement and neck join work
  unchanged.
- Re-running `tools/anny/bake_heads.py` restores the Anny faces.
