import fs from 'fs'
import path from 'path'
import type { JGrantsListItem, JGrantsListResponse } from '../lib/types'

const BASE_URL = 'https://jgrants-portal.go.jp/subsidy/v1/subsidies'
const LIMIT = 100
const OUTPUT_DIR = path.join(process.cwd(), 'data', 'raw')

async function fetchPage(offset: number): Promise<JGrantsListResponse> {
  const url = `${BASE_URL}?limit=${LIMIT}&offset=${offset}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return res.json() as Promise<JGrantsListResponse>
}

async function fetchAllIds(): Promise<string[]> {
  const ids: string[] = []
  let offset = 0

  console.log('Fetching JGrants subsidy index...')

  const first = await fetchPage(0)
  const total = first.result.metadata.total_count
  console.log(`Total subsidies: ${total}`)

  const items: JGrantsListItem[] = [...first.result.subsidies]
  offset += first.result.subsidies.length

  while (offset < total) {
    try {
      const page = await fetchPage(offset)
      items.push(...page.result.subsidies)
      offset += page.result.subsidies.length
      process.stdout.write(`\r  Fetched ${offset}/${total}`)
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      console.error(`\nError at offset ${offset}:`, err)
      break
    }
  }

  console.log(`\nFetched ${items.length} items`)

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'jgrants-index.json'),
    JSON.stringify({ fetchedAt: new Date().toISOString(), items }, null, 2)
  )

  ids.push(...items.map((i) => i.id))
  return ids
}

fetchAllIds()
  .then((ids) => {
    console.log(`Saved ${ids.length} IDs to data/raw/jgrants-index.json`)
  })
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
