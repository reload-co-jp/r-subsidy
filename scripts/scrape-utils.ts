import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy } from '../lib/types'

// J-Net21・厚労省・東京都中小企業振興公社など、APIの無い公開ページを取得するための共通処理

const USER_AGENT = 'RSubsidyBot/1.0 (+https://r-subsidy.reload.co.jp/about/)'
const REQUEST_INTERVAL_MS = 700

let lastRequestAt = 0

export async function fetchText(url: string, retries = 2): Promise<string> {
  // 相手サーバーへの負荷を抑えるため、リクエスト間隔を空ける
  const wait = lastRequestAt + REQUEST_INTERVAL_MS - Date.now()
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()

  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ja' } })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
    // 官公庁の古いページは Shift_JIS のことがあるため、ヘッダーか meta から文字コードを判定する
    const buf = Buffer.from(await res.arrayBuffer())
    const head = buf.subarray(0, 2048).toString('latin1')
    const charset = (res.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1] ?? head.match(/charset=["']?([\w-]+)/i)?.[1] ?? 'utf-8').toLowerCase()
    return new TextDecoder(/s(hift)?[-_]?jis|sjis/.test(charset) ? 'shift_jis' : /euc-jp/.test(charset) ? 'euc-jp' : 'utf-8').decode(buf)
  } catch (err) {
    if (retries > 0) return fetchText(url, retries - 1)
    throw err
  }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeEntities(value: string) {
  return value.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isNaN(n) ? m : String.fromCodePoint(n)
    }
    return ENTITIES[code.toLowerCase()] ?? m
  })
}

// タグを除去して1行のテキストにする（<br>は改行扱い）
export function htmlToText(html: string) {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\u200b/g, '')
    .replace(/[ \t\u3000]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

export const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim()

export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function absoluteUrl(href: string, base: string) {
  try {
    return new URL(decodeEntities(href), base).toString()
  } catch {
    return null
  }
}

export const shortHash = (value: string) => crypto.createHash('sha1').update(value).digest('hex').slice(0, 10)

const toFullWidthDigits = (s: string) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))

// 「令和8年9月28日」「2026年10月28日」→ 2026-09-28。
// 「令和8年10月19日～11月20日」のように年を省略した日付は、直前の年を引き継ぐ
export function parseJapaneseDates(text: string): string[] {
  const s = toFullWidthDigits(text).replace(/元年/g, '1年')
  const dates: string[] = []
  let lastYear: number | null = null
  const re = /(?:(令和|R|平成)?\s*(\d{1,4})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日/g
  for (const m of s.matchAll(re)) {
    let year = lastYear
    if (m[2]) {
      const n = Number(m[2])
      year = m[1] === '令和' || m[1] === 'R' ? 2018 + n : m[1] === '平成' ? 1988 + n : n
    }
    if (year === null || year < 2000 || year > 2100) continue
    lastYear = year
    dates.push(`${year}-${m[3].padStart(2, '0')}-${m[4].padStart(2, '0')}`)
  }
  return dates
}

// 本文中の「申請期限：…」「受付期間：…～…」から受付期間を推定する。見つからなければ null
export function extractPeriod(text: string): { startDate: string | null; endDate: string | null } | null {
  const m = text.match(/(申請|受付|募集|申込|応募|提出)[^。\n]{0,8}?(期間|期限|締切|〆切|締め切り)[^0-9０-９令平]{0,6}([^。\n]{0,60})/)
  if (!m) return null
  const dates = parseJapaneseDates(m[3])
  if (dates.length === 0) return null
  if (dates.length === 1) return /期限|締切|〆切|締め切り/.test(m[2]) ? { startDate: null, endDate: dates[0] } : { startDate: dates[0], endDate: null }
  return { startDate: dates[0], endDate: dates[dates.length - 1] }
}

export function statusFromPeriod(startDate: string | null, endDate: string | null, today: string): NormalizedSubsidy['status'] {
  if (endDate && endDate < today) return 'closed'
  if (startDate && startDate > today) return 'upcoming'
  if (endDate || startDate) return 'open'
  return 'unknown'
}

// 制度名の比較用キー（年度・回次・括弧・空白の違いを無視）
export function titleKey(title: string) {
  return toFullWidthDigits(title)
    .normalize('NFKC')
    .replace(/(令和|平成)\s*\d+\s*年度?|\d{4}\s*年度?|第\s*\d+\s*(回|期|次)/g, '')
    .replace(/[【】「」『』（）()［］[\]〈〉<>・、。,.:：\s\u3000]/g, '')
    .replace(/(の)?(募集|受付|申請受付|公募)(を)?(開始|について|のお知らせ|します|しました)?!?$/g, '')
    .toLowerCase()
}

// 内容が前回と同じなら更新日時を据え置く（不要な差分・sitemapのlastmod変動を防ぐ）
export function keepUpdatedAt(next: NormalizedSubsidy, prev: NormalizedSubsidy | undefined) {
  if (!prev) return next
  const strip = (s: NormalizedSubsidy) => JSON.stringify({ ...s, updatedAt: '' })
  return strip(next) === strip(prev) ? prev : next
}

export function nowIso() {
  return new Date().toISOString()
}

export function writeNormalized(fileName: string, subsidies: NormalizedSubsidy[]) {
  const dir = path.join(process.cwd(), 'data', 'normalized')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, fileName), JSON.stringify({ fetchedAt: nowIso(), subsidies }, null, 2) + '\n')
}

export function readNormalized(fileName: string): NormalizedSubsidy[] {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'normalized', fileName), 'utf-8')).subsidies ?? []
  } catch {
    return []
  }
}

// 取得元ごとに未設定の項目を既定値で埋める
export function baseSubsidy(partial: Pick<NormalizedSubsidy, 'id' | 'slug' | 'title' | 'source'> & Partial<NormalizedSubsidy>): NormalizedSubsidy {
  return {
    overview: '',
    detail: '',
    region: 'national',
    prefectures: [],
    industries: [],
    targetNumberOfEmployees: null,
    employeeMin: null,
    employeeMax: null,
    isForSME: true,
    purposes: [],
    usePurpose: null,
    status: 'unknown',
    workflow: null,
    subsidizedRate: null,
    upperLimit: null,
    lowerLimit: null,
    startDate: null,
    endDate: null,
    referenceUrl: null,
    updatedAt: nowIso(),
    ...partial,
  }
}
