import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { PREFECTURES } from "../lib/prefectures"
import type { SubsidyIndexItem } from "../lib/types"
import { SITE_URL } from "../lib/site"
export const dynamic = "force-static"

function getSiteUrl() {
  const siteUrl = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL
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

  const latestUpdatedAt = subsidies.reduce((latest, s) =>
    s.updatedAt > latest ? s.updatedAt : latest, ""
  )
  const today = new Date().toISOString()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: latestUpdatedAt || today, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/subsidies/`, lastModified: latestUpdatedAt || today, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/diagnosis/`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
  ]

  const prefectureRoutes: MetadataRoute.Sitemap = PREFECTURES.map((prefecture) => ({
    url: `${siteUrl}/subsidies/prefecture/${encodeURIComponent(prefecture)}/`,
    lastModified: latestUpdatedAt || today,
    changeFrequency: "daily",
    priority: 0.85,
  }))

  const subsidyRoutes: MetadataRoute.Sitemap = subsidies
    .filter((s) => s.status !== "closed")
    .map((subsidy) => ({
      url: `${siteUrl}/subsidies/${subsidy.slug}/`,
      lastModified: subsidy.updatedAt,
      changeFrequency: "weekly",
      priority: subsidy.status === "open" ? 0.75 : 0.65,
    }))

  return [...staticRoutes, ...prefectureRoutes, ...subsidyRoutes]
}
