"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C, S } from "@/lib/design";

// ─── Types ───────────────────────────────────────────────────────────────────
interface User { id: string; name: string; email: string }
interface Pkg  { id: string; name: string; totalCount: number; price: number; unitPrice: number; validMonths: number }
interface CompleteInfo { packageName: string; remainingCount: number; paymentId: string; price: number }
type View = "selecting" | "confirming" | "complete";

// ─── Main ─────────────────────────────────────────────────────────────────────
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

  // Stripe 移行時: このfetchを Checkout セッション作成 → リダイレクトに置き換える
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
    if (!res.ok) { setPayError(data.error ?? "エラーが発生しました"); setPaying(false); return; }
    setComplete({ packageName: data.packageName, remainingCount: data.remainingCount, paymentId: data.paymentId, price: data.price });
    setView("complete");
    setPaying(false);
  }

  if (authLoading) return <main style={S.page()}><p style={{ color: C.muted, marginTop: 60 }}>認証確認中...</p></main>;
  if (!user) return null;

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <span style={{ fontSize: 13, color: C.muted }}>
        ログイン中：<strong style={{ color: C.text }}>{user.name}</strong>
      </span>
      <a href="/regular" style={{
        fontSize: 13, color: C.yellow, fontWeight: 700,
        background: C.yellowLight, padding: "5px 12px",
        borderRadius: 8, border: `1px solid ${C.yellow}`,
      }}>
        ← レッスン予約へ
      </a>
    </div>
  );

  // ── View: selecting ───────────────────────────────────────────────────────
  if (view === "selecting") return (
    <main style={S.page()}>
      {header}
      <h1 style={h1S}>チケットを購入</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>
        1回50分 ／ 税込 ／ 有効期間は初回レッスン日より起算
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {packages.map((pkg) => {
          const sel    = selected?.id === pkg.id;
          const popular = pkg.totalCount === 4;
          const great   = pkg.totalCount >= 8;
          return (
            <button key={pkg.id} onClick={() => setSelected(pkg)} style={{
              padding: "16px 18px", borderRadius: 14, textAlign: "left", cursor: "pointer",
              border: `1.5px solid ${sel ? C.yellow : C.border}`,
              background: sel ? C.yellowLight : C.card,
              position: "relative",
              boxShadow: sel ? `0 0 0 1px ${C.yellow}, 0 4px 16px rgba(245,193,0,0.15)` : "0 2px 8px rgba(0,0,0,0.04)",
              transition: "border-color 0.15s",
            }}>
              {popular && <span style={badgeS(C.yellow, C.text)}>おすすめ</span>}
              {great && !popular && <span style={badgeS(C.text, "#FFFFFF")}>お得</span>}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{pkg.name}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: sel ? "#8B6F00" : C.text }}>
                  ¥{pkg.price.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 400, color: C.muted, marginLeft: 4 }}>税込</span>
                </span>
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 13, color: C.muted }}>
                <span>1回 ¥{pkg.unitPrice.toLocaleString()}</span>
                <span>有効 {pkg.validMonths}か月</span>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={() => setView("confirming")} disabled={!selected} style={S.primaryBtn(!selected)}>
        お支払いに進む →
      </button>
    </main>
  );

  // ── View: confirming ──────────────────────────────────────────────────────
  if (view === "confirming") return (
    <main style={S.page()}>
      {header}
      <h1 style={h1S}>お支払い確認</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>内容をご確認のうえ決済を完了してください。</p>

      <div style={{ ...S.card(22), background: C.yellowLight, borderColor: C.yellow, marginBottom: 20 }}>
        <InfoRow label="商品">{selected?.name}</InfoRow>
        <InfoRow label="有効期間">{selected?.validMonths}か月（初回レッスン日より）</InfoRow>
        <InfoRow label="1回あたり">¥{selected?.unitPrice.toLocaleString()}</InfoRow>
        <div style={{ borderTop: `1.5px solid ${C.yellow}`, marginTop: 14, paddingTop: 14,
          display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>合計（税込）</span>
          <span style={{ fontWeight: 800, fontSize: 26, color: "#8B6F00" }}>
            ¥{selected?.price.toLocaleString()}
          </span>
        </div>
      </div>

      <div style={{ ...S.card(14), marginBottom: 24, borderStyle: "dashed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: "#FFF3BF", color: "#805500", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>
            テスト
          </span>
          <span style={{ fontSize: 14, color: C.sub }}>モック決済（実際の請求はありません）</span>
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>
          Stripe カード／PayPay に差し替え可能なスタブです。
        </p>
      </div>

      {payError && <div style={S.errorBox()}>{payError}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setView("selecting"); setPayError(""); }} style={S.backBtn()}>← 戻る</button>
        <button onClick={pay} disabled={paying} style={S.primaryBtn(paying)}>
          {paying ? "処理中..." : "決済を完了する"}
        </button>
      </div>
    </main>
  );

  // ── View: complete ────────────────────────────────────────────────────────
  return (
    <main style={S.page()}>
      {header}
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎊</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          お支払いが完了しました！
        </h2>
        <p style={{ color: C.sub, fontSize: 15, marginBottom: 32 }}>
          チケットが付与されました。さっそくレッスンを予約しましょう！
        </p>

        <div style={{ ...S.card(22), marginBottom: 28, textAlign: "left", background: C.yellowLight, borderColor: C.yellow }}>
          <InfoRow label="商品">{complete?.packageName}</InfoRow>
          <InfoRow label="金額">¥{complete?.price.toLocaleString()}</InfoRow>
          <InfoRow label="残りチケット">
            <span style={{ fontSize: 26, fontWeight: 800, color: "#8B6F00" }}>
              {complete?.remainingCount}回
            </span>
          </InfoRow>
          <InfoRow label="決済ID">
            <code style={{ fontSize: 11, background: C.card, padding: "2px 6px", borderRadius: 4 }}>
              {complete?.paymentId}
            </code>
          </InfoRow>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="/regular" style={{
            display: "block", padding: "14px 20px", borderRadius: 12,
            background: C.yellow, color: C.text,
            fontWeight: 700, fontSize: 15, textAlign: "center",
            boxShadow: "0 4px 16px rgba(245,193,0,0.35)",
          }}>
            レッスンを予約する →
          </a>
          <a href="/purchase" style={{
            display: "block", padding: "12px 20px", borderRadius: 12,
            background: C.card, color: C.sub, fontWeight: 600, fontSize: 14,
            textAlign: "center", border: `1.5px solid ${C.border}`,
          }}>
            続けて購入する
          </a>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
      marginBottom: 10, fontSize: 14 }}>
      <span style={{ color: C.sub, minWidth: 80 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const h1S: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" };

const badgeS = (bg: string, color: string): React.CSSProperties => ({
  position: "absolute", top: 10, right: 14,
  background: bg, color, fontSize: 11, fontWeight: 800,
  padding: "2px 8px", borderRadius: 4,
});
