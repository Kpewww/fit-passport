// Every sentence the engine writes, in English and Chinese — Session 79.
//
// The engine explains itself in prose (reasons, notes, refusals). That prose is
// built HERE and nowhere else: the scorers call `M.something(values)` with the
// numbers they computed, and this file only words them. So the two languages can
// never disagree about a number, and a new sentence cannot be added in one
// language only — `EngineText` is an interface, and both implementations must
// satisfy it to compile.
//
// The English is the wording the engine has always used, character for
// character: every existing test asserts on it, and they pass unchanged. The
// Chinese is written to docs/design/chinese-copy.md (glossary, spacing, voice).
//
// Pure, no runtime imports from the engine (types only), so it cannot create a
// cycle.

import type { FitPreference } from "./sizing";
import type { SizeDomain } from "./sizeSystems";
import type { Locale } from "@/i18n/config";

export type Verdict = "too small" | "snug" | "true to size" | "relaxed" | "too big";
export type DirectionKey = "too-tight" | "snug" | "just-right" | "roomy" | "too-loose";
export type SignalName = "measurement-fit" | "known-good" | "preference" | "outcome" | "completeness" | "brand-bias";
export type Dim = "chest" | "waist" | "shoulder";

export interface EngineText {
  // ---- measurement fit ----
  matchesFit(pref: FitPreference, dims: Dim[], estimated: boolean): string;
  bindingDimension(dim: Dim, cm: string, roomy: boolean): string;
  versusTarget(dim: Dim, cm: string, larger: boolean, pref: FitPreference): string;
  // ---- closet anchor ----
  anchorRunsHere(label: string, dir: DirectionKey): string;
  anchorRunsSteps(steps: string, plural: boolean, label: string, dir: DirectionKey): string;
  anchorShifted(up: boolean, label: string, pref: FitPreference): string;
  anchorAdjustedSteps(steps: number, label: string, pref: FitPreference): string;
  anchorMatches(label: string, category: string): string;
  anchorSteps(steps: number, label: string): string;
  // ---- purchase outcomes ----
  exchanged(from: string, to: string, brand: string | null): string;
  returned(size: string, brand: string | null, how: "tight" | "loose" | "unknown"): string;
  kept(size: string, brand: string | null): string;
  // ---- notes beside the answer ----
  implausible(issues: string[]): string;
  implausibleChestWaist(chest: number, waist: number): string;
  implausibleShoulderChest(shoulder: number, chest: number): string;
  fragile(lo: number, hi: number, noiseCm: number): string;
  disagree(signal: SignalName, picked: string, best: string): string;
  verdictOff(label: string, verdict: Verdict): string;
  closetScattered: string;
  largestSize(pref: FitPreference): string;
  smallestSize(pref: FitPreference): string;
  alternative(label: string, pref: FitPreference): string;
  undeterminedHelp: string;
  limitedData: string;
  crossDomain(closet: SizeDomain[], product: SizeDomain): string;
  // ---- learned ease (personalEase.ts) ----
  easeContradiction(garments: number, pref: FitPreference): string;
  easeAdjusted(p: { more: boolean; garments: number; targetCm: string; statedCm: number; pref: FitPreference; excluded: number }): string;
  // ---- brand bias (brandBias.ts) ----
  brandRuns(big: boolean, count: number, brand: string): string;
  // ---- refusals (checkPolicy.ts) ----
  refuseUnreadable: string;
  refuseNotApparel: string;
  refuseUnsupported(domain: SizeDomain): string;
  refuseNoChartExtension: string;
  refuseNoChartServer: string;
  /** The extension's request carried no Fit Passport session (checkPolicy.sessionGate). */
  notConnected: string;
  // ---- words ----
  verdictName(v: Verdict): string;
}

// ------------------------------------------------------------------ English

