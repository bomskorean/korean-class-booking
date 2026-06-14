# CLAUDE.md — 馬賑韓国語教室 予約システム

このリポジトリで作業する Claude Code 向けのコンテキスト。**まず `docs/PRD.md` を読むこと。**

## プロジェクト概要
韓国語教室（日本在住の学習者向け）の予約・チケット・決済システム。
- スタック: Next.js(App Router) + TypeScript + Prisma + PostgreSQL
- 決済: Stripe（カード + PayPay） / オフライン
- 通知: Resend(メール) + LINE Messaging API(Push)
- カレンダー: Google Calendar 双方向同期（ダブルブッキング防止）
- ホームページ(bomskankokugo.com)・LINE から **別ウィンドウ**で開く

## 絶対に守るルール（仕様の核）
- **時間ルール**: 表示は常に50分。占有(カレンダー)は 無料体験=60分 / 正規=70分。
  開始グリッドは 無料体験=正時のみ、正規=30分単位。→ `lib/slots.ts`
- **チケット**: 1〜8回券・12回券、価格は全て税込、有効期間は初回レッスン日起算(+30日ガード)。→ `lib/pricing.ts`
- **消化**: 予約時に hold(仮押さえ)、完了/No-show/遅刻で確定、24h前キャンセルで復元(1回無料)。
- **入口分離**: `/trial`(無料体験・ログイン不要) と `/regular`(正規・要ログイン) は別ページ・別リンク。
- 価格・有効期間・キャンセル規約は `docs/受講契約書_改訂版.docx` と一致させる。

## コマンド
```bash
npm install
cp .env.example .env          # キー設定（開発は Stripe テストキーでOK）
npx prisma migrate dev        # DBスキーマ
npm run seed                  # 初期データ（コース/チケット商品）— 要実装
npm run dev                   # http://localhost:3000
npm test                      # vitest（lib/slots.test.ts）
```

## ディレクトリ
- `app/` 画面（page.tsx / trial / regular / mypage / admin / api）
- `lib/` slots, pricing, stripe, line, calendar, prisma
- `prisma/schema.prisma` データモデル（PRD 4章）

## 実装の優先順（MVP から）
1. seed（コース4種・チケット商品9種）+ Prisma マイグレーション
2. `/trial`: アンケート(TrialIntake) + 正時スロット + Booking(TRIAL) 作成 + メール通知
3. 認証(NextAuth: メール / LINE) 
4. `/regular`: 残りチケット表示 + 30分スロット + 予約(hold→消化) + Google Calendar 書込
5. Stripe Checkout(カード+PayPay) Webhook → チケット付与
6. LINE Push 通知 + リマインド(24h/1h前)
7. 管理画面 / 進捗 / 復習資料(3.10) / レビュー誘導(3.11) / 月謝制(25)

## 注意
- DB操作は必ず `lib/prisma.ts` の `prisma` を使う。
- カレンダー競合チェック→予約確定は同一トランザクション + 再確認(`getBusy`)で排他。
- 個人情報・決済キーはログに出さない。`.env` はコミットしない。
