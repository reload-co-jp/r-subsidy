import "./reset.css"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import {
  DEFAULT_OG_IMAGE,
  OPERATOR_NAME,
  OPERATOR_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "../lib/site"
import { loadUpdateHistory, toJstDate } from "../lib/seo"
import { formatDate } from "../lib/format"

const GA_MEASUREMENT_ID = "G-LECQC20MLT"
const isProduction = process.env.NODE_ENV === "production"

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | 中小企業・個人事業主向け`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: absoluteUrl("/"),
  },
  applicationName: SITE_NAME,
  category: "business",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  keywords: [
    "補助金",
    "助成金",
    "中小企業",
    "個人事業主",
    "都道府県",
    "東京都",
    "Jグランツ",
    "補助金診断",
  ],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 中小企業・個人事業主向け`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | 中小企業・個人事業主向け`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl(DEFAULT_OG_IMAGE)],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  const structuredData = [buildOrganizationSchema(), buildWebSiteSchema()]
  const history = loadUpdateHistory()
  const lastUpdated = history ? formatDate(toJstDate(history.lastUpdated)) : null

  return (
    <html lang="ja">
      <head>
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="LLMs.txt"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {isProduction && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <a href="#main" className="skip-link">
          本文へスキップ
        </a>
        <header className="site-header">
          <nav className="site-nav" aria-label="グローバルナビゲーション">
            <Link href="/" className="site-logo">
              RSubsidy <span>補助金サーチ</span>
            </Link>
            <ul className="site-nav-links">
              <li>
                <Link href="/subsidies/" className="site-nav-link">
                  補助金一覧
                </Link>
              </li>
              <li>
                <Link href="/guides/" className="site-nav-link">
                  申請ガイド
                </Link>
              </li>
              <li>
                <Link href="/diagnosis/" className="btn btn-primary btn-sm">
                  補助金診断
                </Link>
              </li>
            </ul>
          </nav>
        </header>
        <main id="main" className="site-main">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container">
            <div className="footer-grid">
              <div>
                <p className="footer-heading">RSubsidy 補助金サーチ</p>
                <p>中小企業・個人事業主向けの補助金・助成金データベース</p>
              </div>
              <nav aria-label="補助金を探す">
                <p className="footer-heading">補助金を探す</p>
                <ul className="footer-list">
                  <li><Link href="/subsidies/">補助金一覧</Link></li>
                  <li><Link href="/subsidies/open/">受付中の補助金</Link></li>
                  <li><Link href="/subsidies/deadline/">締切が近い補助金</Link></li>
                  <li><Link href="/subsidies/upcoming/">公募予定の補助金</Link></li>
                  <li><Link href="/diagnosis/">補助金診断</Link></li>
                </ul>
              </nav>
              <nav aria-label="お役立ち情報">
                <p className="footer-heading">お役立ち情報</p>
                <ul className="footer-list">
                  <li><Link href="/guides/">申請ガイド</Link></li>
                  <li><Link href="/cases/">申請事例</Link></li>
                  <li><Link href="/news/">ニュース</Link></li>
                </ul>
              </nav>
              <nav aria-label="サイトについて">
                <p className="footer-heading">サイトについて</p>
                <ul className="footer-list">
                  <li><Link href="/about/">運営者情報・データについて</Link></li>
                  <li><Link href="/privacy/">プライバシーポリシー</Link></li>
                  <li>
                    <a href={OPERATOR_URL} target="_blank" rel="noopener noreferrer">
                      {OPERATOR_NAME}（運営会社）
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
            <div className="footer-note">
              <p>
                データ出典：
                <a href="https://www.jgrants-portal.go.jp/" target="_blank" rel="noopener noreferrer">
                  Jグランツ（デジタル庁）
                </a>
                の公開API、東京都ほか自治体の公開情報。
                {lastUpdated && <>最終データ更新：{lastUpdated}。</>}
              </p>
              <p>
                掲載情報は公開情報を自動取得・整理したもので、内容の正確性・最新性を保証するものではありません。
                申請の際は必ず各制度の公募要領・公式窓口で最新情報をご確認ください。本サイトは採択・受給を保証するものではありません。
              </p>
              <p>&copy; {new Date().getFullYear()} {OPERATOR_NAME}</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

export default RootLayout
