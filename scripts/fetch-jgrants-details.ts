import fs from 'fs'
import path from 'path'
import type { JGrantsDetail, JGrantsDetailResponse } from '../lib/types'

const BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v2/public/subsidies/id'
const RAW_DIR = path.join(process.cwd(), 'data', 'raw')
const DETAIL_DIR = path.join(RAW_DIR, 'jgrants-details')
const ERRORS_FILE = path.join(RAW_DIR, 'fetch-errors.json')
const CONCURRENCY = 3
const DELAY_MS = 300

type IndexItem = {
  id: string
  acceptance_start_datetime?: string
  acceptance_end_datetime?: string
  subsidy_max_limit?: number
}

async function fetchDetail(id: string): Promise<JGrantsDetailResponse> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<JGrantsDetailResponse>
}

async function fetchWithRetry(id: string, retries = 3): Promise<JGrantsDetailResponse | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchDetail(id)
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`  Failed ${id}: ${err}`)
        return null
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return null
}

function isClosed(item: IndexItem): boolean {
  if (!item.acceptance_end_datetime) return false
  const end = new Date(item.acceptance_end_datetime)
  return !isNaN(end.getTime()) && end < new Date()
}

function hasChanged(cached: JGrantsDetail, item: IndexItem): boolean {
  if (cached.acceptance_end_datetime !== item.acceptance_end_datetime) return true
  if (cached.acceptance_start_datetime !== item.acceptance_start_datetime) return true
  if (cached.subsidy_max_limit !== item.subsidy_max_limit) return true
  return false
}

function readCachedDetail(outFile: string): JGrantsDetail | null {
  try {
    const raw = JSON.parse(fs.readFileSync(outFile, 'utf-8')) as JGrantsDetailResponse
    return Array.isArray(raw.result) ? raw.result[0] : raw.result
  } catch {
    return null
  }
}

async function main() {
  const indexFile = path.join(RAW_DIR, 'jgrants-index.json')
  if (!fs.existsSync(indexFile)) {
    console.error('Run fetch-jgrants-index.ts first')
    process.exit(1)
  }

  const { items } = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) as {
    items: IndexItem[]
  }

  fs.mkdirSync(DETAIL_DIR, { recursive: true })

  let skippedClosed = 0
  let skippedUnchanged = 0
  let updated = 0
  const targets = items.filter((item) => {
    const outFile = path.join(DETAIL_DIR, `${item.id}.json`)
    if (isClosed(item)) {
      if (!fs.existsSync(outFile)) return true
      skippedClosed++
      return false
    }
    if (fs.existsSync(outFile)) {
      const cached = readCachedDetail(outFile)
      if (cached && !hasChanged(cached, item)) {
        skippedUnchanged++
        return false
      }
      updated++
    }
    return true
  })

  console.log(`Total: ${items.length}, Fetch: ${targets.length} (updated: ${updated}), Skipped (closed): ${skippedClosed}, Skipped (unchanged): ${skippedUnchanged}`)

  const errors: { id: string; error: string }[] = []
  let done = 0

  for (let i = 0; i < targets.length; i += CONCURRENCY) {
    const batch = targets.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (item) => {
        const outFile = path.join(DETAIL_DIR, `${item.id}.json`)
        const detail = await fetchWithRetry(item.id)
        if (detail) {
          fs.writeFileSync(outFile, JSON.stringify(detail, null, 2))
        } else {
          errors.push({ id: item.id, error: 'fetch failed' })
        }
        done++
      })
    )
    process.stdout.write(`\r  ${done}/${targets.length}`)
    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  console.log(`\nDone. Errors: ${errors.length}`)
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
