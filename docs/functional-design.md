# 機能設計書

## 画面構成

### /auth　ログイン・サインアップ画面
- メールアドレスとパスワードで新規登録・ログイン
- 未ログインのユーザーがどのページにアクセスしても自動でここにリダイレクト

### /　タスク一覧画面（要ログイン）
- タスクの追加（テキスト入力 + 追加ボタン）
- タスクの完了切り替え（チェックボックス）
- タスクの削除（削除ボタン）
- 自分のタスクのみ表示


## データ設計

### tasks テーブル

| カラム名 | 型 | 内容 |
|---|---|---|
| id | UUID | タスクを一意に識別する番号（自動生成） |
| user_id | UUID | 誰のタスクか（ログインユーザーのID） |
| title | text | タスクの内容 |
| completed | boolean | 完了状態（デフォルト：false） |
| created_at | timestamp | 作成日時（自動生成） |

<!-- 差別化機能に応じて以下のカラムを追加する -->
<!-- 期日管理：due_date timestamp -->
<!-- カテゴリ：category text -->
<!-- 優先度：priority text（high / medium / low） -->


## API設計（Next.js API Routes）

| メソッド | パス | 処理 |
|---|---|---|
| GET | /api/tasks | タスク一覧取得 |
| POST | /api/tasks | タスク追加 |
| PATCH | /api/tasks/[id] | タスク更新（完了切り替え） |
| DELETE | /api/tasks/[id] | タスク削除 |