const EN_SIGNAL: Record<SignalName, string> = {
  "measurement-fit": "your measurements",
  "known-good": "a garment you already own",
  outcome: "what you kept or returned before",
  "brand-bias": "how this brand has run for you",
  preference: "preference",
  completeness: "completeness",
};
const EN_DIRECTION: Record<DirectionKey, string> = {
  "too-tight": "too tight",
  snug: "a bit snug",
  "just-right": "just right",
  roomy: "a bit roomy",
  "too-loose": "too loose",
};
const EN_DOMAIN_ONE: Record<SizeDomain, string> = {
  top: "top",
  bottom: "bottoms",
  shoe: "footwear",
  sock: "socks",
  accessory: "accessory",
};
const EN_DOMAIN_PLURAL: Record<SizeDomain, string> = {
  top: "tops",
  bottom: "bottoms",
  shoe: "footwear",
  sock: "socks",
  accessory: "accessories",
};
const s = (n: number) => (n === 1 ? "" : "s");
const art = (w: string) => (/^[aeiou]/i.test(w) ? "an" : "a");

export const EN_TEXT: EngineText = {
  matchesFit: (pref, dims, est) =>
    `Matches a ${pref} fit for ${dims.join(" + ")}${est ? " (regional averages — add yours for accuracy)" : ""}`,
  bindingDimension: (dim, cm, roomy) => `Chest works, but the ${dim} runs ${cm}cm ${roomy ? "roomy" : "narrow"}`,
  versusTarget: (dim, cm, larger, pref) =>
    `${dim.charAt(0).toUpperCase() + dim.slice(1)} ${cm}cm ${larger ? "larger" : "smaller"} than your ${pref} target`,
  anchorRunsHere: (label, dir) => `Your ${label} runs ${EN_DIRECTION[dir]}, so this is the size that should sit right`,
  anchorRunsSteps: (steps, plural, label, dir) =>
    `${steps} step${plural ? "s" : ""} from your ${label}, which runs ${EN_DIRECTION[dir]}`,
  anchorShifted: (up, label, pref) => `Sized ${up ? "up" : "down"} from your ${label} for a ${pref} fit`,
  anchorAdjustedSteps: (steps, label, pref) => `${steps} step${steps > 1 ? "s" : ""} from your ${pref}-adjusted ${label}`,
  anchorMatches: (label, category) => `Matches your ${label} (${category})`,
  anchorSteps: (steps, label) => `${steps} step${steps > 1 ? "s" : ""} from your ${label}`,
  exchanged: (from, to, brand) => `You exchanged a ${from} for a ${to} in ${brand ?? "similar"}`,
  returned: (size, brand, how) =>
    `You returned a ${size} in ${brand ?? "similar"} (${how === "tight" ? "too tight" : how === "loose" ? "too loose" : "fit issue"})`,
  kept: (size, brand) => `You kept a ${size} in ${brand ?? "similar"} with a good fit`,
  implausible: (issues) =>
    `Your measurements look unusual together (${issues.join("; ")}). If one is a ` +
    `typo, fixing it on your passport will sharpen this.`,
  implausibleChestWaist: (c, w) => `chest ${c} cm with waist ${w} cm`,
  implausibleShoulderChest: (sh, c) => `shoulder ${sh} cm with chest ${c} cm`,
  fragile: (lo, hi, noise) =>
    `This one is close: it holds for a chest between ${lo} and ${hi} cm, and a ` +
    `${noise} cm difference in how you measure could change it — ` +
    `measuring again is worth it.`,
  disagree: (signal, picked, best) =>
    `Your signals disagree — by ${EN_SIGNAL[signal]}, ${picked}; by the strongest overall evidence, ${best}.`,
  verdictOff: (label, verdict) =>
    `On your measurements alone ${label} reads "${verdict}" — ` +
    `we're recommending it on other evidence, so treat this as a starting point ` +
    `and check the chart.`,
  closetScattered:
    "Your closet reports disagree with each other — some of these run tight for you and " +
    "some run loose — so we're less sure which you want here.",
  largestSize: (pref) => `This is the largest size offered — for ${art(pref)} ${pref} fit you're at the top of the range.`,
  smallestSize: (pref) => `This is the smallest size offered — for ${art(pref)} ${pref} fit you're at the bottom of the range.`,
  alternative: (label, pref) =>
    `Alternative: ${label} is close — consider it if you prefer ${pref === "slim" ? "extra room" : "a snugger fit"}.`,
  undeterminedHelp:
    "Add your chest measurement, or one garment of this type that fits you well — " +
    "either one turns this into a real answer.",
  limitedData: "Limited product data — recommendation based on your closet and preference.",
  crossDomain: (closet, product) =>
    `Your closet is ${closet.map((d) => EN_DOMAIN_ONE[d]).join(" & ")}, but this is a ${EN_DOMAIN_ONE[product]} item. ` +
    `Sizing across garment types is unreliable — we're going mostly on your ` +
    `measurements and preference. Add a ${EN_DOMAIN_ONE[product]} you own for a real recommendation.`,
  easeContradiction: (n, pref) =>
    `Your fit reports on ${n} measured garments contradict each other — ` +
    `some say you want more room than others give you — so we used your stated ` +
    `${pref} fit instead of learning from them. Re-rating one or two would settle it.`,
  easeAdjusted: ({ more, garments, targetCm, statedCm, pref, excluded }) =>
    `Adjusted to the ${more ? "more room" : "less room"} you actually wear — from ${garments} ` +
    `garment${s(garments)} in your closet whose own ` +
    `measurements we have (${targetCm}cm target vs ${statedCm}cm for ${pref})` +
    (excluded > 0
      ? `; ${excluded} garment${s(excluded)} left out because ` +
        `${excluded === 1 ? "its report contradicts" : "their reports contradict"} the others ` +
        `or ${excluded === 1 ? "its measurements look" : "their measurements look"} wrong.`
      : "."),
  brandRuns: (big, n, brand) =>
    `You've reported ${n} ${brand} item${s(n)} running ${big ? "big — sized down one" : "small — sized up one"}.`,
  refuseUnreadable:
    "We couldn't read that page — the retailer didn't serve it to us, so we have no size chart. " +
    "Anything we showed you here would be our guess rather than their numbers.",
  refuseNotApparel:
    "We couldn't find a clothing item on that page. Paste a link to a specific garment — a product page for a shirt, jacket, trousers and so on.",
  refuseUnsupported: (domain) =>
    `We don't size ${EN_DOMAIN_PLURAL[domain]} yet. The engine works by comparing your ` +
    `measurements to the garment's, and we don't hold the measurement that would ` +
    `need — so anything we told you here would be a guess dressed up as an answer. ` +
    `Tops and bottoms work today.`,
  refuseNoChartExtension:
    "We didn't find a size chart on this page, so any sizes we showed you would be made up " +
    "rather than the retailer's. If the page has a \"Size guide\" or \"Size chart\" link, " +
    "open it and check again — the chart often only loads once it's opened.",
  refuseNoChartServer:
    "We found the garment on this page but no size chart we could read, so any sizes we " +
    "showed you would be made up rather than the retailer's. Many stores only load the chart " +
    "when you open their size guide — the Fit Passport browser extension can read it once " +
    "it's open.",
  notConnected:
    "This browser isn't connected to your Fit Passport yet. Open Fit Passport once in this " +
    "browser (that's where your measurements and closet live), then check again. If you block " +
    "third-party cookies, the extension can't see your Fit Passport session.",
  verdictName: (v) => v,
};

