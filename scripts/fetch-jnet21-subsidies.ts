import type { NormalizedSubsidy } from '../lib/types'
import { extractPurposes, normalizeRegion } from '../lib/normalize'
import { todayJst } from '../lib/quality'
import {
  absoluteUrl,
  baseSubsidy,
  escapeHtml,
  extractPeriod,
  fetchText,
  htmlToText,
  keepUpdatedAt,
  oneLine,
  parseJapaneseDates,
  readNormalized,
  statusFromPeriod,
  writeNormalized,
} from './scrape-utils'

// J-Net21 支援情報ヘッドライン（中小機構）の「補助金・助成金」を取り込む。
// 市区町村の制度を広く拾えるが、締切・金額などの構造化項目は無いため受付状態は「要確認」とする。
// 掲載日が古い記事は既に終了している可能性が高いので、MAX_AGE_DAYS 以内に掲載されたものだけ扱う。
const BASE = 'https://j-net21.smrj.go.jp/snavi2/'
const LIST_URL = (page: number) =>
  `${BASE}results.php?search_exec=1&category=2&type%5B%5D=3&displaycount=30&sort=publish_date_default&displaysort=DESC&page=${page}`
const MAX_AGE_DAYS = Number(process.env.JNET21_MAX_AGE_DAYS ?? 180)
const MAX_PAGES = 80
const OUT_FILE = 'jnet21-normalized.json'

type ListItem = { id: string; title: string; publishedAt: string }

function parseList(html: string): ListItem[] {
  const items: ListItem[] = []
  for (const m of html.matchAll(/data-id="(\d+)"[^>]*data-title="([^"]*)"[^>]*data-date="([^"]*)"/g)) {
    const date = parseJapaneseDates(m[3])[0]
    if (date) items.push({ id: m[1], title: htmlToText(m[2]), publishedAt: date })
  }
  return items
}

function defList(html: string) {
  const fields: Record<string, string> = {}
  const dl = html.match(/<dl class="def-list">([\s\S]*?)<\/dl>/)?.[1] ?? ''
  for (const m of dl.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) {
    fields[oneLine(htmlToText(m[1]))] = oneLine(htmlToText(m[2]))
  }
  return fields
}

// 【加西市】補助金・助成金：「加西ブランド特産品創出支援補助金」→ 加西ブランド特産品創出支援補助金
function cleanTitle(raw: string) {
  const quoted = raw.match(/「(.+)」\s*$/)?.[1]
  return oneLine(quoted ?? raw.replace(/^【[^】]*】/, '').replace(/^補助金・助成金\s*[：:]/, ''))
}

const splitList = (v: string | undefined) => (v ?? '').split(/[、,，]/).map((x) => x.trim()).filter(Boolean)

function parseArticle(id: string, html: string, publishedAt: string): NormalizedSubsidy | null {
  const rawTitle = htmlToText(html.match(/<h1 class="ttl">([\s\S]*?)<\/h1>/)?.[1] ?? '')
  if (!rawTitle) return null
  const fields = defList(html)
  const agency = fields['実施機関'] ?? null
  const noticeBlock = html.match(/実施機関からのお知らせ[\s\S]*?<\/h2>([\s\S]*?)<h3/)?.[1] ?? ''
  const overview = htmlToText(noticeBlock)
    .replace(/申込方法ほか詳細情報は[^\n]*/g, '')
    .replace(/\n+/g, '')
    .trim()
  const linkBlock = html.match(/詳細情報を見る[\s\S]*?<ul class="list">([\s\S]*?)<\/ul>/)?.[1] ?? ''
  const officialUrl = absoluteUrl(linkBlock.match(/href="([^"]+)"/)?.[1] ?? '', BASE)
  const articleUrl = `https://j-net21.smrj.go.jp/snavi2/articles/${id}`

  let title = cleanTitle(rawTitle)
  if (agency && !title.includes(agency)) title += `（${agency}）`

  const areas = splitList(fields['地域'])
  const industries = fields['業種'] && fields['業種'] !== '指定無し' ? splitList(fields['業種']) : []
  const purposes = extractPurposes([title, fields['分野'] ?? '', overview].join(' '))

  const info = [
    ['種類', fields['種類']],
    ['分野', fields['分野']],
    ['業種', fields['業種']],
    ['地域', fields['地域']],
    ['実施機関', agency],
    ['J-Net21掲載日', publishedAt],
  ].filter((r): r is [string, string] => !!r[1])

  const detail = [
    overview && `<h2>実施機関からのお知らせ</h2><p>${escapeHtml(overview)}</p>`,
    `<h2>掲載情報</h2><ul>${info.map(([k, v]) => `<li>${k}：${escapeHtml(v)}</li>`).join('')}</ul>`,
    `<p>出典：<a href="${articleUrl}" target="_blank" rel="noopener noreferrer">J-Net21 支援情報ヘッドライン（中小機構）</a>。受付期間・補助額・申請方法は実施機関の公式ページで確認してください。</p>`,
  ]
    .filter(Boolean)
    .join('\n')

  // 期間が本文に書かれている場合のみ設定（推測はしない）
  const period = extractPeriod(overview)
  const slug = `jnet21-${id}`
  return baseSubsidy({
    startDate: period?.startDate ?? null,
    endDate: period?.endDate ?? null,
    status: period ? statusFromPeriod(period.startDate, period.endDate, todayJst()) : 'unknown',
    id: slug,
    slug,
    title,
    overview,
    detail,
    region: normalizeRegion(areas),
    prefectures: areas,
    industries,
    purposes,
    usePurpose: fields['分野'] ?? null,
    workflow: agency,
    source: 'jnet21',
    referenceUrl: officialUrl ?? articleUrl,
    updatedAt: `${publishedAt}T00:00:00.000Z`,
  })
}

async function main() {
  const previous = new Map(readNormalized(OUT_FILE).map((s) => [s.id, s]))
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString().slice(0, 10)

  const listed: ListItem[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = parseList(await fetchText(LIST_URL(page)))
    if (items.length === 0) break
    listed.push(...items.filter((i) => i.publishedAt >= cutoff))
    if (items.at(-1)!.publishedAt < cutoff) break
  }
  console.log(`J-Net21: ${listed.length} articles since ${cutoff}`)

  const subsidies: NormalizedSubsidy[] = []
  let fetched = 0
  let failed = 0
  for (const item of listed) {
    const slug = `jnet21-${item.id}`
    const prev = previous.get(slug)
    // 記事は掲載後ほぼ更新されないため、取得済みは再取得しない
    if (prev) {
      subsidies.push(prev)
      continue
    }
    try {
      const parsed = parseArticle(item.id, await fetchText(`${BASE}articles/${item.id}`), item.publishedAt)
      fetched++
      if (parsed) subsidies.push(keepUpdatedAt(parsed, prev))
    } catch (err) {
      failed++
      console.warn(`  skip ${item.id}: ${(err as Error).message}`)
    }
  }

  writeNormalized(OUT_FILE, subsidies)
  console.log(`J-Net21: ${subsidies.length} subsidies (new ${fetched}, failed ${failed})`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
