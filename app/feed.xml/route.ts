import fs from "fs"
import path from "path"
import { isIndexableSubsidy } from "../../lib/format"
import { loadSubsidyIndex } from "../../lib/seo"
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "../../lib/site"
import type { SubsidyNews } from "../news/page"

export const dynamic = "force-static"

const MAX_SUBSIDIES = 50

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!
  )

function getNews(): SubsidyNews[] {
  try {
    const file = path.join(process.cwd(), "data", "source", "subsidy-news.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

type FeedItem = {
  title: string
  url: string
  description: string
  date: string
  category: string
}

export function GET() {
  const news: FeedItem[] = getNews().map((n) => ({
    title: n.title,
    url: absoluteUrl(`/news/${n.id}/`),
    description: n.summary,
    date: n.publishedAt,
    category: "ニュース",
  }))
  const subsidies: FeedItem[] = loadSubsidyIndex()
    .filter(isIndexableSubsidy)
    .toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_SUBSIDIES)
    .map((s) => ({
      title: s.title,
      url: absoluteUrl(`/subsidies/${s.slug}/`),
      description: s.overview,
      date: s.updatedAt,
      category: "補助金",
    }))
  const items = [...news, ...subsidies].toSorted((a, b) =>
    b.date.localeCompare(a.date)
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(SITE_NAME)}</title>
<link>${absoluteUrl("/")}</link>
<description>${escapeXml(SITE_DESCRIPTION)}</description>
<language>ja</language>
<atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>
${items
  .map(
    (i) => `<item>
<title>${escapeXml(i.title)}</title>
<link>${i.url}</link>
<guid>${i.url}</guid>
<description>${escapeXml(i.description)}</description>
<category>${i.category}</category>
<pubDate>${new Date(i.date).toUTCString()}</pubDate>
</item>`
  )
  .join("\n")}
</channel>
</rss>
`
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  })
}
