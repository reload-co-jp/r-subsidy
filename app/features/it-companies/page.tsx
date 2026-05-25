import { FC, Suspense } from "react"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import Link from "next/link"
import type { SubsidyIndexItem } from "../../../lib/types"
import { SITE_NAME, absoluteUrl } from "../../../lib/site"
import { Breadcrumb } from "../../../components/elements/breadcrumb"
import SubsidiesListClient from "../../subsidies/subsidies-list-client"

const PAGE_TITLE = "IT系・零細企業向け補助金特集"
const PAGE_DESCRIPTION =
  "IT企業・情報通信業・デジタル化を進めたい零細企業向けの補助金を一覧で掲載。システム導入、クラウド化、DX推進に使える制度を比較できます。"
const PAGE_URL = absoluteUrl("/features/it-companies/")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
}

function getSubsidies(): SubsidyIndexItem[] {
  try {
    const file = path.join(process.cwd(), "data", "generated", "subsidies-index.json")
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return []
  }
}

function getItSubsidies(all: SubsidyIndexItem[]): SubsidyIndexItem[] {
  return all.filter(
    (s) =>
      s.purposes.includes("デジタル化") ||
      (s.industries && s.industries.includes("情報通信業"))
  )
}

const IT_SUBSIDIES = [
  {
    label: "IT導入補助金",
    href: "/subsidies?q=IT導入補助金",
    amount: "5万〜450万円（セキュリティ枠 最大1,500万円）",
    recommend: 5,
    ease: 4,
    requirements: "中小企業・小規模事業者。認定ITベンダーのツール導入が必要。",
    note: "IT企業は「提供側（ベンダー登録）」として活用する戦略が有効。自社サービス開発には使えない。",
    purposes: ["デジタル化"],
    lawyerComment: "登録済みITツール・IT導入支援事業者の選定が申請の前提です。ツールが補助対象として登録されているかJグランツで事前確認し、支援事業者と早めに連絡を取ってください。交付申請は導入前に完了させる必要があり、先行発注・契約は補助対象外となります。",
  },
  {
    label: "ものづくり補助金",
    href: "/subsidies?q=ものづくり補助金",
    amount: "750万〜1,250万円（省力化枠 最大1,500万円）",
    recommend: 4,
    ease: 3,
    requirements: "革新的サービス開発・生産プロセス改善。付加価値額年率3%以上向上計画必須。",
    note: "システム開発・DXツール自社開発に使いやすい。",
    purposes: ["設備投資", "デジタル化"],
    lawyerComment: "事業計画書の付加価値額・給与支給総額の数値根拠が審査の核心です。IT企業の場合、ソフトウェア開発費が対象となる枠か要確認です。認定支援機関との計画策定を早期に開始し、賃上げ要件は補助事業後も継続義務がある点を踏まえた計画が必要です。",
  },
  {
    label: "小規模事業者持続化補助金",
    href: "/subsidies?q=持続化補助金",
    amount: "最大200万円",
    recommend: 3,
    ease: 5,
    requirements: "常時使用従業員5名以下（サービス業）。",
    note: "HP制作・広告費・展示会出展に活用可。手軽だが額は小さい。",
    purposes: ["販路拡大"],
    lawyerComment: "商工会・商工会議所の支援を受けて経営計画書を作成することが申請要件です。補助事業実施期間内に発注・支払・納品を完了させる必要があります。HP制作費は全額対象とならないケースもあるため、対象経費の範囲を公募要領で確認してください。",
  },
  {
    label: "キャリアアップ助成金",
    href: "/subsidies?q=キャリアアップ助成金",
    amount: "1人あたり最大80万円",
    recommend: 4,
    ease: 4,
    requirements: "非正規→正社員転換、または賃金引上げ。雇用保険適用事業所。",
    note: "エンジニア採用・正社員化で活用しやすい。",
    purposes: ["人材育成"],
    lawyerComment: "転換前6か月の雇用実績と転換後6か月の継続雇用が支給要件です。転換日・賃金額・雇用形態を就業規則・労働条件通知書に明確に記載してください。転換前に就業規則でキャリアアップ計画を整備しておく必要があります。",
  },
  {
    label: "人材開発支援助成金",
    href: "/subsidies?q=人材開発支援助成金",
    amount: "訓練費用の45〜75%（上限あり）",
    recommend: 4,
    ease: 4,
    requirements: "社員への職業訓練実施。訓練計画届出必須。",
    note: "エンジニア研修・資格取得費用に直接使える。",
    purposes: ["人材育成"],
    lawyerComment: "訓練開始前に都道府県労働局への訓練計画届出が必要です。外部訓練機関との契約書・カリキュラム・出席記録の整備が支給審査の重点となります。OJT・OFF-JTの区分に応じて対象経費・助成率が異なるため、公募要領の経費区分を事前確認してください。",
  },
  {
    label: "NEDO補助金（研究開発系）",
    href: "/subsidies?q=NEDO",
    amount: "数百万〜数億円",
    recommend: 4,
    ease: 2,
    requirements: "技術開発テーマが公募課題に合致必要。提案書・実施計画の精度高く求められる。",
    note: "AI・IoT・DX系スタートアップに強い。採択率低いが額大きい。",
    purposes: ["研究開発", "デジタル化"],
    lawyerComment: "NEDOの公募は課題適合性の評価ウェイトが高く、提案書の技術的優位性・実用化計画の具体性が採否を左右します。応募前のNEDO事前相談制度の活用を推奨します。研究開発費の直接経費・間接経費の区分管理が採択後に厳格に求められます。",
  },
  {
    label: "事業再構築補助金",
    href: "/subsidies?q=事業再構築補助金",
    amount: "最大3,000万〜1億円",
    recommend: 3,
    ease: 2,
    requirements: "売上・付加価値額減少要件あり。新分野展開・業態転換が必要。",
    note: "後継枠・新制度に移行中。最新情報確認必須。",
    purposes: ["設備投資", "デジタル化"],
    lawyerComment: "現行制度から新枠への移行期にあります。最新公募要領で売上減少・付加価値額要件を確認し、新分野展開の市場規模・競合分析を事業計画に盛り込んでください。補助事業期間終了後も付加価値額・給与支給総額の目標達成義務が続く点に注意が必要です。",
  },
]

