import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import type { SubsidyIndexItem } from "../lib/types"

const DEFAULT_SITE_URL = "https://example.com"
export const dynamic = "force-static"

function getSiteUrl() {
  const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const subsidies = getSubsidies()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/subsidies/`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/diagnosis/`, changeFrequency: "monthly", priority: 0.8 },
  ]

  const subsidyRoutes: MetadataRoute.Sitemap = subsidies.map((subsidy) => ({
    url: `${siteUrl}/subsidies/${subsidy.slug}/`,
    lastModified: subsidy.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...subsidyRoutes]
}
