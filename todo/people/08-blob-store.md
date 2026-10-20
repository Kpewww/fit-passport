# Create the Vercel Blob store for closet photos

**Who:** the founder (it is the Vercel account). **Effort:** ~5 minutes.

Closet photos are still in the database (about 90 KB each). Neon's free 0.5 GB fills at
roughly 340 people with ten photos each, and then every write fails. The code to move
them is in place (Session 100d, `todo/engineering/07`).

1. **Create the store.** In Vercel, open the project, go to **Storage → Create → Blob**,
   name it `closet-photos`, and connect it to the project (Production and Preview).
   This adds `BLOB_READ_WRITE_TOKEN` to the project's environment.
2. **Redeploy** (any push does it). From then on, new photos go to the store.
3. **Move the existing photos.** In `app-web/`:
   - pull the production environment with `vercel env pull`, or copy `DATABASE_URL`
     and `BLOB_READ_WRITE_TOKEN` from the dashboard;
   - run `npm run db:pg:generate`;
   - run `node scripts/photos-to-blob.mjs` for a dry run, then again with `--apply`.

   Or hand the two values to engineering to run it.
