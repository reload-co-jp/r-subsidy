import "./reset.css"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, absoluteUrl } from "../lib/site"

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "株式会社リロード",
  url: "https://reload.co.jp",
  logo: absoluteUrl("/favicon.svg"),
}

const GA_MEASUREMENT_ID = "G-LECQC20MLT"
const isProduction = process.env.NODE_ENV === "production"

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | 中小企業・個人事業主向け`,
    template: `%s | ${SITE_NAME}`,
  },
  description: "中小企業・個人事業主向けに、Jグランツ掲載の補助金情報を都道府県・受付状態・目的から検索、比較、診断できる補助金ポータルサイトです。",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: absoluteUrl("/"),
  },
  applicationName: SITE_NAME,
  category: "business",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
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
    description: "Jグランツ掲載の補助金情報を都道府県・受付状態・目的から検索、比較、診断できる補助金ポータルサイトです。",
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
    description: "Jグランツ掲載の補助金情報を都道府県・受付状態・目的から検索、比較、診断できる補助金ポータルサイトです。",
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
  return (
    <html lang="ja">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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
        <header
          style={{
            backgroundColor: "var(--bg-header)",
            boxShadow: "0 2px 10px rgba(34,50,45,0.08)",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 100,
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              height: "56px",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#38b48b",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "1rem",
                letterSpacing: "0.02em",
              }}
            >
              RSubsidy 補助金サーチ
            </Link>
            <Link href="/subsidies" style={navLinkStyle}>
              補助金一覧
            </Link>
            <Link href="/cases" style={navLinkStyle}>
              申請事例
            </Link>
            <Link href="/diagnosis" style={{ ...navLinkStyle, marginLeft: "auto" }}>
              診断スタート →
            </Link>
          </nav>
        </header>
        <main
          style={{
            background: "linear-gradient(180deg, #f7fffb 0%, #f1faf6 100%)",
            minHeight: "calc(100dvh - 56px - 48px)",
            padding: "2rem 1.5rem",
          }}
        >
          {children}
        </main>
        <footer
          style={{
            backgroundColor: "var(--bg-header)",
            borderTop: "1px solid var(--border-soft)",
            fontSize: ".75rem",
            padding: "1rem 1.5rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          <p>&copy; RSubsidy 補助金サーチ — JグランツAPI連携</p>
          <p style={{ marginTop: ".25rem" }}>
            Powered by{" "}
            <a
              href="https://reload.co.jp"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-muted)" }}
            >
              株式会社リロード
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}

const navLinkStyle: React.CSSProperties = {
  color: "var(--text-base)",
  textDecoration: "none",
  fontSize: ".875rem",
}

export default RootLayout
