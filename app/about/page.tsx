import type { Metadata } from "next"
import Link from "next/link"
import { SITE_NAME, absoluteUrl } from "../../lib/site"

export const metadata: Metadata = {
  title: `このサイトについて | ${SITE_NAME}`,
  description:
    "RSubsidy 補助金サーチの概要、掲載情報、運営会社についてまとめたページです。",
  alternates: {
    canonical: absoluteUrl("/about/"),
  },
}

const companyItems = [
  { label: "運営会社", value: "株式会社リロード / Reload, Inc." },
  { label: "代表者", value: "山本翔平" },
  { label: "設立", value: "2014年8月22日" },
  { label: "事業内容", value: "インターネット関連事業" },
  {
    label: "所在地",
    value: "〒101-0046 東京都千代田区神田佐久間町 3-37-1 山茂登ビル 3F",
  },
]

export default function AboutPage() {
  return (
    <div className="page-content">
      <section style={{ marginBottom: "2.5rem" }}>
        <h1
          style={{
            color: "var(--text-strong)",
            fontSize: "1.6rem",
            lineHeight: 1.4,
            marginBottom: "1rem",
          }}
        >
          このサイトについて
        </h1>
        <div
          style={{
            color: "var(--text-base)",
            fontSize: ".95rem",
            lineHeight: 1.9,
          }}
        >
          <p style={{ marginBottom: ".8rem" }}>
            {SITE_NAME}は、中小企業・個人事業主が使える補助金を探しやすくするための補助金ポータルサイトです。
          </p>
          <p>
            Jグランツ掲載の制度をもとに、都道府県・受付状態・目的から検索、比較、診断できる情報を提供しています。
          </p>
        </div>
      </section>

      <section
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-soft)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        <h2
          style={{
            color: "var(--text-strong)",
            fontSize: "1.1rem",
            marginBottom: "1rem",
          }}
        >
          運営会社
        </h2>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(7rem, 10rem) 1fr",
            gap: ".8rem 1rem",
            color: "var(--text-base)",
            fontSize: ".9rem",
            lineHeight: 1.7,
          }}
        >
          {companyItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: "contents",
              }}
            >
              <dt style={{ color: "var(--text-muted)" }}>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
          <div style={{ display: "contents" }}>
            <dt style={{ color: "var(--text-muted)" }}>公式サイト</dt>
            <dd>
              <a
                href="https://reload.co.jp"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#38b48b", textUnderlineOffset: ".15em" }}
              >
                https://reload.co.jp
              </a>
            </dd>
          </div>
        </dl>
      </section>

      <section style={{ textAlign: "center" }}>
        <Link
          href="/subsidies"
          style={{
            display: "inline-block",
            backgroundColor: "#38b48b",
            color: "#fff",
            textDecoration: "none",
            fontSize: ".95rem",
            fontWeight: "bold",
            padding: ".75rem 1.75rem",
            borderRadius: "8px",
          }}
        >
          補助金一覧を見る →
        </Link>
      </section>
    </div>
  )
}
