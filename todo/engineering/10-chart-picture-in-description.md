# A size chart that is a picture inside the description (图文详情)

**Found in Session 79a.**

Many Taobao shops have no 尺码信息 table: the size chart is one of the pictures in
the 图文详情 description, with no alt text or file name that says so. The
extension now notices a picture-only description and says the sizing does not
depend on it — but when there is **no** table, the chart is probably one of those
pictures, and nothing reads it.

The server already has a vision reader (`callVisionLLM`, extractorLLM.ts) for
chart images it can identify. The unsolved part is **which picture**: a listing
has 20–60 of them, and sending all of them costs money and sends images that are
not the product's chart.

Options to evaluate, none started:
- let the shopper pick the chart picture in the popup (one click, exact);
- a cheap on-device filter (aspect ratio, a grid of lines) before any vision call.

Needs a real Taobao listing without a 尺码信息 table to design against.
