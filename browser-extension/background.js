// Fit Passport — background service worker (Session 85).
//
// One job: on FIRST install, open the welcome page on the Fit Passport site. It
// shows how to pin the icon, and opening the site is itself what connects the
// extension — it creates the session the popup's checks need. Updates and
// re-enables open nothing.
//
// No permission is needed: chrome.tabs.create works without "tabs". The address
// is the first server in config.js — production in the store build.

importScripts("config.js");

chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason !== "install") return;
  var cfg = globalThis.FP_CONFIG;
  var origin = cfg && cfg.origins && cfg.origins[0] ? cfg.origins[0].url : "https://www.fitpassport.fit";
  // Through the session hand-over, as every page the popup opens (popup.js openSite).
  chrome.tabs.create({ url: origin + "/api/session/carry?next=" + encodeURIComponent("/extension/welcome") });
});
