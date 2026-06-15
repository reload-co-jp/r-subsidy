import { FC } from "react"
import Link from "next/link"
import Image from "next/image"
import fs from "fs"
import path from "path"
import type { Metadata } from "next"
import { POPULAR_PREFECTURES } from "../lib/prefectures"
import type {
  NormalizedSubsidy,
  SubsidyIndexItem,
  UpdateHistory,
} from "../lib/types"
import { SITE_NAME, SITE_URL, absoluteUrl } from "../lib/site"
import { formatDate, formatAmount } from "../lib/format"
import PurposeTagLink from "../components/elements/purpose-tag-link"
import HomeSearchForm from "../components/elements/home-search-form"

function getUpdateHistory(): UpdateHistory | null {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "update-history.json"
    )
    return JSON.parse(fs.readFileSync(file, "utf-8"))
  } catch {
    return null
  }
}

function getLatestSubsidies(): NormalizedSubsidy[] {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-master.json"
    )
    const subsidies: NormalizedSubsidy[] = JSON.parse(
      fs.readFileSync(file, "utf-8")
    )

    return subsidies
      .filter((subsidy) => subsidy.status !== "closed")
      .sort((a, b) => getSortTime(b) - getSortTime(a))
      .slice(0, 5)
  } catch {
    return []
  }
}

function getLawyerComments(): Record<string, string> {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "source",
      "lawyer-comments.json"
    )
    const raw = JSON.parse(fs.readFileSync(file, "utf-8"))
    // _comment キーを除外
    const { _comment: _c, ...comments } = raw
    void _c
    return comments
  } catch {
    return {}
  }
}

function getSubsidyStats() {
  try {
    const file = path.join(
      process.cwd(),
      "data",
      "generated",
      "subsidies-index.json"
    )
    const subsidies: SubsidyIndexItem[] = JSON.parse(
      fs.readFileSync(file, "utf-8")
    )

    return subsidies.reduce(
      (stats, subsidy) => {
        stats.total += 1
        stats[subsidy.status] += 1
        return stats
      },
      {
        total: 0,
        open: 0,
        upcoming: 0,
        closed: 0,
        unknown: 0,
      }
    )
  } catch {
    return null
  }
}

function getSortTime(subsidy: NormalizedSubsidy) {
  const date = subsidy.startDate ?? subsidy.updatedAt
  const time = new Date(date).getTime()
  return Number.isNaN(time) ? 0 : time
}

export const metadata: Metadata = {
  title: `${SITE_NAME} | 中小企業・個人事業主向け`,
  description:
    "中小企業・個人事業主向けに、Jグランツ掲載の補助金を都道府県・受付状態・目的から検索し、事業内容に合う制度を診断できる補助金ポータルです。",
  alternates: {
    canonical: absoluteUrl("/"),
  },
}

