import type { NormalizedSubsidy, Status } from '../lib/types'
import { extractPurposes } from '../lib/normalize'
import { todayJst } from '../lib/quality'
import {
  absoluteUrl,
  baseSubsidy,
  escapeHtml,
  fetchText,
  htmlToText,
  keepUpdatedAt,
  oneLine,
  parseJapaneseDates,
  readNormalized,
  shortHash,
  statusFromPeriod,
  writeNormalized,
} from './scrape-utils'

// 東京都中小企業振興公社「助成金事業」一覧。一覧の募集状況・限度額・助成率と、
// 各事業ページの概要表（申請期間など）を取り込む。受付終了の事業は取り込まない。
const LIST_URL = 'https://www.tokyo-kosha.or.jp/support/josei/index.html'
const OUT_FILE = 'tokyo-kosha-normalized.json'
const AGENCY = '公益財団法人東京都中小企業振興公社'

// 一覧の分類 → サイトの用途
const CATEGORY_PURPOSES: Record<string, string[]> = {
  製品開発: ['研究開発'],
  創業: ['創業'],
  商店街: ['販路拡大'],
  生産性向上: ['デジタル化', '設備投資'],
  知的財産: ['研究開発'],
  設備投資: ['設備投資'],
  事業承継: ['事業承継'],
  販路拡大: ['販路拡大'],
}

type ListItem = {
  url: string
  title: string
  category: string | null
  statusLabel: string
  description: string
  periodText: string | null
  finished: boolean
  limit: string | null
  rate: string | null
  targets: string[]
}