function renderStars(count: number, max = 5): string {
  return "★".repeat(count) + "☆".repeat(max - count)
}

const Page: FC = () => {
  const all = getSubsidies()
  const itSubsidies = getItSubsidies(all)
  const openCount = itSubsidies.filter((s) => s.status === "open" || s.status === "upcoming").length

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: PAGE_TITLE,
    url: PAGE_URL,
    inLanguage: "ja",
    description: PAGE_DESCRIPTION,
    numberOfItems: itSubsidies.length,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "ホーム", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "補助金一覧", item: absoluteUrl("/subsidies/") },
        { "@type": "ListItem", position: 3, name: PAGE_TITLE, item: PAGE_URL },
      ],
    },
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Breadcrumb
        items={[
          { label: "ホーム", href: "/" },
          { label: "補助金一覧", href: "/subsidies" },
          { label: PAGE_TITLE },
        ]}
      />

      <div style={{ marginBottom: "2rem" }}>
        <p style={{ color: "#38b48b", fontSize: ".82rem", fontWeight: "bold", marginBottom: ".45rem" }}>
          特集
        </p>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.55rem",
            lineHeight: 1.4,
            marginBottom: ".65rem",
          }}
        >
          {PAGE_TITLE}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.8 }}>
          IT企業・情報通信業・デジタル化を検討している零細企業向けに絞り込んだ補助金一覧です。
          {openCount > 0 && (
            <> 現在 <strong style={{ color: "#22c55e" }}>{openCount}件</strong> が受付中・公募前です。</>
          )}
        </p>
      </div>

      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "10px",
          padding: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{ color: "var(--text-strong)", fontSize: "1rem", marginBottom: "1rem" }}
        >
          IT系企業が活用できる主な補助金
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          {IT_SUBSIDIES.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: ".75rem",
                alignItems: "flex-start",
                borderBottom: i < IT_SUBSIDIES.length - 1 ? "1px solid var(--border-soft)" : "none",
                paddingBottom: i < IT_SUBSIDIES.length - 1 ? "1rem" : "0",
              }}
            >
              <span
                style={{
                  backgroundColor: "#38b48b22",
                  color: "#38b48b",
                  border: "1px solid #38b48b44",
                  borderRadius: "4px",
                  padding: ".1rem .45rem",
                  fontSize: ".72rem",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginTop: ".15rem",
                  minWidth: "1.6rem",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    color: "var(--text-strong)",
                    fontSize: ".9rem",
                    fontWeight: "bold",
                    marginBottom: ".35rem",
                  }}
                >
                  <Link
                    href={item.href}
                    style={{ color: "inherit", textDecoration: "underline", textDecorationColor: "var(--border-soft)" }}
                  >
                    {item.label}
                  </Link>
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: ".35rem",
                    fontSize: ".75rem",
                  }}
                >
                  <span>
                    <span style={{ color: "var(--text-muted)" }}>おすすめ度 </span>
                    <span style={{ color: "#f59e0b", letterSpacing: ".05em" }}>{renderStars(item.recommend)}</span>
                  </span>
                  <span>
                    <span style={{ color: "var(--text-muted)" }}>取りやすさ </span>
                    <span style={{ color: "#38b48b", letterSpacing: ".05em" }}>{renderStars(item.ease)}</span>
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>
                    補助額：<strong style={{ color: "var(--text-strong)" }}>{item.amount}</strong>
                  </span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: ".8rem", lineHeight: 1.6, marginBottom: ".3rem" }}>
                  <strong style={{ color: "var(--text-strong)" }}>要件：</strong>{item.requirements}
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".78rem", lineHeight: 1.6, marginBottom: ".4rem" }}>
                  {item.note}
                </p>
                <div style={{ display: "flex", gap: ".3rem", flexWrap: "wrap", marginBottom: item.lawyerComment ? ".5rem" : undefined }}>
                  {item.purposes.map((p) => (
                    <span
                      key={p}
                      style={{
                        backgroundColor: "var(--bg-base)",
                        border: "1px solid var(--border-soft)",
                        borderRadius: "999px",
                        padding: ".1rem .5rem",
                        fontSize: ".7rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
                {item.lawyerComment && (
                  <div
                    style={{
                      backgroundColor: "#f0fdf8",
                      border: "1px solid #a7f3d0",
                      borderRadius: "6px",
                      padding: ".6rem .8rem",
                    }}
                  >
                    <span
                      style={{
                        color: "#059669",
                        fontSize: ".72rem",
                        fontWeight: "bold",
                        display: "block",
                        marginBottom: ".25rem",
                      }}
                    >
                      行政書士コメント
                    </span>
                    <p
                      style={{
                        color: "#064e3b",
                        fontSize: ".78rem",
                        lineHeight: 1.6,
                        margin: 0,
                      }}
                    >
                      {item.lawyerComment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "2rem",
          fontSize: ".85rem",
          color: "#78350f",
          lineHeight: 1.8,
        }}
      >
        <strong>申請のポイント：</strong>
        IT補助金は「デジタル化・DX推進」目的に加え、対象従業員数・業種・都道府県で受給可否が変わります。
        詳細ページで対象条件を必ず確認してください。
        <Link
          href="/diagnosis"
          style={{ color: "#d97706", marginLeft: ".5rem", textDecoration: "underline" }}
        >
          診断で自社に合う補助金を絞り込む →
        </Link>
      </section>

      <Suspense fallback={null}>
        <SubsidiesListClient
          subsidies={itSubsidies}
          availablePurposes={[...new Set(itSubsidies.flatMap((s) => s.purposes))].sort()}
        />
      </Suspense>
    </div>
  )
}

export default Page
