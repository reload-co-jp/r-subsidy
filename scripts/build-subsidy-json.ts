import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy, SubsidyIndexItem, UpdateHistory } from '../lib/types'

const MERGED_FILE = path.join(process.cwd(), 'data', 'normalized', 'merged.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'generated')
const PUBLIC_DIR = path.join(process.cwd(), 'public', 'data')

function ensureDirs() {
  for (const dir of [
    OUT_DIR,
    path.join(OUT_DIR, 'subsidies-detail'),
    PUBLIC_DIR,
    path.join(PUBLIC_DIR, 'subsidies-detail'),
  ]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
}

async function main() {
  if (!fs.existsSync(MERGED_FILE)) {
    console.error('Run merge-local-subsidies.ts first')
    process.exit(1)
  }

  ensureDirs()

  const { subsidies, counts } = JSON.parse(fs.readFileSync(MERGED_FILE, 'utf-8')) as {
    subsidies: NormalizedSubsidy[]
    counts: { jgrants: number; national: number; tokyo: number; total: number }
  }

  console.log(`Building JSON for ${subsidies.length} subsidies...`)

  // subsidies-index.json (lightweight list)
  const index: SubsidyIndexItem[] = subsidies.map((s) => ({
    id: s.id,
    slug: s.slug,
    title: s.title,
    region: s.region,
    prefectures: s.prefectures,
    status: s.status,
    industries: s.industries,
    purposes: s.purposes,
    upperLimit: s.upperLimit,
    source: s.source,
    updatedAt: s.updatedAt,
  }))

  writeJson(path.join(OUT_DIR, 'subsidies-index.json'), index)
  writeJson(path.join(PUBLIC_DIR, 'subsidies-index.json'), index)

  // subsidies-master.json (full data for client-side scoring)
  writeJson(path.join(OUT_DIR, 'subsidies-master.json'), subsidies)
  writeJson(path.join(PUBLIC_DIR, 'subsidies-master.json'), subsidies)

  // subsidies-detail/{slug}.json
  for (const subsidy of subsidies) {
    const detailData = subsidy
    writeJson(path.join(OUT_DIR, 'subsidies-detail', `${subsidy.slug}.json`), detailData)
    writeJson(path.join(PUBLIC_DIR, 'subsidies-detail', `${subsidy.slug}.json`), detailData)
  }

  // update-history.json
  const history: UpdateHistory = {
    lastUpdated: new Date().toISOString(),
    totalCount: subsidies.length,
    sources: {
      jgrants: counts.jgrants,
      national: counts.national ?? 0,
      tokyo: counts.tokyo,
      manual: 0,
    },
  }
  writeJson(path.join(OUT_DIR, 'update-history.json'), history)
  writeJson(path.join(PUBLIC_DIR, 'update-history.json'), history)

  console.log(`Built:`)
  console.log(`  subsidies-index.json (${index.length} items)`)
  console.log(`  subsidies-master.json (${subsidies.length} items)`)
  console.log(`  subsidies-detail/ (${subsidies.length} files)`)
  console.log(`  update-history.json`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
