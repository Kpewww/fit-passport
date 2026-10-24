"use client";

import { ArrowUpRight, BrowserIcon, CaretDown, Globe, Info, LinkIcon, Robot, Ruler, Warning } from "@/components/Icon";
import { useLocale, useT } from "@/i18n/client";
import type { Product, Source } from "./types";

/**
 * Where the numbers came from, as one row of plain statements with an icon
 * each. It used to be a row of coloured pills (green, sky, amber, stone) that
 * the reader had to decode. Every claim below is made only when it is true —
 * the rules are unchanged from the pills they replaced.
 */
export function SourceRow({ product, source }: { product: Product; source: Source }) {
  const t = useT("check");
  const locale = useLocale();
  const reader =
    source.extractedBy === "llm-text" ? t("source.sizesAiText")
      : source.extractedBy === "llm-vision" ? t("source.sizesAiImage")
      : source.extractedBy === "picked-picture" ? t("source.sizesPicked")
      : source.extractedBy === "uploaded-picture" ? t("source.sizesUploaded")
      : null;
  const host = source.host || t("source.thePage");
  return (
    <div className="space-y-2 text-xs text-ink-soft">
      {/* A demo link is answered from a curated sample, not from any page — say so
          and make no claim about reading (Session 80). */}
      {source.sizesFrom === "fixture" ? (
        <p className="inline-flex items-center gap-1.5 font-medium text-ink"><Info size={16} className="text-ink-faint" />{t("source.demo")}</p>
      ) : (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Who read it. A brand chart means this product's page was never opened
            — so we say "identified", never "read". The extension hands us the
            page from the user's own browser, which is how we reach retailers
            our server is refused by. */}
        {source.extractedBy === "uploaded-picture" ? (
          // An uploaded chart (Session 100): no page was read at all.
          <span className="inline-flex items-center gap-1.5"><Ruler size={16} className="text-ink-faint" />{t("source.uploaded")}</span>
        ) : source.sizesFrom === "brand-chart" || source.fetch === "blocked" || source.fetch === "unreachable" ? (
          // Also when the store refused our server and the numbers are the
          // user's own, typed from the listing: nothing was read (Session 80).
          <span className="inline-flex items-center gap-1.5"><LinkIcon size={16} className="text-ink-faint" />{t("source.identified")}</span>
        ) : source.fetch === "extension" ? (
          <span className="inline-flex items-center gap-1.5"><BrowserIcon size={16} className="text-ink-faint" />{t("source.readInBrowser", { host })}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5"><Globe size={16} className="text-ink-faint" />{t("source.readFrom", { host })}</span>
        )}
        {/* Where the SIZE CHART came from — three cases, three amounts of trust. */}
        {source.sizesFrom === "seller" ? (
          <span className="inline-flex items-center gap-1.5">
            <Ruler size={16} className="text-ink-faint" />{source.extractedBy === "seller-typed" ? t("source.sellerTyped") : t("source.seller")}
          </span>
        ) : source.sizesFrom === "brand-chart" ? (
          <span
            className="inline-flex items-center gap-1.5"
            title={t("source.brandGuideTitle")}
          >
            <Ruler size={16} className="text-ink-faint" />{t("source.brandGuide", { brand: product.brand ?? "" })}
          </span>
        ) : source.sizesFrom === "estimated" ? (
          <span
            className="inline-flex items-center gap-1.5 font-medium text-warn"
            title={t("source.estimatedTitle")}
          >
            <Warning size={16} />{t("source.estimated")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            {reader ? <Robot size={16} className="text-ink-faint" /> : <Ruler size={16} className="text-ink-faint" />}
            {reader ?? t("source.sizesRead")}
          </span>
        )}
      </div>
      )}
      {/* The chart is checkable or it is not trustworthy — link the page the
          numbers came from, and date it, because a size guide goes stale. */}
      {source.sizesFrom === "brand-chart" && source.chart ? (
        <p className="text-ink-faint">
          {source.measurementKind === "body" ? t("source.brandBody") : t("source.brandGarment")}{" "}
          <a href={source.chart.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
            {t("source.checkGuide")}
          </a>{" "}
          {t("source.readOn", { date: source.chart.capturedAt })}
        </p>
      ) : null}
      {/* A chartless page estimated from evidence, not refused (Session 103): say what on. */}
      {source.sizesFrom === "estimated" && source.estimate?.sources.length ? (
        <p className="text-ink-faint">
          {t("source.estimateFrom", { sources: (locale === "zh" ? source.estimate.sourcesZh : source.estimate.sources).join(locale === "zh" ? "；" : "; ") })}
        </p>
      ) : null}
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-medium text-ink-soft hover:text-ink">
          <CaretDown size={14} className="transition-transform group-open:rotate-180" />
          {t("source.productDetails")}
        </summary>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Detail label={t("source.retailer")} value={product.retailer} />
          <Detail label={t("source.brand")} value={product.brand} />
          <Detail label={t("source.category")} value={product.category} />
          <Detail label={t("source.material")} value={product.material} />
          <Detail label={t("source.sizesFound")} value={t("source.sizesFoundValue", { n: product.sizeOptions.length })} />
          <Detail label={t("source.fitNote")} value={product.fitNotes} />
        </dl>
        <a href={product.url} target="_blank" rel="noopener noreferrer" title={product.url}
          className="mt-3 inline-flex max-w-full items-center gap-1 truncate text-brand hover:underline">
          <ArrowUpRight size={14} className="flex-shrink-0" /><span className="truncate">{product.url}</span>
        </a>
      </details>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-meta uppercase text-ink-faint">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

