import fs from 'fs'
import path from 'path'

// ミラサポplus「事例ナビ」Data API（外部公開）
// https://app.swaggerhub.com/apis/MIRASAPOPLUS/jirei-api/1.0
// 締切・補助率などの補助金メタ情報は持たない「活用事例」データベース。
// used_support_refs（利用した制度）が付いている事例だけを
// data/source/application-cases.json 形式に変換して追記する。
const BASE_URL = 'https://mirasapo-plus.go.jp/jirei-api/case_studies'
const CASE_PAGE_URL = 'https://mirasapo-plus.go.jp/jirei-navi/case_studies'
const RAW_DIR = path.join(process.cwd(), 'data', 'raw')
const SOURCE_DIR = path.join(process.cwd(), 'data', 'source')
const SEEN_FILE = path.join(RAW_DIR, 'mirasapo-seen.json')
const CASES_FILE = path.join(SOURCE_DIR, 'application-cases.json')
const PAGE_SIZE = 100

type MirasapoLink = { title: string; url: string }
type MirasapoCaseStudy = {
  id: string
  location?: { name?: string }
  used_support_refs?: MirasapoLink[]
  organization?: { industry?: string; type?: string }
  background?: string
  challenges?: string
  results?: string
}
type MirasapoListResponse = { items: MirasapoCaseStudy[]; total: number }

type ApplicationCase = {
  id: string
  subsidyName: string
  industry: string
  companyType: string
  region: string
  challenge: string
  solution: string
  result: string
  sourceLabel: string
  sourceUrl: string
}

// used_support_refs 付き事例の background 冒頭に付く定型免責文
// 「各制度は、活用当時のものであり、...確認してください。」を落とす
const DISCLAIMER_MARKER = '各制度は、活用当時のものであり'

// markdown の見出し行 ("## 背景・きっかけ" など) と定型免責文を落として本文だけにする
function stripMarkdownHeadings(value: string | undefined): string {
  if (!value) return ''
  return value
    .split('\n')
    .filter((line) => !line.trim().startsWith('#') && !line.includes(DISCLAIMER_MARKER))
    .join('\n')
    .trim()
}

function toApplicationCase(item: MirasapoCaseStudy): ApplicationCase | null {
  const subsidyName = item.used_support_refs?.[0]?.title
  if (!subsidyName) return null // 制度名が特定できない事例は対象外

  return {
    id: `mirasapo-${item.id}`,
    subsidyName,
    industry: item.organization?.industry ?? '',
    companyType: item.organization?.type ?? '',
    region: item.location?.name ?? '全国',
    challenge: stripMarkdownHeadings(item.background),
    solution: stripMarkdownHeadings(item.challenges),
    result: stripMarkdownHeadings(item.results),
    sourceLabel: 'ミラサポplus 活用事例',
    sourceUrl: `${CASE_PAGE_URL}/${item.id}`,
  }
}

async function fetchPage(offset: number): Promise<MirasapoListResponse> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
    sort: 'timestamp',
    order: 'desc',
  })
  const url = `${BASE_URL}?${params.toString()}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json() as Promise<MirasapoListResponse>
}

function readJsonSafe<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return fallback
  }
}

async function main() {
  console.log('Fetching Mirasapo+ case studies (timestamp desc)...')
  const seen = new Set(readJsonSafe<string[]>(SEEN_FILE, []))
  const isFirstRun = seen.size === 0

  const newItems: MirasapoCaseStudy[] = []
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const page = await fetchPage(offset)
    total = page.total

    let hitKnown = false
    for (const item of page.items) {
      if (seen.has(item.id)) {
        hitKnown = true
        // 初回実行は seen が空で全件「新規」なので打ち切らず最後まで舐める
        if (!isFirstRun) break
        continue
      }
      newItems.push(item)
    }

    console.log(`  offset ${offset}: ${page.items.length} items (total ${total})`)
    offset += PAGE_SIZE
    if (hitKnown && !isFirstRun) break

    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`New case studies: ${newItems.length}`)

  const converted = newItems.map(toApplicationCase).filter((c): c is ApplicationCase => c !== null)
  console.log(`With identifiable subsidy name: ${converted.length}`)

  fs.mkdirSync(RAW_DIR, { recursive: true })
  fs.mkdirSync(SOURCE_DIR, { recursive: true })

  if (converted.length > 0) {
    const existing = readJsonSafe<ApplicationCase[]>(CASES_FILE, [])
    const existingIds = new Set(existing.map((c) => c.id))
    const toAdd = converted.filter((c) => !existingIds.has(c.id))
    fs.writeFileSync(CASES_FILE, JSON.stringify([...existing, ...toAdd], null, 2))
    console.log(`Appended ${toAdd.length} case(s) to data/source/application-cases.json`)
  }

  for (const item of newItems) seen.add(item.id)
  fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen], null, 2))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
