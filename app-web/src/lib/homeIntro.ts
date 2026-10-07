// The homepage's first-visit intro — Session 90.
//
// The first time in a browser session that someone opens the homepage (typed, a link,
// a new tab), a full-screen ink intro plays: thin lines and the mark's two threads
// compose a giant mark, which then shrinks into the hero's mark while the black fades
// into the page (components/HomeIntro.tsx). Every other arrival plays the inline
// reveal in the hero.
//
// Whether to play has to be decided BEFORE the first paint, or the page would flash
// and then be covered (or a black screen would flash and vanish). So this script runs
// inline in <head>, marks <html data-fp-intro="play">, and CSS (globals.css) shows the
// overlay only when that mark is there. No JS, reduced motion, another page, or an
// intro already seen this session: no mark, no overlay.

/** sessionStorage: this session has had the intro. */
export const INTRO_SEEN_KEY = "fp-intro-seen";

export const HOME_INTRO_SCRIPT =
  `try{if(location.pathname==="/"&&!sessionStorage.getItem(${JSON.stringify(INTRO_SEEN_KEY)})` +
  `&&!matchMedia("(prefers-reduced-motion: reduce)").matches)` +
  `document.documentElement.setAttribute("data-fp-intro","play")}catch(e){}`;

/** The intro has finished or been skipped: page back to normal, and never again this session. */
export function endIntro() {
  try { sessionStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* storage blocked */ }
  document.documentElement.removeAttribute("data-fp-intro");
}

export function introPlaying(): boolean {
  return typeof document !== "undefined" && document.documentElement.getAttribute("data-fp-intro") === "play";
}
