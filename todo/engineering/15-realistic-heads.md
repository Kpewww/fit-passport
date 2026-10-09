# Realistic heads for /body: options

**Asked by the founder, 2026-10-09 (Session 98g).** The faces on /body (Anny's
statistical average faces, mixed, eyes closed) read as stereotyped and not
good-looking. The founder wants a production plan for realistic heads. Faces stay
labelled A / B / C, never by any people, and are chosen by the wearer, never inferred.

**Fixed constraint.** No real person's likeness, and no "approaching" one. A face
modelled after a named film star is that person's likeness, whatever the method, and a
commercial product may not use it. "Good-looking" is aimed at through what research
names (averageness, symmetry, balanced proportions), never through a reference person.

## What any option must deliver

- 3 faces × 2 sexes, eyes closed, no hair, no eyeballs or teeth: a sculpture, as now.
- Geometry only; the page draws its own material (mannequin colour or measured skin).
- Under about 60 KB gzipped per face, loaded only when chosen.
- A neck that reaches 5 cm under the chin: `joinFaceAtNeck` joins it to the body.
- A licence that allows a commercial web app to ship the mesh to browsers.

## Options

### A. Keep Anny, tuned (today)
- Free, CC0 / Apache 2.0, already joined to the body.
- Its faces are averages by construction. Mixing ancestries (98g) softened them; local
  face changes can tune proportions further.
- Ceiling: it stays a generic face.

### B. Microsoft Rocketbox (MIT)
- 115 rigged avatars, a range of people. The licence is MIT according to the GitHub
  API's licence field for microsoft/Microsoft-Rocketbox (checked 2026-10-09); the
  repository's root LICENSE path returned 404, so the file itself was not read.
- Game quality from the 2010s: the faces are plain, built for textures, which a
  sculpture drops.
- Work per face: cut out the head, close the eyes by hand (the avatars have open
  eyes), remove the eyeballs, reduce and align. Roughly a day each.

### C. MetaHuman (Epic)
- The best-looking faces available, made in MetaHuman Creator by moving features, not
  by copying anyone.
- Licence: secondary sources (CG Channel, 2025-06-04) report that since Unreal 5.6
  MetaHumans may be used in other engines and creative software, free under US$1M
  revenue. Epic's licence page needs a login; **UNVERIFIED until the EULA is read.**
- Creation now happens in the Unreal 5.6+ editor. Secondary sources say the web
  creator shuts on 2026-11-05 (UNVERIFIED).
- Work: someone runs Unreal on a capable PC (the founder's Windows laptop may do; the
  editor is heavy) and creates 6 faces with closed eyes. Export to FBX, then a script
  (ours) reduces the head from tens of thousands of triangles to our budget, strips
  eyes and teeth, and bakes our format. The scripting is ours; the creation is a
  person's.

### D. Licensed head scans (e.g. 3D Scan Store, deep3dstudio)
- Real people who consented to be scanned and sold for use: the most realistic.
- Licences vary by vendor. deep3dstudio's standard licence caps one commercial project
  at 2,000 sales or 20,000 views; its extended licence lifts the caps. A web app needs
  the extended licence and **written confirmation** that shipping the mesh to browsers
  is covered.
- Scans have open eyes; closing them is sculpting work (an artist).

### E. Commission a sculptor
- 3 + 3 heads to our brief: closed eyes, sculpture, a stated direction for
  "good-looking" (proportions, averageness, symmetry), and not resembling any real
  person, written into the contract.
- Copyright assigned to us.
- Cost and time are not yet quoted (UNVERIFIED): ask two or three freelancers for
  quotes with the brief above.

### F. AI text-to-3D (Meshy, Tripo, …)
- Fast and cheap, but faces come out asymmetric with messy topology, and the terms
  differ by plan. Not as the main route.

## Recommendation

1. **C, MetaHuman**, if someone can run Unreal for an afternoon: the best faces, and
   the remaining work is scripting we can do. Read Epic's EULA first.
2. Otherwise **E, a sculptor**, with the brief above; or D with an extended licence
   if scans are acceptable.
3. Keep A as the fallback, and as what ships until then.

## Sources

- MetaHuman licensing: [CG Channel, 2025-06-04](https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/), [Digital Production](https://digitalproduction.com/2025/06/05/metahumans-graduate-ready-for-unity-godot-and-the-fab-cash-register/), [Epic licence page (login)](https://www.metahuman.com/en-US/license)
- Rocketbox: [github.com/microsoft/Microsoft-Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox)
- Reallusion (Character Creator, considered): [content policy](https://www.reallusion.com/license/content.html)
- Scans: [3D Scan Store, commercial](https://www.3dscanstore.com/studios-and-commercial-customer-information), [deep3dstudio on ArtStation](https://deep3dstudio.artstation.com/store/r59KA/asian-male-30s-head-scan-011)
- Attractiveness: Langlois & Roggman 1990, "Attractive faces are only average", Psychological Science 1:115
