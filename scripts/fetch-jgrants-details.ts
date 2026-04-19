import fs from 'fs'
import path from 'path'
import type { JGrantsDetailResponse } from '../lib/types'

const BASE_URL = 'https://api.jgrants-portal.go.jp/exp/v2/public/subsidies/id'
const RAW_DIR = path.join(process.cwd(), 'data', 'raw')
const DETAIL_DIR = path.join(RAW_DIR, 'jgrants-details')
const ERRORS_FILE = path.join(RAW_DIR, 'fetch-errors.json')
const CONCURRENCY = 3
const DELAY_MS = 300

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

async function main() {
  const indexFile = path.join(RAW_DIR, 'jgrants-index.json')
  if (!fs.existsSync(indexFile)) {
    console.error('Run fetch-jgrants-index.ts first')
    process.exit(1)
  }

  const { items } = JSON.parse(fs.readFileSync(indexFile, 'utf-8')) as {
    items: { id: string }[]
  }
  const ids = items.map((i) => i.id)

  fs.mkdirSync(DETAIL_DIR, { recursive: true })

  const errors: { id: string; error: string }[] = []
  let done = 0

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY)
    await Promise.all(
      batch.map(async (id) => {
        const outFile = path.join(DETAIL_DIR, `${id}.json`)
        if (fs.existsSync(outFile)) {
          done++
          return
        }
        const detail = await fetchWithRetry(id)
        if (detail) {
          fs.writeFileSync(outFile, JSON.stringify(detail, null, 2))
        } else {
          errors.push({ id, error: 'fetch failed' })
        }
        done++
      })
    )
    process.stdout.write(`\r  ${done}/${ids.length}`)
    await new Promise((r) => setTimeout(r, DELAY_MS))
  }

  console.log(`\nDone. Errors: ${errors.length}`)
  fs.writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2))
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
