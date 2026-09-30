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
  /** A one-off listing with no measurement and no printed size (Session 80). */
  refuseListingNoMeasurements: string;
  // ---- one-off listings (listingJudgement.ts, Session 80) ----
  /** A flat width, doubled: "The seller measured 24 in pit to pit … about 122 cm round." */
  listingFlat(p: { field: "chest" | "waist"; value: number; unit: "in" | "cm"; cm: number; typed: boolean; unitInferred: boolean }): string;
  /** Against a garment the wearer owns and has measured. */
  listingVsGarment(p: { refLabel: string; refCm: number; dir: DirectionKey | null; deltaCm: number }): string;
  /** Against the wearer's own measurement and preferred fit. */
  listingVsBody(p: { dim: "chest" | "waist"; targetCm: number; bodyCm: number; pref: FitPreference }): string;
  /** Only a printed size to go on. */
  listingVsLabel(p: { label: string; refLabel: string; dir: DirectionKey | null }): string;
  listingEstimatedBody: string;
  listingFragile(noiseCm: number): string;
  listingNothingToCompare: string;
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
  refuseListingNoMeasurements:
    "The seller hasn't given a measurement we could read, so we can't judge the fit yet. If the listing shows a " +
    "pit-to-pit width — in the description or a photo — enter it below.",
  listingFlat: ({ field, value, unit, cm, typed, unitInferred }) =>
    `${typed ? "You entered" : "The seller measured"} ${value} ${unit} ${field === "chest" ? "pit to pit" : "across the waist"}, laid flat — ` +
    `about ${cm} cm all the way round${unitInferred ? ` (no unit given; read as ${unit === "in" ? "inches" : "centimetres"})` : ""}.`,
  listingVsGarment: ({ refLabel, refCm, dir, deltaCm }) => {
    const ref = `your ${refLabel} (${refCm} cm)${dir ? `, which fits ${EN_DIRECTION[dir]}` : ""}`;
    return Math.abs(deltaCm) < 1
      ? `About the same as ${ref}.`
      : `${Math.abs(deltaCm)} cm ${deltaCm > 0 ? "more" : "less"} than ${ref}.`;
  },
  listingVsBody: ({ dim, targetCm, bodyCm, pref }) =>
    `For your ${bodyCm} cm ${dim} and ${art(pref)} ${pref} fit, the garment's ${dim} should be about ${targetCm} cm.`,
  listingVsLabel: ({ label, refLabel, dir }) =>
    `Labelled ${label}; the ${refLabel} in your closet${dir ? ` fits ${EN_DIRECTION[dir]}` : " fits you"}. Sizes vary between brands, so this is a rough guide.`,
  listingEstimatedBody: "Your chest here is a regional average — add your own to firm this up.",
  listingFragile: (noise) => `Close to the line: a hand-taken measurement can be off by about ${noise} cm.`,
  listingNothingToCompare: "We have the garment's measurement, but nothing of yours to compare it with yet.",
};

// ------------------------------------------------------------------ Chinese

// Wording: docs/design/chinese-copy-2026-09-30.md §02.14–02.15 and the words of
// §04.9 / §05.1–05.4, so a reason names a garment or a fit exactly as the page does.
const ZH_PREF: Record<FitPreference, string> = { slim: "修身", regular: "常规", relaxed: "宽松", oversized: "超宽松" };
const ZH_DIM: Record<Dim, string> = { chest: "胸围", waist: "腰围", shoulder: "肩宽" };
const ZH_SIGNAL: Record<SignalName, string> = {
  "measurement-fit": "你的身形数据",
  "known-good": "你已有的衣物",
  outcome: "你曾留下或退回的衣物",
  "brand-bias": "这个品牌在你身上的版型表现",
  preference: "版型偏好",
  completeness: "信息完整度",
};
const ZH_DIRECTION: Record<DirectionKey, string> = {
  "too-tight": "太紧",
  snug: "稍紧",
  "just-right": "刚好",
  roomy: "稍松",
  "too-loose": "太松",
};
const ZH_VERDICT: Record<Verdict, string> = {
  "too small": "过小",
  snug: "略紧",
  "true to size": "大小合适",
  relaxed: "宽松",
  "too big": "过大",
};
const ZH_DOMAIN: Record<SizeDomain, string> = { top: "上装", bottom: "下装", shoe: "鞋履", sock: "袜子", accessory: "配饰" };
const ZH_CATEGORY: Record<string, string> = {
  tshirt: "T 恤", shirt: "衬衫", polo: "Polo 衫", sweater: "毛衣", hoodie: "连帽衫", jacket: "夹克／外套", coat: "大衣",
  pants: "长裤", jeans: "牛仔裤", shorts: "短裤", skirt: "裙装", dress: "连衣裙",
};
// "你曾将 Uniqlo 的 M…" / "你曾将相似品牌的 M…": whose garment, with the spacing rule.
const brandText = (brand: string | null) => (brand ? ` ${brand} ` : "相似品牌");

