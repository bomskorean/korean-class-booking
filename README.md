# 馬賑韓国語教室 予約システム / 한국어교실 예약시스템

韓国語教室の予約・チケット・決済システム。Next.js(App Router) + TypeScript + Prisma + PostgreSQL。
ホームページ(bomskankokugo.com)・LINE のリンクから別ウィンドウ/LIFF で開く想定。

> このリポジトリは **スターター骨格**です。Claude Code で続きを実装してください。
> 仕様の詳細は同梱の PRD（`예약시스템_기획서_PRD.md`）を参照。

## 主な機能
- 予約：無料体験 / 正規レッスン（1回50分表示・Googleカレンダー連携）
- チケット：4〜8回券・12回券、有効期間（初回レッスン日起算）、自動消化
- コース：正規クラス / 短期コース / TOPIK / 留学準備
- 決済：Stripe（カード＋PayPay）/ オフライン
- 通知：メール（Resend）＋ LINE Push（Messaging API）
- 進捗管理・管理ダッシュボード・電子契約同意

## 時間ルール（重要）
| 種別 | 表示 | カレンダー占有 | 開始グリッド |
|---|---|---|---|
| 無料体験 | 50分 | 60分（50+休憩10） | 正時のみ（毎時00分） |
| 正規 | 50分 | 70分（1h10m） | 30分単位 |

## セットアップ
```bash
npm install
cp .env.example .env        # 各種キーを設定
npx prisma migrate dev      # DB スキーマ作成
npm run seed                # コース・チケット商品の初期データ（要実装）
npm run dev                 # http://localhost:3000
```

## 連携キー（.env）
- `DATABASE_URL` … PostgreSQL（Supabase/Neon 等）
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` … カード＋PayPay
- `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_CHANNEL_SECRET` / `LIFF_ID`
- `GOOGLE_CALENDAR_ID` / `GOOGLE_SA_KEY`（サービスアカウント）
- `RESEND_API_KEY` … トランザクションメール
- `NEXTAUTH_SECRET` … 認証

## リンク構成（無料体験 ↔ 正規レッスンを分離）
ホームページ・LINE から **2つの独立リンク**で、それぞれ別ウィンドウで開く。
- `/trial`   … 無料体験（ログイン不要・チケット不要・正時スロット）
- `/regular` … 正規レッスン（要ログイン・チケット消化・30分グリッド）

## ディレクトリ
```
app/                 画面（App Router）
  page.tsx           ランディング/コース紹介（2つのCTA）
  trial/page.tsx     無料体験＋アンケート（独立リンク /trial）
  regular/page.tsx   正規レッスン予約（独立リンク /regular）
  mypage/            残りチケット・予約・進捗
  admin/             管理ダッシュボード
  api/               API（stripe webhook, line, calendar, booking）
lib/                 stripe / line / calendar / prisma / slots / pricing
prisma/schema.prisma データモデル
```

## 実装ロードマップ（PRD 8章）
1. MVP：コース紹介・無料体験・ログイン・予約＋チケット消化・メール通知
2. 決済（Stripe/PayPay）・LINE Push・リマインド・管理画面
3. 進捗・統計・カレンダー同期・マーケ機能
