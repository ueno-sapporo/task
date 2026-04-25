# 技術仕様書

## 技術スタック

| 役割 | 技術・ツール | 理由 |
|---|---|---|
| フロントエンド | Next.js 14 (App Router) | 画面とバックエンドを1つのプロジェクトで書ける |
| スタイリング | Tailwind CSS | クラス名を書くだけでデザインが整う |
| 言語 | TypeScript | JavaScriptに「型」を加えてミスを減らせる |
| データベース | Supabase (PostgreSQL) | DB・認証・APIを無料でまとめて使える |
| 認証 | Supabase Auth | ログイン機能を数行で実装できる |
| 公開 | Vercel | GitHubにpushするだけで自動デプロイ |
| バージョン管理 | Git / GitHub | コード履歴の管理とクラウド保存 |
| メール送信 | Resend | APIキー1つでメール送信できる無料サービス |
| 定期実行 | Vercel Cron Jobs | 毎時など定期的にAPIを自動で呼び出す仕組み |


## ディレクトリ構成

```
task-app/
├── docs/                          # 設計ドキュメント
│   ├── product-requirements.md   # プロダクト要求定義書
│   ├── functional-design.md      # 機能設計書
│   └── architecture.md           # 技術仕様書（このファイル）
├── app/
│   ├── (auth)/
│   │   └── auth/page.tsx          # ログイン・サインアップ画面
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts           # GET / POST
│   │       └── [id]/route.ts      # PATCH / DELETE
│   └── page.tsx                   # タスク一覧画面
├── lib/
│   └── supabase.ts                # Supabaseクライアント
├── .env.local                     # 環境変数（Supabaseの接続情報・Resend APIキー）
└── vercel.json                    # Vercel Cron Jobs の設定
```


## 環境変数

`.env.local` に以下を設定する（Supabaseのダッシュボードから取得）：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxx
RESEND_API_KEY=xxxxxxxxxx
```
