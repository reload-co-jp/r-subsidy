import fs from 'fs'
import path from 'path'
import type { JGrantsListItem, JGrantsListResponse } from '../lib/types'

const BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v1/public/subsidies'
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'raw')
const DEFAULT_KEYWORDS = ['補助', '助成', '支援']
const SORT = 'created_date'
const ORDER = 'DESC'
const ACCEPTANCE = '0'

function extractItems(response: JGrantsListResponse): JGrantsListItem[] {
  return Array.isArray(response.result) ? response.result : response.result.subsidies
}

function extractCount(response: JGrantsListResponse, fallbackCount: number): number {
  if (Array.isArray(response.result)) {
    return response.metadata?.resultset?.count ?? response.metadata?.resultset?.total_count ?? fallbackCount
  }

  return response.result.metadata.count ?? response.result.metadata.total_count
}

async function fetchByKeyword(keyword: string): Promise<JGrantsListResponse> {
  const params = new URLSearchParams({
    keyword,
    sort: SORT,
    order: ORDER,
    acceptance: ACCEPTANCE,
  })
  const url = `${BASE_URL}?${params.toString()}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json() as Promise<JGrantsListResponse>
}

async function fetchAllIds(): Promise<string[]> {
  const ids = new Set<string>()
  const itemMap = new Map<string, JGrantsListItem>()
  const keywords = process.env.JGRANTS_KEYWORDS?.split(',').map((v) => v.trim()).filter(Boolean) ?? DEFAULT_KEYWORDS

  console.log('Fetching JGrants subsidy index...')
  console.log(`Keywords: ${keywords.join(', ')}`)

  for (const keyword of keywords) {
    const response = await fetchByKeyword(keyword)
    const items = extractItems(response)
    const count = extractCount(response, items.length)
    console.log(`  "${keyword}" => ${count} items`)

    for (const item of items) {
      ids.add(item.id)
      itemMap.set(item.id, item)
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  const items = [...itemMap.values()]
  console.log(`Merged unique items: ${items.length}`)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'jgrants-index.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), items }, null, 2)
  )

  return [...ids]
}

fetchAllIds()
  .then((ids) => {
    console.log(`Saved ${ids.length} IDs to data/raw/jgrants-index.json`)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
