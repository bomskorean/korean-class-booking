"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { C, S } from "@/lib/design";

// ─── Types ───────────────────────────────────────────────────────────────────
interface User    { id: string; name: string; email: string }
interface Package { name: string; validMonths: number; unitPrice: number; courseScope: string | null }
interface Ticket  { id: string; remainingCount: number; validFrom: string | null; expiresAt: string | null; package: Package }
interface Slot    { startAt: string; displayEndAt: string; available: boolean }
interface Result  { bookingId: string; startAt: string; remainingAfter: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });
const toDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "long", day: "numeric", weekday: "short" });
const toTime = (iso: string) => jst(iso, { hour: "2-digit", minute: "2-digit" });
const toShortDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
const minDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" }); };
const maxDate = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" }); };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RegularPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading]   = useState(true);
  const [user, setUser]                 = useState<User | null>(null);
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [view, setView] = useState<"selecting" | "confirming" | "complete">("selecting");

  const [selectedDate, setSelectedDate]   = useState("");
  const [slots, setSlots]                 = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd]     = useState("");

  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult]           = useState<Result | null>(null);

  useEffect(() => {
    fetch("/api/dev-auth")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) { router.replace("/login"); return; }
        setUser(data.user);
      })
      .catch(() => router.replace("/login"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  const fetchTickets = useCallback(async () => {
    const res = await fetch("/api/tickets");
    if (!res.ok) return;
    const data = await res.json();
    const list: Ticket[] = data.tickets ?? [];
    setTickets(list);
    if (list.length > 0) setSelectedTicket(list[0]);
  }, []);

  useEffect(() => { if (user) fetchTickets(); }, [user, fetchTickets]);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedStart("");
    fetch(`/api/slots?date=${selectedDate}&kind=regular`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  async function logout() {
    await fetch("/api/dev-auth", { method: "DELETE" });
    router.push("/login");
  }

  async function submitBooking() {
    if (!selectedTicket) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/regular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startAt:  selectedStart,
          ticketId: selectedTicket.id,
          courseId: selectedTicket.package.courseScope ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message ?? "エラーが発生しました。"); return; }
      setResult({ bookingId: data.bookingId, startAt: data.startAt, remainingAfter: data.remainingAfter });
      setView("complete");
    } catch {
      setSubmitError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  function bookAnother() {
    setView("selecting");
    setSelectedDate("");
    setSlots([]);
    setSelectedStart("");
    setSelectedEnd("");
    setResult(null);
    fetchTickets();
  }

  if (authLoading) return <main style={S.page()}><p style={{ color: C.muted, marginTop: 60 }}>認証確認中...</p></main>;
  if (!user) return null;

  // ── Header ────────────────────────────────────────────────────────────────
  const header = (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 28, paddingBottom: 18,
      borderBottom: `1.5px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>
          <span style={{
            background: "#FFF3BF", color: "#805500",
            fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 3, marginRight: 6,
          }}>DEV</span>
          ログイン中
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{user.name}</div>
      </div>
      <button onClick={logout} style={{
        fontSize: 12, color: C.sub, background: C.card,
        border: `1.5px solid ${C.border}`, borderRadius: 8,
        padding: "5px 12px", cursor: "pointer",
      }}>
        ログアウト
      </button>
    </div>
  );

  // ── View: selecting ───────────────────────────────────────────────────────
  if (view === "selecting") return (
    <main style={S.page()}>
      {header}
      <h1 style={h1S}>レッスンのご予約</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>50分 ／ 完全1対1</p>

      {/* Ticket selection */}
      <div style={{ marginBottom: 28 }}>
        <label style={S.label()}>保有チケット</label>
        {tickets.length === 0 ? (
          <div style={{
            background: C.redBg, border: `1.5px solid ${C.redBorder}`,
            borderRadius: 12, padding: 16,
          }}>
            <p style={{ color: C.red, fontSize: 14, margin: "0 0 12px" }}>有効なチケットがありません。</p>
            <a href="/purchase" style={{
              display: "inline-block", padding: "9px 16px", borderRadius: 8,
              background: C.yellow, color: C.text, fontWeight: 700, fontSize: 13,
            }}>
              チケットを購入する →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.map((t) => {
              const sel = selectedTicket?.id === t.id;
              return (
                <button key={t.id} onClick={() => setSelectedTicket(t)} style={{
                  padding: "14px 16px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `1.5px solid ${sel ? C.yellow : C.border}`,
                  background: sel ? C.yellowLight : C.card,
                  boxShadow: sel ? `0 0 0 1px ${C.yellow}` : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{t.package.name}</span>
                    <span style={{ fontSize: 24, fontWeight: 800, color: sel ? "#8B6F00" : C.text }}>
                      {t.remainingCount}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2, color: C.sub }}>回残り</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4, display: "flex", gap: 12 }}>
                    <span>有効期限：{t.expiresAt ? `${toShortDate(t.expiresAt)}まで` : "初回レッスン日より起算"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tickets.length > 0 && (
        <>
          <div style={{ marginBottom: 24 }}>
            <label style={S.label()}>日付</label>
            <input type="date" min={minDate()} max={maxDate()} value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(""); }}
              style={S.input()} />
          </div>

          {selectedDate && (
            <div style={{ marginBottom: 28 }}>
              <label style={S.label()}>開始時刻（50分・30分単位）</label>
              {slotsLoading ? (
                <p style={{ color: C.muted, fontSize: 14 }}>読み込み中...</p>
              ) : slots.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 14 }}>この日は空き枠がありません。別の日をお試しください。</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.map((s) => {
                    const sel = selectedStart === s.startAt;
                    return (
                      <button key={s.startAt} disabled={!s.available}
                        onClick={() => { setSelectedStart(s.startAt); setSelectedEnd(s.displayEndAt); }}
                        style={slotBtnS(sel, s.available)}>
                        {toTime(s.startAt)}〜{toTime(s.displayEndAt)}
                        {!s.available && <span style={{ fontSize: 11, marginLeft: 4 }}>×</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button onClick={() => setView("confirming")} disabled={!selectedStart || !selectedTicket}
            style={S.primaryBtn(!selectedStart || !selectedTicket)}>
            予約内容を確認する →
          </button>
        </>
      )}

      <p style={{ marginTop: 28, fontSize: 13, color: C.muted }}>
        無料体験は <a href="/trial" style={{ color: C.yellow, fontWeight: 700, textDecoration: "underline" }}>こちら</a>
      </p>
    </main>
  );

  // ── View: confirming ──────────────────────────────────────────────────────
  if (view === "confirming") return (
    <main style={S.page()}>
      {header}
      <h1 style={h1S}>ご予約内容の確認</h1>
      <p style={{ color: C.muted, fontSize: 14, marginBottom: 28 }}>内容をご確認のうえ確定してください。</p>

      <div style={{ ...S.card(22), background: C.yellowLight, borderColor: C.yellow, marginBottom: 24 }}>
        <InfoRow label="日時">
          <span style={{ fontWeight: 700 }}>{toDate(selectedStart)}</span>
          <br />{toTime(selectedStart)} 〜 {toTime(selectedEnd)}（50分）
        </InfoRow>
        <InfoRow label="チケット">
          {selectedTicket?.package.name}（残り{selectedTicket?.remainingCount}回
          <span style={{ color: "#8B6F00", fontWeight: 700, marginLeft: 6 }}>
            → {(selectedTicket?.remainingCount ?? 1) - 1}回
          </span>）
        </InfoRow>
      </div>

      {submitError && <div style={S.errorBox()}>{submitError}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setView("selecting"); setSubmitError(""); }} style={S.backBtn()}>← 戻る</button>
        <button onClick={submitBooking} disabled={submitting} style={S.primaryBtn(submitting)}>
          {submitting ? "予約中..." : "予約を確定する"}
        </button>
      </div>
    </main>
  );

  // ── View: complete ────────────────────────────────────────────────────────
  return (
    <main style={S.page()}>
      {header}
      <div style={{ textAlign: "center", padding: "28px 0" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>ご予約が完了しました！</h2>
        <p style={{ color: C.sub, marginBottom: 28 }}>チケットを1回消化しました。</p>

        <div style={{ ...S.card(22), marginBottom: 24, textAlign: "left", background: C.yellowLight, borderColor: C.yellow }}>
          <InfoRow label="日時">
            <span style={{ fontWeight: 700 }}>{result && toDate(result.startAt)}</span>
            <br />{result && toTime(result.startAt)} 〜（50分）
          </InfoRow>
          <InfoRow label="残りチケット">
            <span style={{ fontSize: 22, fontWeight: 800, color: "#8B6F00" }}>
              {result?.remainingAfter}回
            </span>
          </InfoRow>
          <InfoRow label="予約ID">
            <code style={{ fontSize: 11, background: "#FFFFFF", padding: "2px 6px", borderRadius: 4 }}>
              {result?.bookingId}
            </code>
          </InfoRow>
        </div>

        <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
          ※ 確認メールは開発中のためサーバーログに出力されます。
        </p>

        <div style={{
          background: "#F0FBF4", border: "1.5px solid #06C755",
          borderRadius: 16, padding: "20px 24px",
          marginBottom: 24, textAlign: "center",
        }}>
          <p style={{ fontSize: 13, color: "#1a5c2a", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.6 }}>
            LINEで予約確認・お知らせを受け取る
          </p>
          <a href="https://lin.ee/voKCX1e" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#06C755", color: "#FFFFFF",
            fontWeight: 800, fontSize: 16,
            padding: "14px 28px", borderRadius: 12,
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(6,199,85,0.35)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.02 2 11c0 3.54 2.29 6.61 5.6 8.27-.08.59-.3 1.87-.34 2.16-.06.38.14.37.29.27.12-.08 1.88-1.28 2.64-1.8.58.08 1.18.12 1.81.12 5.52 0 10-4.02 10-9S17.52 2 12 2z" fill="white"/>
              <path d="M8 13H6.5V9.5H8V13zm4.75 0h-1.5l-2-3.5V13H7.75V9.5h1.5l2 3.5V9.5h1.5V13zm1.75 0h-1.5V9.5h1.5V13zm3.5 0h-3.5V9.5h1.5v2h2V13z" fill="#06C755"/>
            </svg>
            LINE 友だち追加
          </a>
        </div>

        <button onClick={bookAnother} style={S.primaryBtn(false)}>続けて予約する</button>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 14, alignItems: "flex-start" }}>
      <span style={{ color: C.sub, minWidth: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const h1S: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" };

const slotBtnS = (sel: boolean, available: boolean): React.CSSProperties => ({
  padding: "10px 14px", borderRadius: 10, fontSize: 13,
  cursor: available ? "pointer" : "not-allowed",
  border: `1.5px solid ${sel ? C.yellow : available ? C.border : "#EEEEEE"}`,
  background: sel ? C.yellow : available ? C.card : "#F5F5F5",
  color: sel ? C.text : available ? C.text : "#CCCCCC",
  fontWeight: sel ? 700 : 400,
  minWidth: 110,
});
