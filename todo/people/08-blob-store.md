# Create the Vercel Blob store for closet photos

**Who:** the founder (it is the Vercel account). **Effort:** ~5 minutes.

Closet photos are still in the database (about 90 KB each). Neon's free 0.5 GB fills at
roughly 340 people with ten photos each, and then every write fails. The code to move
them is in place (Session 100d, `todo/engineering/07`).

1. **Create the store.** In Vercel, open the project and go to **Storage → Create → Blob**.
   - Name it `closet-photos`.
   - Region: the one the project's functions run in.
   - Access: **Private**.
   - **Tick "Add a read-write token env var"**: the code switches on
     `BLOB_READ_WRITE_TOKEN`.
   - Connect it to Production and Preview.
2. **Redeploy** (any push does it). From then on, new photos go to the store.
3. **Move the existing photos.** In `app-web/`:
   - pull the production environment with `vercel env pull`, or copy `DATABASE_URL`
     and `BLOB_READ_WRITE_TOKEN` from the dashboard;
   - run `npm run db:pg:generate`;
   - run `node scripts/photos-to-blob.mjs` for a dry run, then again with `--apply`.

   Or hand the two values to engineering to run it.
