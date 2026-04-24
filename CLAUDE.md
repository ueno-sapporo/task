# CLAUDE.md

非エンジニアが2日間でWebアプリを作るカリキュラム用プロジェクトです。

---

## Claude Code へのお願い

- 技術用語は必ず日本語で一言説明を付ける
- エラーが出たときは原因と次にやることをやさしく伝える
- コードを変更するときは「何をなぜ変えるか」を先に説明する
- 「次に何をすればいいか」を毎回明確に伝える

## このプロジェクトについて

- **アプリ：** タスク管理アプリ（誰のために・何のために作るかは受講生が決める）
- **期間：** 2日間
- **対象：** プログラミング未経験者

## 技術スタック

| 役割 | 技術 |
| ---- | ---- |
| フロントエンド | Next.js 14（App Router） |
| スタイリング | Tailwind CSS |
| 言語 | TypeScript |
| データベース・認証 | Supabase |
| デプロイ | Vercel |

## docs/ の設計ドキュメント

実装前に必ず参照すること。

| ファイル | 受講生が埋める箇所 |
| -------- | ------------------ |
| `product-requirements.md` | コンセプト・対象ユーザー・解決する課題・差別化機能 |
| `functional-design.md` | 画面構成・DBテーブル（差別化カラム）・API |
| `architecture.md` | ほぼ記載済み。読んで内容を把握するだけ |

## カリキュラムの流れ

DAY1：設計 → PHASE1（UI）→ PHASE2（DB）
DAY2：PHASE2.5（ログイン）→ PHASE3（デプロイ）→ PHASE4（オリジナル機能）

**設計**
アイデア壁打ち → `docs/` の3ファイルを順に埋める → 各ファイル確認後に次へ進む。

**PHASE1（UI作成）**
`.steering/phase1-ui-creation/` 作成 → `functional-design.md` を読んでUI実装 → `localhost:3000` で確認。

**PHASE2（DB連携）**
`.steering/phase2-database/` 作成 → Supabase でテーブル作成 → `.env.local` に APIキー設定 → リロードでデータが残るか確認。

**PHASE2.5（ログイン）**
`.steering/phase2-auth/` 作成 → ログイン画面 + `middleware.ts` + RLSポリシーを実装 → 別アカウントでデータが分離されるか確認。

**PHASE3（デプロイ）**
`.steering/phase3-deploy/` 作成 → `.gitignore` に `.env.local` があるか確認 → GitHub push → Vercel デプロイ → Vercel の環境変数を設定。

**PHASE4（オリジナル機能）**
`.steering/phase4-ai-feature/` 作成 → `product-requirements.md` の差別化要素を実装 → GitHub push → Vercel 自動反映を確認。

## トークン節約

- 画面右下のトークン使用率が **80%** を超えたら `/compact` を実行する
- フェーズが切り替わるタイミングで新しいセッションを始めると効率がよい
- `node_modules/` `.next/` `.git/` は読まなくてよい
- `/compact` 時は「変更したファイル一覧・現在のフェーズ・次にやること」を必ず要約に残すこと

## セキュリティ

- `.env.local` は絶対にGitHubにアップしない
- GitHubにpushする前に `.gitignore` に `.env.local` が含まれているか確認する
- Supabaseでテーブルを作ったら必ずRLSポリシーを設定する
- Vercelにも環境変数を設定する（しないとDBが動かない）
