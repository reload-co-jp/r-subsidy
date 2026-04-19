# 中小企業向け補助金ポータルサイト 実装仕様書（完全版）
## JグランツAPI連携・静的JSON更新対応

---

# 1. 目的
中小企業・個人事業主向けに、自社属性から補助金を検索・マッチングできる静的ポータルサイトを構築する。

- JグランツAPIからデータ取得
- 東京都補助金を統合
- JSONベースで静的配信
- フロントエンドでスコアリング

---

# 2. アーキテクチャ

## 2.1 構成
- Frontend: Next.js（SSG）
- Data Pipeline: Node.js scripts
- Storage: JSON files
- Hosting: Static hosting (Vercel / Cloudflare)

## 2.2 データフロー
1. Jグランツ一覧取得
2. 補助金ID抽出
3. 詳細V2取得
4. raw保存
5. 正規化
6. 東京都データ統合
7. JSON生成
8. ビルド・デプロイ

---

# 3. ディレクトリ構成

project-root/
  data/
    generated/
      subsidies-index.json
      subsidies-detail/
      subsidies-master.json
      update-history.json
    source/
      tokyo-subsidies.json
      manual-overrides.json
  scripts/
  lib/

---

# 4. スクリプト仕様

## fetch-jgrants-index.ts
- 一覧API取得
- ID抽出

## fetch-jgrants-details.ts
- 詳細V2取得
- エラー記録

## normalize-jgrants.ts
- 正規化
- raw + normalized生成

## merge-local-subsidies.ts
- 東京都データ統合

## build-subsidy-json.ts
- index/detail/master生成

## validate-json.ts
- スキーマ検証

---

# 5. データ構造

## 5.1 raw
APIレスポンスそのまま

## 5.2 normalized
検索・UI・判定用

---

# 6. 正規化ルール

## 地域
- national / tokyo / prefecture

## 業種
- 分割・カテゴリ化

## 従業員数
- min / max抽出

## 用途
- タグ化

## 募集状況
- open / upcoming / closed / unknown

## workflow
- 最優先

---

# 7. スコアリング

score =
 region +
 industry +
 employee +
 purpose +
 status +
 tokyoBonus

---

# 8. フロント仕様

## ページ
- /
- /diagnosis
- /subsidies
- /subsidies/[slug]

## 診断入力
- 事業形態
- 所在地
- 業種
- 従業員数
- 用途

## 結果
- 強くおすすめ
- 条件一致
- 要確認

---

# 9. JSON出力

- subsidies-index.json
- subsidies-detail/{id}.json
- subsidies-master.json
- update-history.json

---

# 10. 更新コマンド

pnpm subsidies:update

---

# 11. エラーハンドリング

- API失敗 → 継続
- 正規化失敗 → warning
- 致命エラー → abort

---

# 12. 非機能要件

- 高速表示
- 型安全
- 保守性
- 拡張性

---

# 13. 受け入れ条件

- JSON生成成功
- UI表示成功
- マッチング動作
- workflow反映

---

# 14. 実装順序

1. 型定義
2. API取得
3. 正規化
4. JSON生成
5. UI
6. スコアリング

---

# 15. 補足

- rawデータは必ず保持
- workflowを優先
- 完全自動判定はしない

