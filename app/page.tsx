import { PACKAGES } from "@/lib/pricing";

const COURSES = [
  { tag: "正規クラス", title: "ハングルからコツコツ", desc: "入門→初級→中級→上級" },
  { tag: "短期コース", title: "旅行・ドラマ・ファンミ韓国語", desc: "目的別の会話中心" },
  { tag: "TOPIK対策", title: "TOPIK 準備", desc: "級別・模試/過去問中心" },
  { tag: "留学準備", title: "留学準備（大学）", desc: "面接・書類・アカデミック" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: 24, fontFamily: "sans-serif" }}>
      <h1>馬賑韓国語教室 ・ ご予約</h1>
      <p>ホームページ・LINE から別ウィンドウで予約できます。1回50分。</p>

      {/* 2つの独立リンク：無料体験 / 正規レッスン（それぞれ別ウィンドウ） */}
      <div style={{ display: "flex", gap: 12, margin: "16px 0", flexWrap: "wrap" }}>
        <a href="/trial" target="_blank" rel="noopener"
           style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 12, background: "#e8590c", color: "#fff", fontWeight: 700, textDecoration: "none", minWidth: 160 }}>
          無料体験を予約（無料）
        </a>
        <a href="/purchase" target="_blank" rel="noopener"
           style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 12, background: "#2b8a3e", color: "#fff", fontWeight: 700, textDecoration: "none", minWidth: 160 }}>
          チケットを購入
        </a>
        <a href="/regular" target="_blank" rel="noopener"
           style={{ flex: 1, textAlign: "center", padding: 14, borderRadius: 12, background: "#3b5bdb", color: "#fff", fontWeight: 700, textDecoration: "none", minWidth: 160 }}>
          レッスンを予約（要ログイン）
        </a>
      </div>

      <h2>コース紹介</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {COURSES.map((c) => (
          <div key={c.title} style={{ border: "1px solid #e6e9f2", borderRadius: 12, padding: 16 }}>
            <small style={{ color: "#3b5bdb" }}>{c.tag}</small>
            <h3 style={{ margin: "4px 0" }}>{c.title}</h3>
            <p style={{ color: "#67708a", fontSize: 13 }}>{c.desc}</p>
            <a href="/regular" target="_blank" rel="noopener">予約する →</a>
          </div>
        ))}
      </div>

      <h2>チケット（税込）</h2>
      <table>
        <thead><tr><th>商品</th><th>料金</th><th>1回</th><th>有効期間</th></tr></thead>
        <tbody>
          {PACKAGES.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td>{p.price.toLocaleString()}円</td>
              <td>{p.unitPrice.toLocaleString()}円</td>
              <td>{p.validMonths}か月</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 24 }}>
        <a href="/trial">無料体験を予約（50分・無料）</a>
      </p>
    </main>
  );
}
