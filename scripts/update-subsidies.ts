import { execSync } from 'child_process'
import path from 'path'

const scripts = [
  'fetch-jgrants-index.ts',
  'fetch-jgrants-details.ts',
  'normalize-jgrants.ts',
  'merge-local-subsidies.ts',
  'build-subsidy-json.ts',
  'validate-json.ts',
]

function run(script: string) {
  console.log(`\n── ${script} ──`)
  execSync(`tsx ${path.join('scripts', script)}`, {
    stdio: 'inherit',
    env: process.env,
  })
}

console.log('=== Subsidy data update ===')
const start = Date.now()

for (const script of scripts) {
  run(script)
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
console.log(`\n=== Done in ${elapsed}s ===`)