function parseList(html: string): ListItem[] {
  const items: ListItem[] = []
  // 分類見出し（h4）と事業カードを出現順に読む
  const tokens = html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>|<a class="bl_support_item"\s+href="([^"]+)"\s*>([\s\S]*?)<\/a>/g)
  let category: string | null = null
  for (const t of tokens) {
    if (t[1] !== undefined) {
      category = oneLine(htmlToText(t[1]))
      continue
    }
    const body = t[3]
    const pick = (cls: string) => body.match(new RegExp(`class="${cls}(?: [^"]*)?"[^>]*>([\\s\\S]*?)</(div|p|li)>`))?.[1]
    const data = [...body.matchAll(/<li class="un_josei_data">([\s\S]*?)<\/li>/g)].map((m) => oneLine(htmlToText(m[1])))
    const url = absoluteUrl(t[2], LIST_URL)
    const title = oneLine(htmlToText(pick('bl_support_item_ttl') ?? ''))
    if (!url || !title) continue
    items.push({
      url,
      title,
      category,
      statusLabel: oneLine(htmlToText(pick('un_josei_status') ?? '')),
      ...parseCardContent(body.match(/bl_support_item_content">\s*<p>([\s\S]*?)<\/p>/)?.[1] ?? ''),
      finished: /un_josei_status is_finished/.test(body),
      limit: data.find((d) => d.startsWith('助成限度額'))?.replace(/^助成限度額\s*/, '') ?? null,
      rate: data.find((d) => d.startsWith('助成率'))?.replace(/^助成率\s*/, '') ?? null,
      targets: [...body.matchAll(/<li class="un_josei_target">([\s\S]*?)<\/li>/g)].map((m) => oneLine(htmlToText(m[1]))),
    })
  }
  return items
}

// カード本文は「説明文」か「【目的】…【申請受付期間】…【担当】…」形式
function parseCardContent(html: string) {
  const text = htmlToText(html)
  const labeled = new Map([...text.matchAll(/【([^】]+)】\s*([^【]*)/g)].map((m) => [m[1], oneLine(m[2])]))
  const plain = oneLine(text.split('【')[0])
  return {
    description: plain || labeled.get('目的') || labeled.get('概要') || '',
    periodText: [...labeled].find(([k]) => /期間|期限/.test(k))?.[1] ?? null,
  }
}

function statusFromLabel(label: string): Status {
  if (/終了/.test(label)) return 'closed'
  if (/前/.test(label)) return 'upcoming'
  if (/募集中|受付中/.test(label)) return 'open'
  return 'unknown'
}

// 「150万円（下限額：5万円）」「2億円」→ 1,500,000円（サイト共通の金額形式）
function toYen(limit: string | null) {
  const m = limit?.match(/^([\d,.]+)\s*(億|万)?円/)
  if (!m) return null
  const n = Math.round(Number(m[1].replace(/,/g, '')) * (m[2] === '億' ? 1e8 : m[2] === '万' ? 1e4 : 1))
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString('en-US')}円` : null
}

// 事業ページの「th/td」表から概要項目を取り出す
function parseDetailTable(html: string) {
  const rows: [string, string][] = []
  for (const m of html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/g)) {
    const k = oneLine(htmlToText(m[1]))
    const v = oneLine(htmlToText(m[2]))
    if (k && v && k.length <= 20 && !rows.some((r) => r[0] === k)) rows.push([k, v])
  }
  return rows
}

function toSubsidy(item: ListItem, detailHtml: string | null): NormalizedSubsidy {
  const rows = detailHtml ? parseDetailTable(detailHtml) : []
  const periodRow = rows.find(([k]) => /(申請|募集|受付|エントリー).*(期間|期限)/.test(k))
  const dates = parseJapaneseDates(periodRow?.[1] ?? item.periodText ?? '')
  const startDate = dates.length > 1 ? dates[0] : null
  const endDate = dates.length > 0 ? dates[dates.length - 1] : null
  const listStatus = item.finished ? 'closed' : statusFromLabel(item.statusLabel)
  // 期間が取れれば日付から判定し、取れなければ一覧の表示を使う
  const status = dates.length > 0 ? statusFromPeriod(startDate, endDate, todayJst()) : listStatus

  const extra = rows.find(([k]) => /支援内容|目的|概要/.test(k))?.[1]
  const overview = [item.description, extra && extra.length >= 20 && !/▶|フォーマット|ダウンロード|こちら/.test(extra) ? extra : null]
    .filter(Boolean)
    .join('。')
    .replace(/。+/g, '。')
  const usefulRows = rows.filter(([k]) => !/チラシ|流れ|フォーム|ダウンロード/.test(k)).slice(0, 12)
  const detail = [
    `<h2>事業の概要</h2><ul>${usefulRows.map(([k, v]) => `<li>${escapeHtml(k)}：${escapeHtml(v)}</li>`).join('')}</ul>`,
    item.targets.length > 0 && `<p>対象：${escapeHtml(item.targets.join('、'))}</p>`,
    `<p>募集要項・申請様式は東京都中小企業振興公社の事業ページで確認してください。</p>`,
  ]
    .filter(Boolean)
    .join('\n')

  const slug = `tokyo-kosha-${shortHash(`${item.url}|${item.title}`)}`
  return baseSubsidy({
    id: slug,
    slug,
    title: item.title,
    overview,
    detail,
    region: 'tokyo',
    prefectures: ['東京都'],
    purposes: [...new Set([...(CATEGORY_PURPOSES[item.category ?? ''] ?? []), ...extractPurposes(`${item.title} ${item.description}`)])],
    usePurpose: item.category,
    status,
    workflow: AGENCY,
    subsidizedRate: item.rate?.replace(/^[：:]\s*/, '') ?? null,
    upperLimit: toYen(item.limit),
    lowerLimit: toYen(item.limit?.match(/下限額[：:]\s*([\d,.]+\s*(億|万)?円)/)?.[1] ?? null),
    targetNumberOfEmployees: item.targets.length > 0 ? item.targets.join('・') : null,
    isForSME: item.targets.some((t) => /中小企業|個人事業主|小規模/.test(t)),
    startDate,
    endDate,
    source: 'tokyo',
    referenceUrl: item.url,
  })
}

async function main() {
  const previous = new Map(readNormalized(OUT_FILE).map((s) => [s.id, s]))
  const items = parseList(await fetchText(LIST_URL)).filter((i) => !i.finished && statusFromLabel(i.statusLabel) !== 'closed')
  console.log(`Tokyo kosha: ${items.length} active items`)

  const subsidies: NormalizedSubsidy[] = []
  const detailCache = new Map<string, string | null>()
  for (const item of items) {
    if (!detailCache.has(item.url)) {
      detailCache.set(item.url, await fetchText(item.url).catch(() => null))
    }
    const subsidy = toSubsidy(item, detailCache.get(item.url) ?? null)
    if (subsidy.status === 'closed') continue
    subsidies.push(keepUpdatedAt(subsidy, previous.get(subsidy.id)))
  }

  writeNormalized(OUT_FILE, subsidies)
  console.log(`Tokyo kosha: ${subsidies.length} subsidies`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
