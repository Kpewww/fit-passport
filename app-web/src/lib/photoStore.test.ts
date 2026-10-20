import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async (path: string) => ({ url: `https://store.public.blob.vercel-storage.com/${path.replace(".jpg", "-Ab12.jpg")}` })),
  del: vi.fn(async () => undefined),
  get: vi.fn(async () => ({ statusCode: 200, stream: new Response("img").body, blob: { contentType: "image/jpeg" } })),
}));
import { del, put } from "@vercel/blob";
import { PHOTO_ROUTE, dropPhotos, photoForClient, readPhoto, storePhoto } from "./photoStore";

const PHOTO = "data:image/jpeg;base64," + Buffer.from("not really a jpeg").toString("base64");

describe("closet photos in object storage (Session 100)", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  afterEach(() => { delete process.env.BLOB_READ_WRITE_TOKEN; });

  it("changes nothing until the store is set up", async () => {
    expect(await storePhoto("u1", PHOTO)).toBe(PHOTO);
    expect(put).not.toHaveBeenCalled();
    expect(photoForClient("item1", PHOTO)).toBe(PHOTO);
  });

  it("stores a new photo and keeps only a reference, under a hashed owner", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "t";
    const ref = await storePhoto("user-123", PHOTO);
    expect(ref.startsWith("blob:https://")).toBe(true);
    expect(vi.mocked(put).mock.calls[0][0]).not.toContain("user-123");
    expect(vi.mocked(put).mock.calls[0][2]).toMatchObject({ access: "private", contentType: "image/jpeg", addRandomSuffix: true });
  });

  it("never gives the browser the storage address", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "t";
    const ref = await storePhoto("u1", PHOTO);
    const seen = photoForClient("item1", ref)!;
    expect(seen.startsWith(PHOTO_ROUTE + "item1?v=")).toBe(true);
    expect(seen).not.toContain("blob.vercel-storage");
  });

  it("drops stored files only, and never fails for it", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "t";
    await dropPhotos([PHOTO, null, "blob:https://x/a.jpg"]);
    expect(del).toHaveBeenCalledWith(["https://x/a.jpg"]);
    vi.mocked(del).mockRejectedValueOnce(new Error("gone"));
    await expect(dropPhotos(["blob:https://x/b.jpg"])).resolves.toBeUndefined();
  });

  it("reads a private file with the token, on the server", async () => {
    process.env.BLOB_READ_WRITE_TOKEN = "t";
    const got = await readPhoto("blob:https://x/a.jpg");
    expect(got?.type).toBe("image/jpeg");
    expect(new TextDecoder().decode(got!.bytes)).toBe("img");
    expect(await readPhoto("data:image/jpeg;base64,AAAA")).toBeNull();
  });
});
