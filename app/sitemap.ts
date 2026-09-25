import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { PREFECTURES, POPULAR_PREFECTURES } from "../lib/prefectures"
import { POPULAR_INDUSTRIES } from "../lib/industries"
import type { SubsidyIndexItem } from "../lib/types"
import type { SubsidyNews } from "./news/page"
import type { Guide } from "./guides/page"
import { SITE_URL } from "../lib/site"
import {
  MIN_INDEX_COUNT,
  getDeadlineGroups,
  getPrefecturePurposes,
  isActive,
  isLocalTo,
  latestUpdatedAt as latestOf,
} from "../lib/seo"
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
      lastModified: undefined,
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
      lastModified: guides.reduce((l, g) => (g.publishedAt > l ? g.publishedAt : l), "") || undefined,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/cases/`,
      lastModified: undefined,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/about/`,
      lastModified: undefined,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/features/it-companies/`,
      lastModified: latestUpdatedAt || undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/features/popular-sme/`,
      lastModified: latestUpdatedAt || undefined,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/llms.txt`,
      lastModified: undefined,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ]

  // 一覧系はページ側の indexRobots と同じ条件で、index対象のみ掲載
  const listRoute = (
    urlPath: string,
    items: SubsidyIndexItem[],
    priority: number
  ): MetadataRoute.Sitemap[number] => ({
    url: `${siteUrl}${urlPath}`,
    lastModified: latestOf(items) || latestUpdatedAt || today,
    changeFrequency: "daily",
    priority,
  })
  const active = subsidies.filter(isActive)
  const deadlineSoon = getDeadlineGroups(subsidies).soon

  const statusRoutes: MetadataRoute.Sitemap = [
    listRoute("/subsidies/open/", active.filter((s) => s.status === "open"), 0.85),
    listRoute("/subsidies/upcoming/", active.filter((s) => s.status === "upcoming"), 0.8),
    listRoute("/subsidies/deadline/", deadlineSoon, 0.85),
  ]

  const prefectureRoutes: MetadataRoute.Sitemap = PREFECTURES.flatMap(
    (prefecture) => {
      const local = subsidies.filter((s) => isLocalTo(s, prefecture))
      return local.length >= MIN_INDEX_COUNT
        ? [listRoute(`/subsidies/prefecture/${encodeURIComponent(prefecture)}/`, local, 0.85)]
        : []
    }
  )

  const prefecturePurposeRoutes: MetadataRoute.Sitemap = PREFECTURES.flatMap(
    (prefecture) =>
      getPrefecturePurposes(subsidies, prefecture)
        .filter(({ count }) => count >= MIN_INDEX_COUNT)
        .map(({ purpose }) =>
          listRoute(
            `/subsidies/prefecture/${encodeURIComponent(prefecture)}/purpose/${encodeURIComponent(purpose)}/`,
            active.filter((s) => isLocalTo(s, prefecture) && s.purposes.includes(purpose)),
            0.8
          )
        )
  )

  const allPurposes = [...new Set(subsidies.flatMap((s) => s.purposes))].sort()
  const purposeRoutes: MetadataRoute.Sitemap = allPurposes.flatMap((purpose) => {
    const items = active.filter((s) => s.purposes.includes(purpose))
    return items.length >= MIN_INDEX_COUNT
      ? [listRoute(`/subsidies/purpose/${encodeURIComponent(purpose)}/`, items, 0.82)]
      : []
  })

  const allIndustries = [
    ...new Set(subsidies.flatMap((s) => s.industries)),
  ].sort()
  const industryRoutes: MetadataRoute.Sitemap = allIndustries.flatMap((industry) => {
    const items = active.filter((s) => s.industries.includes(industry))
    return items.length >= MIN_INDEX_COUNT
      ? [listRoute(`/subsidies/industry/${encodeURIComponent(industry)}/`, items, 0.8)]
      : []
  })

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

  const comboRoutes: MetadataRoute.Sitemap = POPULAR_PREFECTURES.flatMap(
    (prefecture) =>
      POPULAR_INDUSTRIES.flatMap((industry) => {
        const local = active.filter(
          (s) => isLocalTo(s, prefecture) && s.industries.includes(industry)
        )
        return local.length >= MIN_INDEX_COUNT
          ? [
              listRoute(
                `/subsidies/prefecture/${encodeURIComponent(prefecture)}/industry/${encodeURIComponent(industry)}/`,
                local,
                0.78
              ),
            ]
          : []
      })
  )

  return [
    ...staticRoutes,
    ...statusRoutes,
    ...prefectureRoutes,
    ...prefecturePurposeRoutes,
    ...purposeRoutes,
    ...industryRoutes,
    ...comboRoutes,
    ...subsidyRoutes,
    ...newsRoutes,
    ...guideRoutes,
  ]
}
