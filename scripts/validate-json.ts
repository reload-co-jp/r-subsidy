import fs from 'fs'
import path from 'path'
import type { NormalizedSubsidy, SubsidyIndexItem } from '../lib/types'

const GENERATED_DIR = path.join(process.cwd(), 'data', 'generated')

type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validateSubsidy(s: NormalizedSubsidy, index: number): string[] {
  const errors: string[] = []
  if (!s.id) errors.push(`[${index}] missing id`)
  if (!s.slug) errors.push(`[${index}] missing slug`)
  if (!s.title) errors.push(`[${index}] missing title`)
  if (!['national', 'tokyo', 'prefecture'].includes(s.region))
    errors.push(`[${index}] invalid region: ${s.region}`)
  if (!['open', 'upcoming', 'closed', 'unknown'].includes(s.status))
    errors.push(`[${index}] invalid status: ${s.status}`)
  if (!['jgrants', 'tokyo', 'manual'].includes(s.source))
    errors.push(`[${index}] invalid source: ${s.source}`)
  return errors
}

async function main(): Promise<ValidationResult> {
  const result: ValidationResult = { valid: true, errors: [], warnings: [] }

  // Check generated files exist
  const required = ['subsidies-index.json', 'subsidies-master.json', 'update-history.json']
  for (const file of required) {
    if (!fs.existsSync(path.join(GENERATED_DIR, file))) {
      result.errors.push(`Missing: ${file}`)
    }
  }

  if (result.errors.length > 0) {
    result.valid = false
    return result
  }

  // Validate index
  const index: SubsidyIndexItem[] = JSON.parse(
    fs.readFileSync(path.join(GENERATED_DIR, 'subsidies-index.json'), 'utf-8')
  )
  if (!Array.isArray(index)) {
    result.errors.push('subsidies-index.json is not an array')
  }

  // Validate master
  const master: NormalizedSubsidy[] = JSON.parse(
    fs.readFileSync(path.join(GENERATED_DIR, 'subsidies-master.json'), 'utf-8')
  )
  if (!Array.isArray(master)) {
    result.errors.push('subsidies-master.json is not an array')
  } else {
    for (let i = 0; i < master.length; i++) {
      const errs = validateSubsidy(master[i], i)
      result.errors.push(...errs)
    }
  }

  // Check index/master count match
  if (Array.isArray(index) && Array.isArray(master) && index.length !== master.length) {
    result.warnings.push(`Count mismatch: index=${index.length}, master=${master.length}`)
  }

  // Check detail files
  const detailDir = path.join(GENERATED_DIR, 'subsidies-detail')
  if (fs.existsSync(detailDir) && Array.isArray(master)) {
    for (const subsidy of master) {
      const detailFile = path.join(detailDir, `${subsidy.slug}.json`)
      if (!fs.existsSync(detailFile)) {
        result.warnings.push(`Missing detail file: ${subsidy.slug}.json`)
      }
    }
  }

  result.valid = result.errors.length === 0
  return result
}

main()
  .then((result) => {
    if (result.errors.length > 0) {
      console.error('Validation errors:')
      result.errors.forEach((e) => console.error(`  ✗ ${e}`))
    }
    if (result.warnings.length > 0) {
      console.warn('Warnings:')
      result.warnings.forEach((w) => console.warn(`  ⚠ ${w}`))
    }
    if (result.valid) {
      console.log('✓ Validation passed')
    } else {
      process.exit(1)
    }
  })
  .catch((err) => {
    console.error('Fatal:', err)
    process.exit(1)
  })
