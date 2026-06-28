export const SITE_NAME = "RSubsidy 補助金サーチ"
export const SITE_URL = "https://r-subsidy.reload.co.jp"
export const DEFAULT_OG_IMAGE = "/ogp.svg"
export const OPERATOR_NAME = "株式会社リロード"
export const OPERATOR_URL = "https://reload.co.jp"
export const SITE_DESCRIPTION =
  "3,200件超の補助金・助成金を掲載。都道府県・業種・目的から絞り込み、現在受付中の制度をすぐに確認できます。中小企業・個人事業主向けの無料補助金データベース。"

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString()
}

export function trimTrailingSlash(value: string) {
  return value.endsWith("/") && value !== "/" ? value.slice(0, -1) : value
}

export type BreadcrumbItem = { name: string; url: string }

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: OPERATOR_NAME,
    url: OPERATOR_URL,
    logo: absoluteUrl("/favicon.svg"),
    sameAs: [OPERATOR_URL],
  }
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja",
    description: SITE_DESCRIPTION,
    publisher: { "@id": absoluteUrl("/#organization") },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/subsidies/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}
