import fs from 'fs'
import path from 'path'

// J-Net21 支援情報ヘッドライン（補助金・助成金・融資）RSS
// 前回18:30時点からの新着のみを返す差分フィード。
// 締切・補助率などの構造化フィールドは無く、description は自由文。
// → ここでは「未レビュー候補」を貯めるだけ。manual-subsidies.json への
//   反映は人（レビュー担当）が data/source/jnet21-candidates.json を見て
//   NormalizedSubsidy 形式に整形し、手動で追記する。
const FEED_URL = 'https://j-net21.smrj.go.jp/snavi/support/support.xml'
const RAW_DIR = path.join(process.cwd(), 'data', 'raw')
const SOURCE_DIR = path.join(process.cwd(), 'data', 'source')
const SEEN_FILE = path.join(RAW_DIR, 'jnet21-seen.json')
const CANDIDATES_FILE = path.join(SOURCE_DIR, 'jnet21-candidates.json')

type JNet21CandidateItem = {
  link: string
  title: string
  municipality: string | null
  prefecture: string | null
  prefectureCode: string | null
  category: string | null
  description: string
  publishedAt: string | null
  fetchedAt: string
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function matchTag(xml: string, tag: string): string | null {
  const cdata = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))
  if (cdata) return cdata[1].trim()
  const plain = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))
  return plain ? decodeXmlEntities(plain[1]).trim() : null
}

function parseItems(xml: string): JNet21CandidateItem[] {
  const fetchedAt = new Date().toISOString()
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  return blocks.map((block) => {
    const title = matchTag(block, 'title') ?? ''
    const municipalityMatch = title.match(/^【(.+?)】/)

    return {
      link: matchTag(block, 'link') ?? '',
      title,
      municipality: municipalityMatch ? municipalityMatch[1] : null,
      prefecture: matchTag(block, 'rdf:label'),
      prefectureCode: matchTag(block, 'rdf:value'),
      category: matchTag(block, 'dc:subject'),
      description: matchTag(block, 'description') ?? '',
      publishedAt: matchTag(block, 'dc:date'),
      fetchedAt,
    }
  })
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
  console.log('Fetching J-Net21 support headline RSS...')
  const res = await fetch(FEED_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${FEED_URL}`)
  const xml = await res.text()

  const items = parseItems(xml).filter((item) => item.link)
  console.log(`Feed items: ${items.length}`)

  fs.mkdirSync(RAW_DIR, { recursive: true })
  fs.mkdirSync(SOURCE_DIR, { recursive: true })

  const seen = new Set(readJsonSafe<string[]>(SEEN_FILE, []))
  const newItems = items.filter((item) => !seen.has(item.link))
  console.log(`New (unseen) items: ${newItems.length}`)

  if (newItems.length > 0) {
    const candidates = readJsonSafe<JNet21CandidateItem[]>(CANDIDATES_FILE, [])
    fs.writeFileSync(CANDIDATES_FILE, JSON.stringify([...candidates, ...newItems], null, 2))
  }

  for (const item of items) seen.add(item.link)
  fs.writeFileSync(SEEN_FILE, JSON.stringify([...seen], null, 2))

  console.log(`Done. ${newItems.length} candidate(s) added to data/source/jnet21-candidates.json`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