// ------------------------------------------------------------------ Chinese

const ZH_PREF: Record<FitPreference, string> = { slim: "修身", regular: "常规", relaxed: "宽松", oversized: "超宽松" };
const ZH_DIM: Record<Dim, string> = { chest: "胸围", waist: "腰围", shoulder: "肩宽" };
const ZH_SIGNAL: Record<SignalName, string> = {
  "measurement-fit": "你的尺寸",
  "known-good": "你已有的一件衣服",
  outcome: "你以前留下或退掉的衣服",
  "brand-bias": "这个牌子在你身上的表现",
  preference: "偏好",
  completeness: "完整度",
};
const ZH_DIRECTION: Record<DirectionKey, string> = {
  "too-tight": "太紧",
  snug: "略紧",
  "just-right": "刚好",
  roomy: "略松",
  "too-loose": "太松",
};
const ZH_VERDICT: Record<Verdict, string> = {
  "too small": "太小",
  snug: "略紧",
  "true to size": "正合适",
  relaxed: "略宽松",
  "too big": "太大",
};
const ZH_DOMAIN: Record<SizeDomain, string> = { top: "上装", bottom: "下装", shoe: "鞋", sock: "袜子", accessory: "配饰" };
const ZH_CATEGORY: Record<string, string> = {
  tshirt: "T恤", shirt: "衬衫", polo: "POLO 衫", sweater: "毛衣", hoodie: "卫衣", jacket: "夹克", coat: "大衣",
  pants: "裤子", jeans: "牛仔裤", shorts: "短裤", skirt: "半身裙", dress: "连衣裙",
};
// "你那件 Uniqlo M" / "同类商品的 M": whose garment, with the spacing rule.
const owner = (brand: string | null) => (brand ? ` ${brand} 的` : "同类商品的");

