import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy } from '../lib/types'
import { readNormalized, titleKey } from './scrape-utils'

const NORMALIZED_FILE = path.join(process.cwd(), 'data', 'normalized', 'jgrants-normalized.json')
const MANUAL_FILE = path.join(process.cwd(), 'data', 'source', 'manual-subsidies.json')
const OUT_DIR = path.join(process.cwd(), 'data', 'normalized')
const MERGED_FILE = path.join(OUT_DIR, 'merged.json')

function stringifyJson(data: unknown) {
  return JSON.stringify(data, null, 2)
}

function readPreviousMergedAt(nextPayload: unknown) {
  try {
    if (!fs.existsSync(MERGED_FILE)) return null

    const previous = JSON.parse(fs.readFileSync(MERGED_FILE, 'utf-8'))
    const previousComparable = { ...previous }
    delete previousComparable.mergedAt

    if (stringifyJson(previousComparable) === stringifyJson(nextPayload)) {
      return typeof previous.mergedAt === 'string' ? previous.mergedAt : null
    }
  } catch {
    // Ignore broken previous output and regenerate below.
  }

  return null
}

// 受付終了でない既存制度と制度名が一致（または一方が他方を含む）なら重複とみなす。
// 終了済みの過年度版としか一致しない場合は、新しい公募として残す
function isDuplicate(candidate: NormalizedSubsidy, existing: NormalizedSubsidy[]) {
  const key = titleKey(candidate.title)
  if (key.length < 6) return false
  return existing.some((e) => {
    // 同じ取得元の中は別制度（コース違いなど）なので比較しない
    if (e.status === 'closed' || e.source === candidate.source) return false
    const k = titleKey(e.title)
    const [short, long] = k.length < key.length ? [k, key] : [key, k]
    // 差分がコース名なら別制度（例: キャリアアップ助成金 と キャリアアップ助成金（障害者正社員化コース））
    return short.length >= 8 && long.includes(short) && !/コース/.test(long.replace(short, ''))
  })
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const jgrants: NormalizedSubsidy[] = fs.existsSync(NORMALIZED_FILE)
    ? JSON.parse(fs.readFileSync(NORMALIZED_FILE, 'utf-8')).subsidies
    : []
  const manual: NormalizedSubsidy[] = fs.existsSync(MANUAL_FILE)
    ? JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf-8'))
    : []
  // 追加ソースは優先度順に重複排除して加える（Jグランツ＞手動＞公社＞厚労省＞J-Net21）
  const extraSources: [string, NormalizedSubsidy[]][] = [
    ['tokyo', readNormalized('tokyo-kosha-normalized.json')],
    ['mhlw', readNormalized('mhlw-normalized.json')],
    ['jnet21', readNormalized('jnet21-normalized.json')],
  ]
  const merged: NormalizedSubsidy[] = [...jgrants, ...manual]
  const counts: Record<string, number> = {}
  const duplicates: Record<string, number> = {}
  for (const [name, items] of extraSources) {
    const accepted = items.filter((s) => !isDuplicate(s, merged))
    merged.push(...accepted)
    counts[name] = accepted.length
    duplicates[name] = items.length - accepted.length
  }
  const payload = {
    counts: {
      jgrants: jgrants.length,
      national: 0,
      tokyo: counts.tokyo,
      mhlw: counts.mhlw,
      jnet21: counts.jnet21,
      overrides: 0,
      manual: manual.length,
      total: merged.length,
    },
    subsidies: merged,
  }

  fs.writeFileSync(
    MERGED_FILE,
    stringifyJson({
      mergedAt: readPreviousMergedAt(payload) ?? new Date().toISOString(),
      ...payload,
    })
  )

  console.log(
    `Merged: ${jgrants.length} JGrants + ${manual.length} manual + ${JSON.stringify(counts)} = ${merged.length} total (duplicates skipped: ${JSON.stringify(duplicates)})`
  )
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
