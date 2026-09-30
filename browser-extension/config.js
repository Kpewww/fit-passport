// Where Fit Passport lives.
//
// Every origin here must also appear in manifest.json "host_permissions". That
// permission is what lets the popup reach the API at all (extension pages with
// host permission are not subject to CORS) and what makes Chrome send the Fit
// Passport session cookie with the request: an extension's request to a site it
// holds host permission for is treated as same-site. The first entry is the
// default.
globalThis.FP_CONFIG = {
  version: "0.3.0",
  origins: [
    { label: "fit-passport.vercel.app", url: "https://fit-passport.vercel.app" },
    { label: "localhost:3000 (development)", url: "http://localhost:3000" },
  ],
};
