"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface User { id: string; name: string; email: string }
interface Pkg  {
  id: string; name: string; totalCount: number;
  price: number; unitPrice: number; validMonths: number;
}
interface CompleteInfo {
  packageName: string; remainingCount: number; paymentId: string; price: number;
}
type View = "selecting" | "confirming" | "complete";

// ─── Main ────────────────────────────────────────────────────────────────────
export default function PurchasePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser]               = useState<User | null>(null);
  const [packages, setPackages]       = useState<Pkg[]>([]);
  const [selected, setSelected]       = useState<Pkg | null>(null);
  const [view, setView]               = useState<View>("selecting");
  const [paying, setPaying]           = useState(false);
  const [payError, setPayError]       = useState("");
  const [complete, setComplete]       = useState<CompleteInfo | null>(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/dev-auth")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.replace("/login"); return; }
        setUser(d.user);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  // ── Load packages ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/packages")
      .then((r) => r.json())
      .then((d) => {
        const pkgs: Pkg[] = d.packages ?? [];
        setPackages(pkgs);
        const def = pkgs.find((p) => p.totalCount === 4) ?? pkgs[0];
        if (def) setSelected(def);
      });
  }, []);

  // ── Mock pay ──────────────────────────────────────────────────────────────
  // ここを Stripe Checkout にする場合:
  //   const res = await fetch("/api/purchase/checkout", { method: "POST", ... })
  //   const { url } = await res.json()
  //   window.location.href = url   // → Stripe Checkout ページへ
  // 決済後は Stripe Webhook → fulfillPayment が呼ばれ、完了画面に戻ってくる
  async function pay() {
    if (!selected) return;
    setPaying(true);
    setPayError("");
    const res = await fetch("/api/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: selected.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPayError(data.error ?? "エラーが発生しました");
      setPaying(false);
      return;
    }
    setComplete({
      packageName:    data.packageName,
      remainingCount: data.remainingCount,
      paymentId:      data.paymentId,
      price:          data.price,
    });
    setView("complete");
    setPaying(false);
  }

  if (authLoading) return <main style={mainS}><p style={mutedS}>認証確認中...</p></main>;
  if (!user) return null;

  // ── Header (common) ───────────────────────────────────────────────────────
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 28, paddingBottom: 16, borderBottom: "1px solid #e6e9f2" }}>
      <div>
        <div style={{ fontSize: 12, color: "#67708a", marginBottom: 2 }}>ログイン中</div>
        <div style={{ fontWeight: 700 }}>{user.name}</div>
      </div>
      <a href="/regular" style={{ fontSize: 13, color: "#3b5bdb", textDecoration: "none" }}>
        ← レッスン予約へ
      </a>
    </div>
  );

  // ── View: selecting ───────────────────────────────────────────────────────
  if (view === "selecting") return (
    <main style={mainS}>
      {header}
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>チケットを購入</h1>
      <p style={{ fontSize: 14, color: "#67708a", marginBottom: 28 }}>
        1回50分 ／ 税込 ／ 有効期間は初回レッスン日より起算
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {packages.map((pkg) => {
          const sel = selected?.id === pkg.id;
          const isBest = pkg.totalCount >= 4;
          return (
            <button key={pkg.id} onClick={() => setSelected(pkg)} style={{
              padding: "16px 18px", borderRadius: 12, textAlign: "left", cursor: "pointer",
              border: sel ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
              background: sel ? "#eef2ff" : "#fff",
              position: "relative",
            }}>
              {isBest && pkg.totalCount === 4 && (
                <span style={badgeS("#e8590c")}>おすすめ</span>
              )}
              {pkg.totalCount >= 8 && (
                <span style={badgeS("#2b8a3e")}>お得</span>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: sel ? "#3b5bdb" : "#111" }}>
                  {pkg.name}
                </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: sel ? "#3b5bdb" : "#111" }}>
                  ¥{pkg.price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#67708a", marginLeft: 4 }}>税込</span>
                </span>
              </div>

              <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 13, color: "#67708a" }}>
                <span>1回 ¥{pkg.unitPrice.toLocaleString()}</span>
                <span>有効 {pkg.validMonths}か月</span>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setView("confirming")}
        disabled={!selected}
        style={primaryBtn(!selected)}
      >
        お支払いに進む →
      </button>
    </main>
  );

  // ── View: confirming (mock payment screen) ────────────────────────────────
  // Stripe 移行後: このビューを Stripe Checkout リダイレクトに置き換える
  if (view === "confirming") return (
    <main style={mainS}>
      {header}
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>お支払い確認</h1>

      {/* Package summary */}
      <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <Row label="商品">{selected?.name}</Row>
        <Row label="有効期間">{selected?.validMonths}か月（初回レッスン日より）</Row>
        <Row label="1回あたり">¥{selected?.unitPrice.toLocaleString()}</Row>
        <div style={{ borderTop: "1px solid #c5d0f5", marginTop: 12, paddingTop: 12,
          display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>合計（税込）</span>
          <span style={{ fontWeight: 800, fontSize: 24, color: "#3b5bdb" }}>
            ¥{selected?.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Mock payment method badge */}
      <div style={{ border: "1px dashed #aab0c7", borderRadius: 10, padding: 14,
        marginBottom: 24, fontSize: 14, color: "#555" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#fff3bf", color: "#805500", fontSize: 11,
            fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
            テスト
          </span>
          <span>モック決済（実際の請求はありません）</span>
        </div>
        <p style={{ fontSize: 12, color: "#aab0c7", marginTop: 8, marginBottom: 0 }}>
          Stripe カード／PayPay に差し替え可能なスタブです。
        </p>
      </div>

      {payError && (
        <div style={{ background: "#fff5f5", border: "1px solid #ffa8a8",
          borderRadius: 8, padding: 12, fontSize: 14, color: "#c92a2a", marginBottom: 16 }}>
          {payError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setView("selecting"); setPayError(""); }} style={backBtn}>
          ← 戻る
        </button>
        <button onClick={pay} disabled={paying} style={primaryBtn(paying)}>
          {paying ? "処理中..." : "決済を完了する"}
        </button>
      </div>
    </main>
  );

  // ── View: complete ────────────────────────────────────────────────────────
  return (
    <main style={mainS}>
      {header}
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>お支払いが完了しました</h2>
        <p style={{ color: "#67708a", marginBottom: 28, fontSize: 14 }}>
          チケットが付与されました。さっそくレッスンを予約しましょう！
        </p>

        <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20,
          marginBottom: 28, textAlign: "left" }}>
          <Row label="商品">{complete?.packageName}</Row>
          <Row label="金額">¥{complete?.price.toLocaleString()}</Row>
          <Row label="残りチケット">
            <span style={{ fontSize: 22, fontWeight: 800, color: "#3b5bdb" }}>
              {complete?.remainingCount}回
            </span>
          </Row>
          <Row label="決済ID">
            <code style={{ fontSize: 11, color: "#3b5bdb" }}>{complete?.paymentId}</code>
          </Row>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="/regular" style={{
            display: "block", padding: "13px 20px", borderRadius: 10,
            background: "#3b5bdb", color: "#fff",
            fontWeight: 700, fontSize: 15, textDecoration: "none", textAlign: "center",
          }}>
            レッスンを予約する →
          </a>
          <a href="/purchase" style={{
            display: "block", padding: "11px 20px", borderRadius: 10,
            background: "#f6f7fb", color: "#555",
            fontWeight: 400, fontSize: 14, textDecoration: "none", textAlign: "center",
            border: "1px solid #e6e9f2",
          }}>
            続けて購入する
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
      marginBottom: 10, fontSize: 14 }}>
      <span style={{ color: "#67708a", minWidth: 80 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mainS: React.CSSProperties = {
  maxWidth: 560, margin: "0 auto", padding: "28px 16px", fontFamily: "sans-serif",
};

const mutedS: React.CSSProperties = { color: "#aab0c7", marginTop: 80 };

const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  flex: 1, width: "100%", padding: "14px 20px", borderRadius: 10,
  fontSize: 15, fontWeight: 700,
  background: disabled ? "#aab0c7" : "#3b5bdb", color: "#fff",
  border: "none", cursor: disabled ? "not-allowed" : "pointer",
});

const backBtn: React.CSSProperties = {
  padding: "14px 16px", borderRadius: 10, fontSize: 14,
  background: "#f6f7fb", color: "#555", border: "1px solid #e6e9f2", cursor: "pointer",
};

const badgeS = (bg: string): React.CSSProperties => ({
  position: "absolute", top: 10, right: 14,
  background: bg, color: "#fff",
  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
});