const Page: FC = () => {
  const history = getUpdateHistory()
  const stats = getSubsidyStats()
  const latestSubsidies = getLatestSubsidies()
  const lawyerComments = getLawyerComments()
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ja",
    description:
      "中小企業・個人事業主向けに、Jグランツ掲載の補助金を都道府県・受付状態・目的から検索し、事業内容に合う制度を診断できる補助金ポータルです。",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/subsidies/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
  const latestItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "最新の補助金",
    itemListElement: latestSubsidies.map((subsidy, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/subsidies/${subsidy.slug}/`),
      name: subsidy.title,
    })),
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {latestSubsidies.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(latestItemList) }}
        />
      )}

      {/* Hero */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Image
          src="/images/hero.jpg"
          alt="補助金ポータル"
          width={1400}
          height={500}
          priority
          style={{
            width: "100%",
            height: "min(52vw, 520px)",
            minHeight: "320px",
            display: "block",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.1) 100%)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              width: "100%",
              padding: "0 2rem",
            }}
          >
            <div
              style={{
                borderLeft: "4px solid #B9985A",
                paddingLeft: "1.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <h1
                style={{
                  fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
                  fontWeight: "bold",
                  color: "#fff",
                  lineHeight: 1.3,
                  marginBottom: ".75rem",
                }}
              >
                あなたの事業に合った補助金を
                <br />
                かんたん診断
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
                  lineHeight: 1.75,
                }}
              >
                事業形態・業種・従業員数などを入力するだけで、
                <br />
                Jグランツ掲載の補助金をスコアリングして最適な制度をご提案します。
              </p>
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/diagnosis"
                style={{
                  display: "inline-block",
                  backgroundColor: "#B9985A",
                  color: "#0D0D0D",
                  padding: "0.9rem 2.75rem",
                  textDecoration: "none",
                  fontWeight: "500",
                  fontSize: ".95rem",
                  letterSpacing: ".08em",
                }}
              >
                診断をはじめる
              </Link>
              <Link
                href="/subsidies"
                style={{
                  display: "inline-block",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.85)",
                  padding: "0.9rem 2.75rem",
                  textDecoration: "none",
                  fontWeight: "400",
                  fontSize: ".95rem",
                  letterSpacing: ".08em",
                  border: "1px solid rgba(255,255,255,0.4)",
                }}
              >
                補助金一覧
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section
        style={{
          backgroundColor: "#000000",
          padding: "1.5rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            { label: "登録補助金数", value: stats ? `${stats.total}件` : "—" },
            { label: "受付中", value: stats ? `${stats.open}件` : "—" },
            { label: "公募前", value: stats ? `${stats.upcoming}件` : "—" },
            { label: "JグランツAPI連携", value: history ? `${history.sources.jgrants}件` : "—" },
            {
              label: "最終更新",
              value: history ? new Date(history.lastUpdated).toLocaleDateString("ja-JP") : "未取得",
            },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid rgba(185,152,90,0.2)" : "none",
                padding: "0 1rem",
              }}
            >
              <div
                style={{
                  color: "#B9985A",
                  fontSize: "1.5rem",
                  fontFamily: '"Yu Mincho", "YuMincho", Georgia, serif',
                  fontWeight: "400",
                  letterSpacing: ".04em",
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: ".72rem", marginTop: ".25rem", letterSpacing: ".05em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search */}
      <section style={{ backgroundColor: "var(--bg-surface-alt)", padding: "3rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "1.25rem" }}>
            <h2
              style={{
                color: "var(--text-strong)",
                fontSize: "1.4rem",
                fontWeight: "bold",
              }}
            >
              補助金を検索
            </h2>
          </div>
          <HomeSearchForm />
        </div>
      </section>

      {/* About */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "3rem",
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  color: "#B9985A",
                  fontSize: ".8rem",
                  fontWeight: "bold",
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  marginBottom: ".75rem",
                }}
              >
                補助金ポータルでできること
              </p>
              <h2
                style={{
                  color: "var(--text-strong)",
                  fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                  fontWeight: "bold",
                  lineHeight: 1.4,
                  marginBottom: "1.25rem",
                }}
              >
                中小企業・個人事業主の
                <br />
                補助金探しをシンプルに
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: ".95rem", lineHeight: 1.9, marginBottom: ".8rem" }}>
                Jグランツ掲載の制度を、都道府県・受付状態・目的からまとめて確認できます。
                補助金一覧ページでは制度を比較でき、診断ページでは所在地・業種・従業員数・用途から自社に合いやすい補助金を絞り込めます。
              </p>
              <Link
                href="/subsidies"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: ".4rem",
                  color: "#1a1a1a",
                  textDecoration: "none",
                  fontSize: ".9rem",
                  fontWeight: "bold",
                  borderBottom: "2px solid #B9985A",
                  paddingBottom: ".1rem",
                }}
              >
                補助金一覧を見る →
              </Link>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              {[
                { num: "I", title: "条件で検索", desc: "都道府県・目的・受付状態で絞り込み" },
                { num: "II", title: "診断で発見", desc: "業種・従業員数から最適な制度を提案" },
                { num: "III", title: "最新情報", desc: "新着補助金をリアルタイムで更新" },
                { num: "IV", title: "申請ガイド", desc: "わかりやすい申請手順の解説" },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    backgroundColor: "var(--bg-surface-alt)",
                    padding: "1.5rem 1.25rem",
                    borderTop: "1px solid #B9985A",
                  }}
                >
                  <div
                    style={{
                      color: "#B9985A",
                      fontSize: ".7rem",
                      fontFamily: "Georgia, serif",
                      letterSpacing: ".15em",
                      marginBottom: ".75rem",
                    }}
                  >
                    {item.num}
                  </div>
                  <p
                    style={{
                      color: "var(--text-strong)",
                      fontSize: ".88rem",
                      fontWeight: "500",
                      letterSpacing: ".04em",
                      marginBottom: ".4rem",
                      fontFamily: '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", serif',
                    }}
                  >
                    {item.title}
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: ".78rem", lineHeight: 1.7 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Prefecture */}
      <section style={{ backgroundColor: "var(--bg-surface-alt)", padding: "3rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", marginBottom: "1.25rem" }}>
            <h2 style={{ color: "var(--text-strong)", fontSize: "1.4rem", fontWeight: "bold" }}>
              都道府県から探す
            </h2>
            <Link
              href="/subsidies"
              style={{
                color: "#1a1a1a",
                textDecoration: "none",
                fontSize: ".85rem",
                fontWeight: "bold",
                borderBottom: "1px solid #B9985A",
                paddingBottom: ".05rem",
                whiteSpace: "nowrap",
              }}
            >
              条件検索へ →
            </Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
            {POPULAR_PREFECTURES.map((prefecture) => (
              <Link
                key={prefecture}
                href={`/subsidies/prefecture/${encodeURIComponent(prefecture)}`}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-soft)",
                  borderRadius: "2px",
                  color: "var(--text-base)",
                  fontSize: ".82rem",
                  padding: ".42rem .85rem",
                  textDecoration: "none",
                }}
              >
                {prefecture}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Feature picks */}
      <section style={{ padding: "4rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p
            style={{
              color: "#B9985A",
              fontSize: ".8rem",
              fontWeight: "bold",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              marginBottom: ".5rem",
            }}
          >
            Featured
          </p>
          <h2
            style={{
              color: "var(--text-strong)",
              fontSize: "1.4rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
            }}
          >
            おすすめ補助金特集
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <Link href="/features/popular-sme" style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-soft)",
                  borderTop: "4px solid #B9985A",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".75rem",
                  height: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                  <span
                    style={{
                      backgroundColor: "#B9985A",
                      color: "#000",
                      borderRadius: "2px",
                      padding: ".15rem .5rem",
                      fontSize: ".7rem",
                      fontWeight: "bold",
                    }}
                  >
                    特集
                  </span>
                  <span style={{ color: "#B9985A", fontSize: ".75rem", fontWeight: "bold" }}>
                    受付中あり
                  </span>
                </div>
                <p style={{ color: "var(--text-strong)", fontSize: "1rem", fontWeight: "bold", lineHeight: 1.5, margin: 0 }}>
                  全業種対応・採択数が多い
                  <br />
                  中小企業向け補助金
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".82rem", lineHeight: 1.7, margin: 0 }}>
                  ものづくり補助金・事業再構築補助金など採択実績が豊富な定番制度を一覧で確認できます。
                </p>
                <span
                  style={{
                    color: "#1a1a1a",
                    fontSize: ".85rem",
                    fontWeight: "bold",
                    marginTop: "auto",
                    borderBottom: "2px solid #B9985A",
                    display: "inline-block",
                    paddingBottom: ".1rem",
                  }}
                >
                  特集を見る →
                </span>
              </div>
            </Link>
            <Link href="/features/it-companies" style={{ textDecoration: "none" }}>
              <div
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-soft)",
                  borderTop: "4px solid #1a1a1a",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".75rem",
                  height: "100%",
                }}
              >
                <div>
                  <span
                    style={{
                      backgroundColor: "#1a1a1a",
                      color: "#fff",
                      borderRadius: "2px",
                      padding: ".15rem .5rem",
                      fontSize: ".7rem",
                      fontWeight: "bold",
                    }}
                  >
                    特集
                  </span>
                </div>
                <p style={{ color: "var(--text-strong)", fontSize: "1rem", fontWeight: "bold", lineHeight: 1.5, margin: 0 }}>
                  IT系・零細企業向け
                  <br />
                  補助金特集
                </p>
                <p style={{ color: "var(--text-muted)", fontSize: ".82rem", lineHeight: 1.7, margin: 0 }}>
                  DX推進・クラウド化・システム導入など情報通信業やデジタル化を進めたい企業向け。
                </p>
                <span
                  style={{
                    color: "#1a1a1a",
                    fontSize: ".85rem",
                    fontWeight: "bold",
                    marginTop: "auto",
                    borderBottom: "2px solid #1a1a1a",
                    display: "inline-block",
                    paddingBottom: ".1rem",
                  }}
                >
                  特集を見る →
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest subsidies */}
      {latestSubsidies.length > 0 && (
        <section style={{ backgroundColor: "var(--bg-surface-alt)", padding: "4rem 2rem" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ color: "var(--text-strong)", fontSize: "1.4rem", fontWeight: "bold" }}>
                最新の補助金
              </h2>
              <Link
                href="/subsidies"
                style={{
                  color: "#1a1a1a",
                  textDecoration: "none",
                  fontSize: ".85rem",
                  fontWeight: "bold",
                  borderBottom: "1px solid #B9985A",
                  paddingBottom: ".05rem",
                  whiteSpace: "nowrap",
                }}
              >
                一覧で探す →
              </Link>
            </div>
            <div style={{ display: "grid", gap: "1px", border: "1px solid var(--border-soft)" }}>
              {latestSubsidies.map((subsidy) => (
                <Link
                  key={subsidy.id}
                  href={`/subsidies/${subsidy.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  <article className="subsidy-card-row">
                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", alignItems: "center", marginBottom: ".6rem" }}>
                      <span
                        style={{
                          backgroundColor: "#B9985A20",
                          color: "#8B6914",
                          border: "1px solid #B9985A60",
                          borderRadius: "2px",
                          padding: ".1rem .5rem",
                          fontSize: ".72rem",
                          fontWeight: "bold",
                        }}
                      >
                        {subsidy.status === "upcoming" ? "公募前" : "受付中"}
                      </span>
                      {subsidy.startDate && (
                        <span style={{ color: "var(--text-muted)", fontSize: ".78rem" }}>
                          受付開始 {formatDate(subsidy.startDate)}
                        </span>
                      )}
                      {subsidy.upperLimit && subsidy.upperLimit !== "0円" && (
                        <span style={{ color: "#d97706", fontSize: ".78rem", marginLeft: "auto", fontWeight: "bold" }}>
                          上限 {formatAmount(subsidy.upperLimit)}
                        </span>
                      )}
                    </div>
                    <h3 style={{ color: "var(--text-strong)", fontSize: ".98rem", lineHeight: 1.5, marginBottom: ".5rem", fontWeight: "bold" }}>
                      {subsidy.title}
                    </h3>
                    {subsidy.overview && (
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: ".8rem",
                          lineHeight: 1.7,
                          marginBottom: ".5rem",
                          overflow: "hidden",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {subsidy.overview}
                      </p>
                    )}
                    {subsidy.purposes.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: ".4rem",
                          flexWrap: "wrap",
                          marginBottom: lawyerComments[subsidy.slug] ? ".5rem" : undefined,
                        }}
                      >
                        {subsidy.purposes.slice(0, 3).map((purpose) => (
                          <PurposeTagLink key={purpose} purpose={purpose} />
                        ))}
                      </div>
                    )}
                    {lawyerComments[subsidy.slug] && (
                      <div
                        style={{
                          backgroundColor: "#FDFAF4",
                          border: "1px solid #D4B896",
                          borderLeft: "3px solid #B9985A",
                          padding: ".6rem .8rem",
                          marginTop: ".5rem",
                        }}
                      >
                        <span style={{ color: "#8B6914", fontSize: ".72rem", fontWeight: "bold", display: "block", marginBottom: ".25rem" }}>
                          行政書士コメント
                        </span>
                        <p style={{ color: "#333", fontSize: ".78rem", lineHeight: 1.6, margin: 0 }}>
                          {lawyerComments[subsidy.slug]}
                        </p>
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section
        style={{
          backgroundColor: "#000000",
          padding: "4rem 2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <p style={{ color: "#B9985A", fontSize: ".8rem", fontWeight: "bold", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: ".75rem" }}>
            Get Started
          </p>
          <h2 style={{ color: "#ffffff", fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)", fontWeight: "bold", lineHeight: 1.4, marginBottom: "1.5rem" }}>
            補助金をすべて確認する
          </h2>
          <Link
            href="/subsidies"
            style={{
              display: "inline-block",
              backgroundColor: "#B9985A",
              color: "#000",
              textDecoration: "none",
              fontSize: "1rem",
              fontWeight: "bold",
              padding: "1rem 3rem",
              borderRadius: "2px",
            }}
          >
            補助金一覧を見る →
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Page
