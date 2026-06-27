import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { PREFECTURES } from "../lib/prefectures"
import type { SubsidyIndexItem } from "../lib/types"
import type { SubsidyNews } from "./news/page"
import type { Guide } from "./guides/page"
import { SITE_URL } from "../lib/site"
export const dynamic = "force-static"

function getSiteUrl() {
  const siteUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL
  return siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-index.json"
    )
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getNews(): SubsidyNews[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "subsidy-news.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getGuides(): Guide[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "guides.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl()
  const subsidies = getSubsidies()
  const news = getNews()
  const guides = getGuides()

  const latestUpdatedAt = subsidies.reduce(
    (latest, s) => (s.updatedAt > latest ? s.updatedAt : latest),
    ""
  )
  const latestNewsAt = news.reduce(
    (latest, n) => (n.publishedAt > latest ? n.publishedAt : latest),
    ""
  )
  const today = new Date().toISOString()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: latestUpdatedAt || today,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/subsidies/`,
      lastModified: latestUpdatedAt || today,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/diagnosis/`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/news/`,
      lastModified: latestNewsAt || today,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/guides/`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/cases/`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: today,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/features/it-companies/`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/features/popular-sme/`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ]

  const prefectureRoutes: MetadataRoute.Sitemap = PREFECTURES.map(
    (prefecture) => ({
      url: `${siteUrl}/subsidies/prefecture/${encodeURIComponent(prefecture)}/`,
      lastModified: latestUpdatedAt || today,
      changeFrequency: "daily",
      priority: 0.85,
    })
  )

  const allPurposes = [...new Set(subsidies.flatMap((s) => s.purposes))].sort()
  const purposeRoutes: MetadataRoute.Sitemap = allPurposes.map((purpose) => ({
    url: `${siteUrl}/subsidies/purpose/${encodeURIComponent(purpose)}/`,
    lastModified: latestUpdatedAt || today,
    changeFrequency: "weekly",
    priority: 0.82,
  }))

  const allIndustries = [
    ...new Set(subsidies.flatMap((s) => s.industries)),
  ].sort()
  const industryRoutes: MetadataRoute.Sitemap = allIndustries.map(
    (industry) => ({
      url: `${siteUrl}/subsidies/industry/${encodeURIComponent(industry)}/`,
      lastModified: latestUpdatedAt || today,
      changeFrequency: "weekly",
      priority: 0.8,
    })
  )

  const subsidyRoutes: MetadataRoute.Sitemap = subsidies
    .filter((s) => s.status !== "closed")
    .map((subsidy) => ({
      url: `${siteUrl}/subsidies/${subsidy.slug}/`,
      lastModified: subsidy.updatedAt,
      changeFrequency: "weekly",
      priority: subsidy.status === "open" ? 0.75 : 0.65,
    }))

  const newsRoutes: MetadataRoute.Sitemap = news.map((n) => ({
    url: `${siteUrl}/news/${n.id}/`,
    lastModified: n.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const guideRoutes: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${siteUrl}/guides/${g.id}/`,
    lastModified: g.publishedAt,
    changeFrequency: "monthly",
    priority: 0.75,
  }))

  return [
    ...staticRoutes,
    ...prefectureRoutes,
    ...purposeRoutes,
    ...industryRoutes,
    ...subsidyRoutes,
    ...newsRoutes,
    ...guideRoutes,
  ]
}
