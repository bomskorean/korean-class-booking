import { TICKET_TIERS } from "@/lib/pricing";
import { C } from "@/lib/design";

const COURSES = [
  { emoji: "📖", tag: "正規クラス",  title: "ハングルからコツコツ",     desc: "入門→初級→中級→上級まで段階的に学ぶ完全1対1コース。" },
  { emoji: "✈️", tag: "短期コース",  title: "旅行・ドラマ・ファンミ韓国語", desc: "目的別・会話中心で短期間で使える韓国語を身につける。" },
  { emoji: "📝", tag: "TOPIK対策",   title: "TOPIK 準備",               desc: "TOPIK 各級に対応。模擬試験・過去問中心の対策コース。" },
  { emoji: "🎓", tag: "留学準備",    title: "留学準備（大学）",          desc: "面接・書類・アカデミック韓国語で韓国大学入学をサポート。" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 60px" }}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section style={{
        background: `linear-gradient(135deg, #FFFAE0 0%, #FFFCF5 100%)`,
        border: `1.5px solid #EBE5D5`,
        borderTop: "none",
        borderRadius: "0 0 24px 24px",
        padding: "48px 32px 40px",
        marginBottom: 48,
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.yellow, borderRadius: 24,
          padding: "4px 14px", fontSize: 13, fontWeight: 700,
          color: C.text, marginBottom: 20,
        }}>
          🇰🇷 完全1対1・オンライン＆対面
        </div>
        <h1 style={{
          fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 900,
          color: C.text, margin: "0 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2,
        }}>
          韓国語を、もっと楽しく。
        </h1>
        <p style={{ fontSize: 16, color: C.sub, margin: "0 0 32px", lineHeight: 1.7 }}>
          50分 ／ 完全1対1 ／ 初回無料体験あり
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/trial" style={heroBtnS("#F5C100", C.text)}>
            🎁 無料体験を予約する
          </a>
          <a href="/purchase" style={heroBtnS(C.text, "#FFFFFF")}>
            チケットを購入
          </a>
          <a href="/regular" style={{
            ...heroBtnS("transparent", C.sub),
            border: `1.5px solid ${C.border}`,
          }}>
            レッスンを予約
          </a>
        </div>
      </section>

      {/* ── Courses ───────────────────────────────────────────────── */}
      <section style={{ marginBottom: 52 }}>
        <SectionHeading>コース紹介</SectionHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {COURSES.map((c) => (
            <div key={c.title} style={{
              flex: "1 1 220px",
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{c.emoji}</div>
              <div style={{
                display: "inline-block",
                background: C.yellowLight, color: C.text,
                fontSize: 11, fontWeight: 700,
                padding: "2px 8px", borderRadius: 4, marginBottom: 8,
              }}>
                {c.tag}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
                {c.title}
              </h3>
              <p style={{ fontSize: 13, color: C.sub, margin: "0 0 14px", lineHeight: 1.6 }}>
                {c.desc}
              </p>
              <a href="/regular" style={{
                fontSize: 13, fontWeight: 700, color: C.text,
                background: C.yellowLight, borderRadius: 8,
                padding: "6px 12px",
                display: "inline-block",
                border: `1px solid ${C.yellow}`,
              }}>
                予約する →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ticket Pricing ────────────────────────────────────────── */}
      <section>
        <SectionHeading>チケット料金（税込・全コース共通）</SectionHeading>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {TICKET_TIERS.map((t) => {
            const popular = t.count === 4;
            const great   = t.count >= 8;
            return (
              <div key={t.count} style={{
                flex: "1 1 160px",
                background: popular ? C.yellowLight : C.card,
                border: `1.5px solid ${popular ? C.yellow : C.border}`,
                borderRadius: 16,
                padding: "20px 18px",
                position: "relative",
                boxShadow: popular ? "0 4px 16px rgba(245,193,0,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
              }}>
                {popular && <div style={priceBadgeS("#F5C100", C.text)}>おすすめ</div>}
                {great && !popular && <div style={priceBadgeS(C.text, "#FFFFFF")}>お得</div>}
                <div style={{ fontWeight: 800, fontSize: 20, color: C.text, marginBottom: 6 }}>
                  {t.count}回券
                </div>
                <div style={{ fontWeight: 700, fontSize: 22, color: popular ? "#8B6F00" : C.text }}>
                  ¥{t.price.toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                  1回 ¥{t.unitPrice.toLocaleString()} ／ {t.validMonths}か月
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ textAlign: "center", marginTop: 24 }}>
          <a href="/purchase" style={{
            display: "inline-block",
            padding: "13px 32px", borderRadius: 12,
            background: C.yellow, color: C.text,
            fontWeight: 700, fontSize: 15,
          }}>
            チケットを購入する →
          </a>
        </p>
      </section>

      {/* ── LINE ──────────────────────────────────────────────────── */}
      <section style={{
        background: "#F0FBF4", border: "1.5px solid #06C755",
        borderRadius: 20, padding: "32px 24px",
        marginTop: 48, textAlign: "center",
      }}>
        <p style={{ fontSize: 15, color: "#1a5c2a", fontWeight: 700, margin: "0 0 6px" }}>
          LINEで予約確認・お知らせを受け取る
        </p>
        <p style={{ fontSize: 13, color: "#2d7a45", margin: "0 0 20px", lineHeight: 1.6 }}>
          予約リマインド・お知らせをLINEでお届けします。
        </p>
        <a href="https://lin.ee/voKCX1e" target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "#06C755", color: "#FFFFFF",
          fontWeight: 800, fontSize: 17,
          padding: "15px 32px", borderRadius: 14,
          textDecoration: "none",
          boxShadow: "0 4px 18px rgba(6,199,85,0.4)",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.02 2 11c0 3.54 2.29 6.61 5.6 8.27-.08.59-.3 1.87-.34 2.16-.06.38.14.37.29.27.12-.08 1.88-1.28 2.64-1.8.58.08 1.18.12 1.81.12 5.52 0 10-4.02 10-9S17.52 2 12 2z" fill="white"/>
            <path d="M8 13H6.5V9.5H8V13zm4.75 0h-1.5l-2-3.5V13H7.75V9.5h1.5l2 3.5V9.5h1.5V13zm1.75 0h-1.5V9.5h1.5V13zm3.5 0h-3.5V9.5h1.5v2h2V13z" fill="#06C755"/>
          </svg>
          LINE 友だち追加
        </a>
      </section>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{children}</h2>
      <div style={{ flex: 1, height: "1.5px", background: "#EBE5D5" }} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const heroBtnS = (bg: string, color: string): React.CSSProperties => ({
  padding: "12px 24px",
  borderRadius: 12,
  background: bg,
  color,
  fontWeight: 700,
  fontSize: 15,
  display: "inline-block",
  boxShadow: bg === "#F5C100" ? "0 4px 16px rgba(245,193,0,0.35)" : "none",
});

const priceBadgeS = (bg: string, color: string): React.CSSProperties => ({
  position: "absolute", top: 8, right: 8,
  background: bg, color,
  fontSize: 10, fontWeight: 800,
  padding: "2px 6px", borderRadius: 4,
});
