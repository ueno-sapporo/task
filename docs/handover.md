# 引継書

作成日：2026-04-25

---

## アプリ概要

**アプリ名：** タスク管理アプリ
**コンセプト：** 仕事の対応漏れをゼロにする、リマインド付きタスク管理アプリ
**対象ユーザー：** メール・依頼・タスクの対応を忘れてしまうことがある会社員・ビジネスパーソン

### 差別化機能
- **リマインド機能** — タスクに期限を設定すると、指定日時に自動でリマインド通知が届く
- **漏れ通知メール** — 期限を過ぎても未完了のタスクがある場合、指定メールアドレスに自動アラートを送信

---

## 技術スタック

| 役割 | 技術 |
|---|---|
| フロントエンド | Next.js 14（App Router） |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| データベース・認証 | Supabase（PHASE2以降で設定） |
| メール送信 | Resend（PHASE4で設定） |
| 定期実行 | Vercel Cron Jobs（PHASE4で設定） |
| デプロイ | Vercel（PHASE3で設定） |

---

## フォルダ構成

```
アプリ作成/
├── docs/
│   ├── product-requirements.md   # プロダクト要求定義書
│   ├── functional-design.md      # 機能設計書
│   ├── architecture.md           # 技術仕様書
│   └── handover.md               # この引継書
├── .steering/
│   └── phase1-ui-creation/       # PHASE1の進捗メモ
├── app/
│   ├── page.tsx                  # タスク一覧画面（/）
│   ├── auth/page.tsx             # ログイン・新規登録画面（/auth）
│   ├── settings/page.tsx         # 通知先メール設定画面（/settings）
│   ├── layout.tsx                # 共通レイアウト
│   └── globals.css               # グローバルスタイル
├── package.json
└── .env.local                    # ※未作成。PHASE2で作成する
```

---

## 進捗状況

| フェーズ | 内容 | 状態 |
|---|---|---|
| 設計 | product-requirements / functional-design / architecture 記入 | ✅ 完了 |
| PHASE1 | UI作成（3画面） | ✅ 完了 |
| PHASE2 | Supabaseとのデータベース連携 | ⬜ 未着手 |
| PHASE2.5 | ログイン機能（Supabase Auth） | ⬜ 未着手 |
| PHASE3 | Vercelデプロイ・GitHub連携 | ⬜ 未着手 |
| PHASE4 | リマインド・漏れ通知メール機能 | ⬜ 未着手 |

---

## 現在の画面一覧（PHASE1完了時点）

| URL | 画面名 | 実装内容 |
|---|---|---|
| `http://localhost:3000` | タスク一覧 | タスク追加・完了切替・削除・期限切れ赤表示 |
| `http://localhost:3000/auth` | ログイン | メール＋パスワード入力フォーム（UI のみ） |
| `http://localhost:3000/settings` | 設定 | 漏れ通知メールアドレス入力フォーム（UI のみ） |

> ⚠️ 現時点ではデータはブラウザを閉じるとリセットされます。PHASE2完了後に永続化されます。

---

## 次にやること — PHASE2（データベース連携）

### 手順
1. [Supabase](https://supabase.com) でアカウント作成・新規プロジェクト作成
2. 以下の2テーブルをSupabaseで作成する

**tasks テーブル**

| カラム名 | 型 | 備考 |
|---|---|---|
| id | uuid | Primary Key, デフォルト: gen_random_uuid() |
| user_id | uuid | auth.users を参照 |
| title | text | NOT NULL |
| completed | boolean | デフォルト: false |
| due_date | timestamptz | 期限日時 |
| remind_at | timestamptz | リマインド日時 |
| created_at | timestamptz | デフォルト: now() |

**profiles テーブル**

| カラム名 | 型 | 備考 |
|---|---|---|
| id | uuid | Primary Key（auth.users の id と同じ） |
| alert_email | text | 漏れ通知先メールアドレス |

3. `.env.local` を作成してSupabaseのAPIキーを設定
4. SupabaseクライアントをNext.jsに組み込む
5. タスク一覧・追加・更新・削除をSupabaseと繋げる

### .env.local のテンプレート（PHASE2で作成）
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxx
```

---

## 開発サーバーの起動方法

```bash
cd "C:\Users\mtk\Desktop\テスト　AICAMP\アプリ作成"
npm run dev
```

→ ブラウザで `http://localhost:3000` を開く

---

## 注意事項

- `.env.local` は **絶対にGitHubにアップしない**（.gitignore に含まれているか必ず確認）
- Supabaseでテーブルを作ったら **必ずRLSポリシーを設定する**（RLS = Row Level Security：自分のデータしか見えないようにする仕組み）
- Vercelにデプロイする際は **Vercelの環境変数にもSupabaseのキーを設定する**