export const ZH_TEXT: EngineText = {
  matchesFit: (pref, dims, est) =>
    `${dims.map((d) => ZH_DIM[d]).join("、")}符合你偏好的${ZH_PREF[pref]}版型。` +
    (est ? "（采用地区平均数据；补充你的身形数据，可提高推荐准确度。）" : ""),
  bindingDimension: (dim, cm, roomy) => `胸围合适，${ZH_DIM[dim]}则${roomy ? "偏宽" : "偏窄"} ${cm} cm。`,
  versusTarget: (dim, cm, larger, pref) => `相较你偏好的${ZH_PREF[pref]}版型，${ZH_DIM[dim]}${larger ? "多" : "少"} ${cm} cm。`,
  anchorRunsHere: (label, dir) => `你已有的 ${label} 穿着${ZH_DIRECTION[dir]}，据此推荐这个尺码。`,
  anchorRunsSteps: (steps, _plural, label, dir) =>
    `与你已有的 ${label} 相差 ${steps} 个尺码等级；那件衣物穿着${ZH_DIRECTION[dir]}。`,
  anchorShifted: (up, label, pref) =>
    `以你已有的 ${label} 为参照，${up ? "上调" : "下调"}一个尺码等级，以贴近${ZH_PREF[pref]}版型。`,
  anchorAdjustedSteps: (steps, label, pref) => `按${ZH_PREF[pref]}版型调整后，与已有的 ${label} 相差 ${steps} 个尺码等级。`,
  anchorMatches: (label, category) => `与已有的 ${label}（${ZH_CATEGORY[category] ?? "衣物"}）尺码相符。`,
  anchorSteps: (steps, label) => `与已有的 ${label} 相差 ${steps} 个尺码等级。`,
  exchanged: (from, to, brand) => `你曾将${brandText(brand)}的 ${from} 换成 ${to}。`,
  returned: (size, brand, how) =>
    `你曾退回${brandText(brand)}的 ${size}，原因是${how === "tight" ? "太紧" : how === "loose" ? "太松" : "合身度不合适"}。`,
  kept: (size, brand) => `你曾留下${brandText(brand)}的 ${size}，穿着合身。`,
  implausible: (issues) =>
    `这些身形数据放在一起，可能需要核对（${issues.join("；")}）。若有输入错误，请在合身护照中更正，让推荐更有依据。`,
  implausibleChestWaist: (c, w) => `胸围 ${c} cm，腰围 ${w} cm`,
  implausibleShoulderChest: (sh, c) => `肩宽 ${sh} cm，胸围 ${c} cm`,
  fragile: (lo, hi, noise) =>
    `这次推荐接近尺码分界：胸围在 ${lo}–${hi} cm 时成立，测量相差 ${noise} cm 就可能影响结果。建议重新测量一次。`,
  disagree: (signal, picked, best) =>
    `不同依据指向不同尺码：按${ZH_SIGNAL[signal]}，应选 ${picked}；综合最有力的依据，推荐 ${best}。`,
  verdictOff: (label, verdict) =>
    `仅按身形数据判断，${label} 显示为“${ZH_VERDICT[verdict]}”。当前推荐还参考了其他依据，请以此为起点，再核对尺码表。`,
  closetScattered: "衣橱里的穿着评价存在差异：有些偏紧，有些偏松，因此这次还难以确定你想要的松紧程度。",
  largestSize: (pref) => `这是商品提供的最大尺码。按${ZH_PREF[pref]}版型选择，已到可选范围的上限。`,
  smallestSize: (pref) => `这是商品提供的最小尺码。按${ZH_PREF[pref]}版型选择，已到可选范围的下限。`,
  alternative: (label, pref) =>
    `备选：${label} 也较接近。若你希望${pref === "slim" ? "更宽松一些" : "更贴身一些"}，可以考虑。`,
  undeterminedHelp: "补充胸围，或添加一件同类型且合身的衣物，即可让这次推荐有据可依。",
  limitedData: "商品信息有限，当前推荐依据你的衣橱和版型偏好。",
  crossDomain: (closet, product) =>
    `衣橱中已有${closet.map((d) => ZH_DOMAIN[d]).join("、")}，当前商品属于${ZH_DOMAIN[product]}。` +
    `不同品类的尺码难以直接参照，本次主要依据身形数据和版型偏好。添加一件你已有的${ZH_DOMAIN[product]}，可让推荐更有依据。`,
  easeContradiction: (n, pref) =>
    `这 ${n} 件已有尺寸信息的衣物，穿着评价存在差异，难以形成一致的松紧偏好。本次采用你填写的${ZH_PREF[pref]}版型。` +
    `重新评价其中一两件，即可帮助厘清偏好。`,
  easeAdjusted: ({ more, garments, targetCm, statedCm, pref, excluded }) =>
    `依据衣橱中 ${garments} 件已有尺寸信息的衣物，调整到你实际穿着时偏好的${more ? "更大余量" : "更小余量"}。` +
    `目标余量为 ${targetCm} cm，你填写的${ZH_PREF[pref]}版型对应 ${statedCm} cm。` +
    (excluded > 0 ? `另有 ${excluded} 件衣物因评价与其他记录矛盾，或尺寸数据异常，未纳入本次参考。` : ""),
  brandRuns: (big, n, brand) =>
    `你曾记录 ${n} 件 ${brand} 单品${big ? "偏大" : "偏小"}，因此本次${big ? "下调" : "上调"}一个尺码等级。`,
  refuseUnreadable: "商店未向我们提供可读取的页面，因此没有可用的尺码表。取得商品尺码数据后，才能给出有依据的推荐。",
  refuseNotApparel: "未在此页面找到服装商品。请粘贴某件具体衣物的商品页链接，如衬衫、外套或长裤。",
  refuseUnsupported: (domain) =>
    `目前支持上装和下装，暂不支持${ZH_DOMAIN[domain]}。推荐需要将身形数据与商品尺寸对应，而当前缺少这一品类所需的数据，因此无法给出可靠的推荐。`,
  refuseNoChartExtension:
    "当前页面未找到尺码表，暂时无法依据商店数据推荐尺码。若页面有“尺码指南”或“尺码表”入口，请打开后重新查询。尺码表通常会在打开后才加载。",
  refuseNoChartServer:
    "已找到服装商品，但没有可读取的尺码表，暂时无法依据商店数据推荐尺码。许多商店在打开尺码指南后才加载尺码表；使用 Fit Passport 浏览器插件，可在打开后读取。",
  notConnected:
    "当前浏览器尚未连接你的 Fit Passport。请在同一浏览器中打开一次 Fit Passport，让插件连接到你的身形数据和衣橱，再重新查询。若屏蔽了第三方 Cookie，插件将无法识别登录状态。",
  verdictName: (v) => ZH_VERDICT[v],
  refuseListingNoMeasurements:
    "卖家没有标注可读取的尺寸，暂时无法判断是否合身。如果商品描述或图片里有腋下平铺宽度，请在下方填写。",
  listingFlat: ({ field, value, unit, cm, typed, unitInferred }) =>
    `${typed ? "你填写的" : "卖家实测"}${field === "chest" ? "腋下平铺宽度" : "腰部平铺宽度"}为 ${value} ${unit === "in" ? "英寸" : "cm"}，换算为一圈约 ${cm} cm` +
    `${unitInferred ? `（未注明单位，按${unit === "in" ? "英寸" : "厘米"}理解）` : ""}。`,
  listingVsGarment: ({ refLabel, refCm, dir, deltaCm }) => {
    const ref = `你那件${dir ? `穿着${ZH_DIRECTION[dir]}的` : ""} ${refLabel}（${refCm} cm）`;
    return Math.abs(deltaCm) < 1 ? `与${ref}基本相同。` : `比${ref}${deltaCm > 0 ? "多" : "少"} ${Math.abs(deltaCm)} cm。`;
  },
  listingVsBody: ({ dim, targetCm, bodyCm, pref }) =>
    `按你的${ZH_DIM[dim]} ${bodyCm} cm 和${ZH_PREF[pref]}版型，衣物${ZH_DIM[dim]}约 ${targetCm} cm 较理想。`,
  listingVsLabel: ({ label, refLabel, dir }) =>
    `这件标注 ${label}；你衣橱里的 ${refLabel} ${dir ? `穿着${ZH_DIRECTION[dir]}` : "穿着合身"}。不同品牌的尺码标签差异较大，仅供参考。`,
  listingEstimatedBody: "这里的胸围是地区平均值，补充你自己的胸围后，判断会更可靠。",
  listingFragile: (noise) => `接近分界：手量尺寸可能有约 ${noise} cm 的误差。`,
  listingNothingToCompare: "已有衣物尺寸，但还缺少你的身形数据或同类衣物作对照。",
};

export function engineText(locale: Locale | undefined): EngineText {
  return locale === "zh" ? ZH_TEXT : EN_TEXT;
}
