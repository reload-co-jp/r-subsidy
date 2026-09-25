// next build 後の out/ を検査する SEO チェック（pnpm seo:check）
import fs from 'fs'
import path from 'path'
import { SITE_URL } from '../lib/site'

const OUT = path.join(process.cwd(), 'out')
const errors: string[] = []
const warnings: string[] = []

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return e.name === '_next' || e.name === 'data' ? [] : walk(p)
    return e.name === 'index.html' ? [p] : []
  })
}

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const pick = (html: string, re: RegExp) => {
  const m = html.match(re)
  return m ? decode(m[1]) : null
}

type Page = { url: string; title: string | null; description: string | null; canonical: string | null; noindex: boolean }
const pages = new Map<string, Page>()
const links = new Set<string>()

for (const file of walk(OUT)) {
  const rel = path.relative(OUT, path.dirname(file)).split(path.sep).join('/')
  const url = decodeURI(`${SITE_URL}/${rel ? `${rel}/` : ''}`)
  if (rel === '404' || rel === '_not-found') continue
  const html = fs.readFileSync(file, 'utf-8')
  const page: Page = {
    url,
    title: pick(html, /<title>([^<]*)<\/title>/),
    description: pick(html, /<meta name="description" content="([^"]*)"/),
    canonical: pick(html, /<link rel="canonical" href="([^"]*)"/),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
  }
  pages.set(url, page)

  if (!page.title) errors.push(`title なし: ${url}`)
  if (!page.description) errors.push(`description なし: ${url}`)
  if (!page.canonical) errors.push(`canonical なし: ${url}`)
  else if (!page.noindex && decodeURI(page.canonical) !== decodeURI(url)) errors.push(`canonical 不一致: ${url} -> ${page.canonical}`)

  const ldTypes: string[] = []
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(json)
      for (const d of [data, ...(data['@graph'] ?? [])].flat()) if (d['@type']) ldTypes.push(d['@type'])
      if (data['@type'] === 'FAQPage') {
        for (const q of data.mainEntity) if (!decode(html).includes(q.name)) errors.push(`FAQ が本文に無い: ${url} ${q.name}`)
      }
    } catch {
      errors.push(`JSON-LD 不正: ${url}`)
    }
  }
  if (/^\/subsidies\/[a-z0-9-]+\/$/.test(`/${rel}/`) && !ldTypes.includes('BreadcrumbList')) {
    errors.push(`制度ページに BreadcrumbList なし: ${url}`)
  }
  if (/\{\{|undefined|NaN|null件/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) warnings.push(`placeholder 疑い: ${url}`)

  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) links.add(href)
}

// 内部リンク切れ
for (const href of links) {
  if (/\.(svg|png|ico|txt|xml|json|css|js)$/.test(href) || href.startsWith('/_next') || href.startsWith('//')) continue
  // out/ のディレクトリ名はエンコード済み・未エンコードが混在するため両方試す
  const decoded = decodeURIComponent(href)
  const encoded = decoded.split('/').map(encodeURIComponent).join('/')
  const found = [href, decoded, encoded].some((p) =>
    [path.join(OUT, p, 'index.html'), path.join(OUT, p), path.join(OUT, `${p}.html`)].some((f) => fs.existsSync(f))
  )
  if (!found) errors.push(`内部リンク切れ: ${href}`)
}

// title / description 重複（index対象のみ）
for (const key of ['title', 'description'] as const) {
  const seen = new Map<string, string>()
  for (const p of pages.values()) {
    if (p.noindex || !p[key]) continue
    const prev = seen.get(p[key]!)
    if (prev) warnings.push(`${key} 重複: ${prev} / ${p.url}`)
    else seen.set(p[key]!, p.url)
  }
}

// sitemap は index 対象の実在ページのみ
const sitemap = fs.readFileSync(path.join(OUT, 'sitemap.xml'), 'utf-8')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => decode(m[1]))
for (const loc of sitemapUrls) {
  if (loc.endsWith('.txt')) continue
  const page = pages.get(decodeURI(loc)) ?? pages.get(loc)
  if (!page) errors.push(`sitemap に存在しないURL: ${loc}`)
  else if (page.noindex) errors.push(`sitemap に noindex ページ: ${loc}`)
}
const inSitemap = new Set(sitemapUrls.map((u) => decodeURI(u)))
const missing = [...pages.values()].filter((p) => !p.noindex && !inSitemap.has(decodeURI(p.url)))
if (missing.length) warnings.push(`index対象だが sitemap 未掲載: ${missing.length}件（例: ${missing.slice(0, 3).map((p) => p.url).join(', ')}）`)

const indexable = [...pages.values()].filter((p) => !p.noindex).length
console.log(`pages: ${pages.size} (index ${indexable}, noindex ${pages.size - indexable}), sitemap: ${sitemapUrls.length}, links: ${links.size}`)
for (const w of warnings.slice(0, Number(process.env.WARN_LIMIT ?? 30))) console.warn(`WARN ${w}`)
if (warnings.length > 30) console.warn(`WARN ... 他 ${warnings.length - 30}件`)
for (const e of errors.slice(0, 50)) console.error(`ERROR ${e}`)
if (errors.length) {
  console.error(`${errors.length} errors`)
  process.exit(1)
}
console.log('seo check ok')
