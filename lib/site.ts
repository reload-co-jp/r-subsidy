export const SITE_NAME = "補助金ポータル"
export const SITE_URL = "https://r-subsidy.reload.co.jp"
export const DEFAULT_OG_IMAGE = "/ogp.svg"

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString()
}

export function trimTrailingSlash(value: string) {
  return value.endsWith("/") && value !== "/" ? value.slice(0, -1) : value
}
