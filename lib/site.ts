export const SITE_NAME = "RSubsidy 補助金サーチ"
export const SITE_URL = "https://r-subsidy.reload.co.jp"
export const DEFAULT_OG_IMAGE = "/ogp.svg"

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
