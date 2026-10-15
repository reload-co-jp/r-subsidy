import fs from "fs"
import path from "path"

export type GlossaryTerm = {
  slug: string
  term: string
  reading: string
  category: string
  summary: string
  body: string
  related: string[]
  links: { label: string; href: string }[]
  updatedAt: string
}

export const GLOSSARY_CATEGORIES = [
  "基本用語",
  "申請・審査",
  "交付・事業実施",
  "金額・経費",
  "対象者",
]

export function loadGlossary(): GlossaryTerm[] {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "data", "source", "glossary.json"),
        "utf-8"
      )
    )
  } catch {
    return []
  }
}

// 制度ページの項目名 → 用語ページ
export const FIELD_GLOSSARY: Record<string, string> = {
  受付状態: "kobo-kikan",
  申請期間: "kobo-kikan",
  補助上限額: "hojo-jougengaku",
  補助率: "hojoritsu",
  中小企業向け: "chusho-kigyosha",
}
