import "./globals.css";

export const metadata = {
  title: "馬賑韓国語教室 ・ ご予約",
  description: "韓国語教室の予約・チケット・決済システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "#FFFFFF",
          borderBottom: "1.5px solid #EBE5D5",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
          <nav style={{
            maxWidth: 1000, margin: "0 auto",
            padding: "0 20px",
            display: "flex", alignItems: "center",
            flexWrap: "wrap", gap: 4,
            minHeight: 56,
          }}>
            <a href="/" style={{
              display: "flex", alignItems: "center", gap: 8,
              marginRight: 16, flexShrink: 0,
            }}>
              <span style={{
                background: "#F5C100", color: "#1A1A1A",
                fontSize: 12, fontWeight: 900,
                padding: "3px 7px", borderRadius: 6,
                letterSpacing: "0.5px",
              }}>
                한
              </span>
              <span className="nav-logo-text" style={{
                fontWeight: 800, fontSize: 16, color: "#1A1A1A", letterSpacing: "-0.3px",
              }}>
                馬賑韓国語教室
              </span>
            </a>

            <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: "auto", flexWrap: "wrap" }}>
              <a href="/" className="nav-link">ホーム</a>
              <a href="/trial" className="nav-link">無料体験</a>
              <a href="/purchase" className="nav-link">チケット購入</a>
              <a href="/regular" className="nav-link">レッスン予約</a>
              <a href="/admin" className="nav-link" style={{ color: "#999", fontSize: 13 }}>管理</a>
            </div>
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
