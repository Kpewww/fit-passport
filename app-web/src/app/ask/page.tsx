// /ask used to be its own page. Questions now live inside /community, because
// asking about fit and browsing other people's fit are the same activity and
// splitting them made the community look emptier than it was.
//
// The route is kept as a permanent redirect: thread links (/ask/[id]) are shared,
// and anything already pointing at /ask should land on the questions section
// rather than a 404.

import { redirect } from "next/navigation";

export default function AskRedirect() {
  redirect("/community#questions");
}