export const ZH_TEXT: EngineText = {
  matchesFit: (pref, dims, est) =>
    `按${ZH_PREF[pref]}版型，${dims.map((d) => ZH_DIM[d]).join("、")}${dims.length > 1 ? "都" : ""}合适` +
    (est ? "（用的是地区平均尺寸，填上你自己的会更准）" : ""),
  bindingDimension: (dim, cm, roomy) => `胸围合适，但${ZH_DIM[dim]}${roomy ? "大了" : "小了"} ${cm} cm`,
  versusTarget: (dim, cm, larger, pref) => `${ZH_DIM[dim]}比你的${ZH_PREF[pref]}目标${larger ? "大" : "小"} ${cm} cm`,
  anchorRunsHere: (label, dir) => `你那件 ${label} 穿着${ZH_DIRECTION[dir]}，所以这个码应该正合适`,
  anchorRunsSteps: (steps, _plural, label, dir) => `和你那件穿着${ZH_DIRECTION[dir]}的 ${label} 差 ${steps} 个码`,
  anchorShifted: (up, label, pref) => `照你想要的${ZH_PREF[pref]}版型，比你那件 ${label} ${up ? "大" : "小"}一码`,
  anchorAdjustedSteps: (steps, label, pref) => `和按${ZH_PREF[pref]}版型调整后的 ${label} 差 ${steps} 个码`,
  anchorMatches: (label, category) => `和你那件 ${label}（${ZH_CATEGORY[category] ?? "衣服"}）一致`,
  anchorSteps: (steps, label) => `和你那件 ${label} 差 ${steps} 个码`,
  exchanged: (from, to, brand) => `你把${owner(brand)} ${from} 换成了 ${to}`,
  returned: (size, brand, how) =>
    `你退过${owner(brand)} ${size}（${how === "tight" ? "太紧" : how === "loose" ? "太松" : "不合身"}）`,
  kept: (size, brand) => `你留下了${owner(brand)} ${size}，穿着合身`,
  implausible: (issues) =>
    `你的几个尺寸放在一起有点反常（${issues.join("；")}）。如果是填错了，在身材档案里改过来，推荐会更准。`,
  implausibleChestWaist: (c, w) => `胸围 ${c} cm 配腰围 ${w} cm`,
  implausibleShoulderChest: (sh, c) => `肩宽 ${sh} cm 配胸围 ${c} cm`,
  fragile: (lo, hi, noise) =>
    `这个码卡在临界附近：胸围在 ${lo}–${hi} cm 之间都选它，而量法上 ${noise} cm 的出入就可能让结果改变——值得再量一次。`,
  disagree: (signal, picked, best) => `几条依据说法不一：按${ZH_SIGNAL[signal]}是 ${picked}；按最有力的综合依据是 ${best}。`,
  verdictOff: (label, verdict) =>
    `只看你的尺寸，${label} 算是“${ZH_VERDICT[verdict]}”——我们是根据其他依据推荐它的，请把它当作起点，再对照一下尺码表。`,
  closetScattered: "你衣橱里的反馈互相矛盾——有的说偏紧，有的说偏松——所以我们不太确定你这次想要哪种。",
  largestSize: (pref) => `这已经是最大的码了——按${ZH_PREF[pref]}版型，你落在这个尺码范围的最上端。`,
  smallestSize: (pref) => `这已经是最小的码了——按${ZH_PREF[pref]}版型，你落在这个尺码范围的最下端。`,
  alternative: (label, pref) =>
    `备选：${label} 也很接近——如果你想要${pref === "slim" ? "宽松一点" : "贴身一点"}，可以考虑它。`,
  undeterminedHelp: "填上你的胸围，或者添一件这类穿着合身的衣服——有其中一样，就能给出真正的答案。",
  limitedData: "商品数据有限——这次的推荐依据你的衣橱和偏好。",
  crossDomain: (closet, product) =>
    `你衣橱里的是${closet.map((d) => ZH_DOMAIN[d]).join("和")}，而这件是${ZH_DOMAIN[product]}。` +
    `跨品类推荐尺码并不可靠——这次主要依据你的尺寸和偏好。添一件你自己的${ZH_DOMAIN[product]}，才能给出真正的推荐。`,
  easeContradiction: (n, pref) =>
    `你对衣橱里 ${n} 件有尺寸数据的衣服的反馈互相矛盾——有的说想要更多余量，有的正相反——` +
    `所以这次用你设定的${ZH_PREF[pref]}版型，没有从中学习。重新评一两件就能理清。`,
  easeAdjusted: ({ more, garments, targetCm, statedCm, pref, excluded }) =>
    `已按你实际穿着的放松量调整（${more ? "更宽松" : "更贴身"}）——依据衣橱里 ${garments} 件有尺寸数据的衣服` +
    `（目标 ${targetCm} cm，${ZH_PREF[pref]}版型默认 ${statedCm} cm）` +
    (excluded > 0 ? `；有 ${excluded} 件没有算进去，因为反馈和其他衣服矛盾，或尺寸看起来不对。` : "。"),
  brandRuns: (big, n, brand) => `你反馈过 ${n} 件 ${brand} 偏${big ? "大——这次小一码" : "小——这次大一码"}。`,
  refuseUnreadable: "我们没能读到这个页面——商家没有把它提供给我们，所以没有尺码表。这时给出的任何结果，都只是我们的猜测，而不是商家的数据。",
  refuseNotApparel: "这个页面上没找到衣服。请粘贴一件具体衣服的商品页链接，比如衬衫、夹克、裤子。",
  refuseUnsupported: (domain) =>
    `我们暂时还不能为${ZH_DOMAIN[domain]}推荐尺码。引擎靠对比你的尺寸和衣服的尺寸来推荐，而这里需要的那项尺寸我们没有——` +
    `这时说什么，都只是披着答案外衣的猜测。上装和下装目前都可以。`,
  refuseNoChartExtension:
    "这一页上没找到尺码表，所以给出的任何尺码都是编的，而不是商家的。如果页面上有「尺码指南」「尺码表」或「尺码信息」，点开后再查一次——尺码表常常要点开才会加载。",
  refuseNoChartServer:
    "我们在这一页找到了衣服，但没有读得懂的尺码表，所以给出的任何尺码都是编的，而不是商家的。很多商店要点开尺码指南才会加载尺码表——Fit Passport 浏览器插件可以在它打开后读取。",
  notConnected:
    "这个浏览器还没有连上你的 Fit Passport。先在这个浏览器里打开一次 Fit Passport（你的尺寸和衣橱都在那里），再查一次。如果你屏蔽了第三方 Cookie，插件就看不到你的 Fit Passport 登录状态。",
  verdictName: (v) => ZH_VERDICT[v],
};

export function engineText(locale: Locale | undefined): EngineText {
  return locale === "zh" ? ZH_TEXT : EN_TEXT;
}
