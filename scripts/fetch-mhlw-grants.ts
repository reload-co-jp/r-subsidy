import type { NormalizedSubsidy } from '../lib/types'
import {
  absoluteUrl,
  baseSubsidy,
  decodeEntities,
  escapeHtml,
  fetchText,
  htmlToText,
  keepUpdatedAt,
  oneLine,
  readNormalized,
  shortHash,
  writeNormalized,
} from './scrape-utils'

// 厚生労働省「雇用関係助成金一覧」から各コースのページを取得する。
// 多くは通年受付で公募期間の概念が無いため、受付状態は「要確認」とし、支給額などは公式ページへ誘導する。
const LIST_URL = 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/index_00057.html'
const OUT_FILE = 'mhlw-normalized.json'
// 一覧のうち、制度ではない／廃止済みのセクション
const SKIP_SECTIONS = /申請にあたって|廃止済み|政策について|関連リンク|情報配信|ソーシャル/

// 一覧のコース名 → ページURL。複数コースが1ページを共有することがある
function listCourses(html: string) {
  const byUrl = new Map<string, string[]>()
  const sections = html.split(/<h2\b/).slice(1)
  for (const section of sections) {
    const heading = oneLine(htmlToText(section.slice(section.indexOf('>') + 1, section.indexOf('</h2>'))))
    if (SKIP_SECTIONS.test(heading)) continue
    for (const m of section.matchAll(/<a\s[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const url = absoluteUrl(m[1], LIST_URL)?.replace(/index\.html$/, '')
      const label = oneLine(htmlToText(m[2])).replace(/（（独）高齢・障害・求職者雇用支援機構）/, '')
      if (!url || !/^https:\/\/www\.(mhlw|jeed)\.go\.jp\//.test(url) || /\.pdf$/i.test(url)) continue
      if (!/助成金|奨励金/.test(label)) continue
      byUrl.set(url, [...new Set([...(byUrl.get(url) ?? []), label])])
    }
  }
  return byUrl
}

// 見出し（h2〜h4）配下の段落・箇条書きを取り出す
function extractSection(html: string, heading: RegExp) {
  const parts = html.split(/(<h[2-4][^>]*>[\s\S]*?<\/h[2-4]>)/)
  const idx = parts.findIndex((p) => /^<h[2-4]/.test(p) && heading.test(oneLine(htmlToText(p))))
  if (idx < 0) return []
  return [...(parts[idx + 1] ?? '').matchAll(/<(p|li)[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((m) => oneLine(htmlToText(m[2])))
    .filter((l) => l.length > 10)
}

const GENERIC_DESCRIPTION = /について(紹介|掲載|ご案内)しています。?$/

function extractOverview(html: string, title: string) {
  const fromSection = extractSection(html, /^概要$|とは$|の概要$/)
  if (fromSection.length > 0) return fromSection
  // サイト共通の説明文を拾わないよう、制度名を含む meta description だけ使う
  const name = title.replace(/（.*$/, '')
  const meta = decodeEntities(html.match(/name="description" content="([^"]*)"/)?.[1] ?? '').trim()
  if (meta.includes(name) && meta.length > name.length + 20 && !GENERIC_DESCRIPTION.test(meta)) return [meta]
  // 見出し直後の最初の説明段落
  const afterH1 = html.slice(html.search(/<\/h1>/) + 5)
  const first = [...afterH1.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((m) => oneLine(htmlToText(m[1])))
    // 「〜を助成します」型の制度説明文に限る（お知らせ・注記・問い合わせ先を拾わない）
    .find(
      (t) =>
        t.length >= 40 &&
        /(助成|支給|交付)(します|されます|するもの|する制度|を行う|を行います)/.test(t) &&
        !/^[○●・※（(注]|PDF|Adobe|更新しました|問い合わせ|提出書類/.test(t)
    )
  return first ? [first] : []
}

function parseCourse(url: string, labels: string[], html: string): NormalizedSubsidy {
  const h1 = oneLine(htmlToText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? ''))
  // 複数コース共有ページは親制度名（コース名の括弧前）で1件にまとめる
  // 異なる制度のコースが同居するページは、ページ見出しを制度名にする
  const parents = [...new Set(labels.map((l) => l.replace(/（[^（）]*コース[^（）]*）$/, '').trim()))]
  const title = labels.length === 1 ? labels[0] : parents.length === 1 ? parents[0] : h1.replace(/^雇用・労働/, '') || parents[0]
  const overviewLines = extractOverview(html, title)
  const requirementLines = extractSection(html, /主な(支給|受給)要件/)
  const agency = url.includes('jeed.go.jp') ? '（独）高齢・障害・求職者雇用支援機構' : '都道府県労働局・ハローワーク'

  const detail = [
    overviewLines.length > 0 && `<h2>概要</h2>${overviewLines.map((l) => `<p>${escapeHtml(l)}</p>`).join('')}`,
    labels.length > 1 && `<h2>コース</h2><ul>${labels.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`,
    requirementLines.length > 0 &&
      `<h2>主な支給要件</h2><ul>${requirementLines.map((l) => `<li>${escapeHtml(l)}</li>`).join('')}</ul>`,
    `<h2>支給額・申請手続き</h2><p>支給額、申請様式、支給要領は公式ページで確認してください。申請窓口：${agency}。</p>`,
  ]
    .filter(Boolean)
    .join('\n')

  const slug = `mhlw-${shortHash(url)}`
  return baseSubsidy({
    id: slug,
    slug,
    title,
    overview: overviewLines.join(''),
    detail,
    region: 'national',
    prefectures: ['全国'],
    // 「雇用開発」等の語でキーワード判定が誤るため、用途は固定
    purposes: ['人材育成'],
    usePurpose: '雇用・人材育成',
    workflow: agency,
    source: 'mhlw',
    referenceUrl: url,
  })
}

async function main() {
  const previous = new Map(readNormalized(OUT_FILE).map((s) => [s.id, s]))
  const courses = listCourses(await fetchText(LIST_URL))
  console.log(`MHLW: ${courses.size} pages`)

  const subsidies: NormalizedSubsidy[] = []
  let failed = 0
  for (const [url, labels] of courses) {
    try {
      const parsed = parseCourse(url, labels, await fetchText(url))
      subsidies.push(keepUpdatedAt(parsed, previous.get(parsed.id)))
    } catch (err) {
      failed++
      const prev = previous.get(`mhlw-${shortHash(url)}`)
      if (prev) subsidies.push(prev) // 一時的な取得失敗では前回データを残す
      console.warn(`  skip ${url}: ${(err as Error).message}`)
    }
  }

  writeNormalized(OUT_FILE, subsidies)
  console.log(`MHLW: ${subsidies.length} subsidies (failed ${failed})`)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
