---
description: Mermaid図の詳細ルール・良い例を参照するスキル。設計ドキュメントでMermaid図を書くときに使う。
---

# Mermaid記法 詳細ルール

環境：Mermaid v8.8.0（古いバージョン対応の書き方が必要）

---

## 図の種類ごとのルール

### ユースケース図（graph LR）

- スコープは **MECE全体**（MVPと追加機能の両方を含む）
- 認証（ログイン・サインアップ・ログアウト）も必ず含める
- `graph LR`（横向き）を使う
- 全ノードを `["..."]` クォートありで定義してから矢印を書く
- 機能カテゴリごとに `subgraph` で囲んで視覚的に分類する
- ノードIDはカテゴリ頭文字＋連番にする（例：認証=`A1`、タスク管理=`B1`）
- 矢印はすべて `U -->` でユーザーから各ユースケースへ引く

**良い例**

```
graph LR
    U["ユーザー"]

    subgraph 認証
        A1["ログインする"]
        A2["サインアップする"]
        A3["ログアウトする"]
    end

    subgraph タスク管理
        B1["タスクを追加する"]
        B2["タスクを完了にする"]
        B3["タスクを削除する"]
    end

    U --> A1
    U --> A2
    U --> A3
    U --> B1
    U --> B2
    U --> B3
```

---

### 画面遷移図（graph TD）

- MVPと追加機能は**独立した図として分けて書く**
- ノードの形状：
  - 角丸四角 `("画面名")` ＝ UI画面（URLが存在するもの）
  - 四角 `["処理名"]` ＝ システム処理（画面ではない）
  - 円 `((開始点))` ＝ 開始点
- 図の上に必ず凡例を記載：`> 凡例：角丸四角＝UI画面　四角＝システム処理　円＝開始点`
- 色分け（`classDef`）は使わない

**良い例（MVP版）**

```
> 凡例：角丸四角＝UI画面　四角＝システム処理　円＝開始点

graph TD
    Start((開始)) -->|"未ログイン"| Login("ログイン画面 /auth")
    Start -->|"ログイン済み"| Home("タスク一覧 /")
    Login --> Auth["認証処理"]
    Auth -->|"成功"| Home
    Auth -->|"失敗"| Login
    Home --> Add["タスク追加処理"]
    Add --> Home
```

---

### コンポーネント設計（graph TD）

- 画面ごとに独立した図として分けて書く
- セクション名は画面遷移図の画面名と必ず一致させる

**良い例**

```
graph TD
    Page["タスク一覧ページ"] --> Header["ヘッダー（ログアウトボタン）"]
    Page --> TaskList["タスクリスト"]
    TaskList --> TaskItem["タスクアイテム（チェック・削除ボタン）"]
    Page --> AddForm["タスク追加フォーム（入力欄・追加ボタン）"]
```

---

### シーケンス図（sequenceDiagram）

- 参加者名は技術名でなく役割ベースの日本語にする
- `participant A as 役割名` の形式で定義する

**参加者名の対応表**

| 技術名（NG） | 役割名（OK） |
| ------------ | ----------- |
| page.tsx | 画面 |
| auth/page.tsx | ログイン画面 |
| app/api/tasks/route.ts | サーバー |
| tasksテーブル | データベース |
| Supabase Auth | 認証サービス |
| middleware.ts | 見張り役 |

**良い例**

```
sequenceDiagram
    participant A as ユーザー
    participant B as 画面
    participant C as サーバー
    participant D as データベース

    A->>B: 「追加」ボタンを押す
    B->>C: タスク追加リクエストを送る
    C->>D: tasksテーブルにデータを書き込む
    D-->>C: 書き込み完了
    C-->>B: 追加したタスクのデータを返す
    B-->>A: タスクリストを更新して表示する
```

---

### システム構成図（graph TD）

- ノード名はユーザー・フロントエンド・バックエンド・データベースの日本語固定
- 外部APIのみ実際のサービス名を使う（例：Supabase Auth）
- 双方向の通信は1本にまとめず、必ず往復2本の矢印で表現する

**良い例**

```
graph TD
    User["ユーザー"] -->|"操作"| Frontend["フロントエンド"]
    Frontend -->|"APIリクエスト"| Backend["バックエンド"]
    Backend -->|"認証リクエスト"| ExternalAPI["Supabase Auth"]
    Backend -->|"読み書き"| DB[("データベース")]
    ExternalAPI -->|"レスポンス"| Backend
    Backend -->|"レスポンス"| Frontend
    Frontend -->|"表示"| User
```

---

### データモデル定義

- `erDiagram` は使わない（表示が不安定）
- Markdownの表形式で書く（テーブルごとに「カラム名・型・説明」の3列）
- テーブルの関係はその下に箇条書きで補足する

**良い例**

```
### tasks テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | uuid | 一意のID（自動生成） |
| user_id | uuid | ユーザーID ※ auth.users と紐づく |
| title | text | タスクの内容 |
| completed | boolean | 完了フラグ（デフォルト false） |
| created_at | timestamp | 作成日時（自動生成） |

**リレーション**
- `tasks.user_id` → `auth.users.id`（多対1）
```
