"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────
interface User    { id: string; name: string; email: string }
interface Package { name: string; validMonths: number; unitPrice: number }
interface Ticket  { id: string; remainingCount: number; validFrom: string | null; expiresAt: string | null; package: Package }
interface Slot    { startAt: string; displayEndAt: string; available: boolean }
interface Result  { bookingId: string; startAt: string; remainingAfter: number }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });

const toDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "long", day: "numeric", weekday: "short" });

const toTime = (iso: string) =>
  jst(iso, { hour: "2-digit", minute: "2-digit" });

const toShortDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "2-digit", day: "2-digit" });

const minDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" });
};
const maxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" });
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function RegularPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading]   = useState(true);
  const [user, setUser]                 = useState<User | null>(null);
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // view: "selecting" | "confirming" | "complete"
  const [view, setView] = useState<"selecting" | "confirming" | "complete">("selecting");

  // Slot selection
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd]     = useState("");

  // Booking
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult]           = useState<Result | null>(null);

  // ── Auth check ──────────────────────────────────────────────────────────────
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

  // ── Fetch tickets after user is set ────────────────────────────────────────
  const fetchTickets = useCallback(async () => {
    const res = await fetch("/api/tickets");
    if (!res.ok) return;
    const data = await res.json();
    const list: Ticket[] = data.tickets ?? [];
    setTickets(list);
    if (list.length > 0) setSelectedTicket(list[0]);
  }, []);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user, fetchTickets]);

  // ── Fetch slots when date changes ───────────────────────────────────────────
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedStart("");
    fetch(`/api/slots?date=${selectedDate}&kind=regular`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  async function logout() {
    await fetch("/api/dev-auth", { method: "DELETE" });
    router.push("/login");
  }

  // ── Submit booking ──────────────────────────────────────────────────────────
  async function submitBooking() {
    if (!selectedTicket) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/regular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startAt: selectedStart, ticketId: selectedTicket.id }),
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

  // ── Another booking ─────────────────────────────────────────────────────────
  function bookAnother() {
    setView("selecting");
    setSelectedDate("");
    setSlots([]);
    setSelectedStart("");
    setSelectedEnd("");
    setResult(null);
    fetchTickets(); // re-fetch to get updated remaining count
  }

  // ── Loading / unauthed ──────────────────────────────────────────────────────
  if (authLoading) {
    return <main style={mainS}><p style={{ color: "#aab0c7", marginTop: 80 }}>認証確認中...</p></main>;
  }
  if (!user) return null;

  // ── Header ──────────────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e6e9f2" }}>
      <div>
        <div style={{ fontSize: 12, color: "#67708a", marginBottom: 2 }}>
          <span style={{ background: "#fff3bf", color: "#805500", fontSize: 10,
            fontWeight: 700, padding: "1px 6px", borderRadius: 3, marginRight: 6 }}>DEV</span>
          ログイン中
        </div>
        <div style={{ fontWeight: 700 }}>{user.name}</div>
      </div>
      <button onClick={logout}
        style={{ fontSize: 12, color: "#67708a", background: "none", border: "1px solid #e6e9f2",
          borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
        ログアウト
      </button>
    </div>
  );

  // ── Ticket section ──────────────────────────────────────────────────────────
  const ticketSection = (
    <div style={{ marginBottom: 28 }}>
      <label style={labelS}>保有チケット</label>
      {tickets.length === 0 ? (
        <div style={{ background: "#fff5f5", border: "1px solid #ffa8a8", borderRadius: 10, padding: 14,
          fontSize: 14 }}>
          <p style={{ color: "#c92a2a", margin: "0 0 10px" }}>有効なチケットがありません。</p>
          <a href="/purchase" style={{
            display: "inline-block", padding: "9px 16px", borderRadius: 8,
            background: "#2b8a3e", color: "#fff", fontWeight: 700, fontSize: 13,
            textDecoration: "none",
          }}>
            チケットを購入する →
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {tickets.map((t) => {
            const sel = selectedTicket?.id === t.id;
            return (
              <button key={t.id} onClick={() => setSelectedTicket(t)}
                style={{
                  padding: "12px 16px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  border: sel ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
                  background: sel ? "#eef2ff" : "#fff",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{t.package.name}</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: sel ? "#3b5bdb" : "#222" }}>
                    {t.remainingCount}<span style={{ fontSize: 13, fontWeight: 400, marginLeft: 2 }}>回残り</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#67708a", marginTop: 4 }}>
                  有効期限：{t.expiresAt ? `${toShortDate(t.expiresAt)}まで` : "初回レッスン日より起算"}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── View: selecting ─────────────────────────────────────────────────────────
  if (view === "selecting") return (
    <main style={mainS}>
      {header}
      <h1 style={{ fontSize: 20, marginBottom: 20 }}>レッスンのご予約（50分）</h1>

      {ticketSection}

      {tickets.length > 0 && (
        <>
          <div style={{ marginBottom: 24 }}>
            <label style={labelS}>日付</label>
            <input type="date" min={minDate()} max={maxDate()} value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(""); }}
              style={inputS} />
          </div>

          {selectedDate && (
            <div style={{ marginBottom: 28 }}>
              <label style={labelS}>開始時刻（50分・30分単位）</label>
              {slotsLoading ? (
                <p style={{ color: "#aab0c7", fontSize: 14 }}>読み込み中...</p>
              ) : slots.length === 0 ? (
                <p style={{ color: "#aab0c7", fontSize: 14 }}>この日は空き枠がありません。別の日をお試しください。</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.map((s) => {
                    const sel = selectedStart === s.startAt;
                    return (
                      <button key={s.startAt} disabled={!s.available}
                        onClick={() => { setSelectedStart(s.startAt); setSelectedEnd(s.displayEndAt); }}
                        style={{
                          padding: "10px 14px", borderRadius: 8, fontSize: 13,
                          cursor: s.available ? "pointer" : "not-allowed",
                          border: sel ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
                          background: sel ? "#eef2ff" : s.available ? "#fff" : "#f6f7fb",
                          color: sel ? "#3b5bdb" : s.available ? "#222" : "#c0c5d8",
                          fontWeight: sel ? 700 : 400,
                          minWidth: 110,
                        }}>
                        {toTime(s.startAt)}〜{toTime(s.displayEndAt)}
                        {!s.available && <span style={{ fontSize: 11, marginLeft: 4 }}>×</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button onClick={() => setView("confirming")}
            disabled={!selectedStart || !selectedTicket}
            style={btnStyle(!selectedStart || !selectedTicket)}>
            予約内容を確認する →
          </button>
        </>
      )}

      <p style={{ marginTop: 28, fontSize: 13, color: "#aab0c7" }}>
        ※ 無料体験は <a href="/trial" style={{ color: "#3b5bdb" }}>こちら</a>
      </p>
    </main>
  );

  // ── View: confirming ────────────────────────────────────────────────────────
  if (view === "confirming") return (
    <main style={mainS}>
      {header}
      <h1 style={{ fontSize: 20, marginBottom: 24 }}>ご予約内容の確認</h1>

      <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <Row label="日時">
          {toDate(selectedStart)}<br />
          {toTime(selectedStart)}〜{toTime(selectedEnd)}（50分）
        </Row>
        <Row label="チケット">
          {selectedTicket?.package.name}（残り{selectedTicket?.remainingCount}回
          <span style={{ color: "#3b5bdb", marginLeft: 6 }}>→ 予約後{(selectedTicket?.remainingCount ?? 1) - 1}回</span>）
        </Row>
      </div>

      {submitError && (
        <div style={{ color: "#e03131", background: "#fff5f5", border: "1px solid #ffa8a8",
          borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 }}>
          {submitError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { setView("selecting"); setSubmitError(""); }} style={backBtnS}>
          ← 戻る
        </button>
        <button onClick={submitBooking} disabled={submitting} style={btnStyle(submitting)}>
          {submitting ? "予約中..." : "予約を確定する"}
        </button>
      </div>
    </main>
  );

  // ── View: complete ──────────────────────────────────────────────────────────
  return (
    <main style={mainS}>
      {header}
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>ご予約が完了しました！</h2>
        <p style={{ color: "#67708a", marginBottom: 28 }}>チケットを1回消化しました。</p>

        <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20,
          marginBottom: 24, textAlign: "left" }}>
          <Row label="日時">
            {result && toDate(result.startAt)}<br />
            {result && toTime(result.startAt)}〜（50分）
          </Row>
          <Row label="チケット残り">
            <span style={{ fontSize: 20, fontWeight: 800, color: "#3b5bdb" }}>
              {result?.remainingAfter}回
            </span>
          </Row>
          <Row label="予約ID">
            <code style={{ fontSize: 11, color: "#3b5bdb" }}>{result?.bookingId}</code>
          </Row>
        </div>

        <p style={{ color: "#67708a", fontSize: 13, marginBottom: 24 }}>
          ※ 確認メールは開発中のためサーバーログに出力されます。
        </p>

        <button onClick={bookAnother} style={btnStyle(false)}>
          続けて予約する
        </button>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 14 }}>
      <span style={{ color: "#67708a", minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mainS: React.CSSProperties = {
  maxWidth: 640, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif",
};

const labelS: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "#333",
};

const inputS: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #d0d5e8", fontSize: 14, boxSizing: "border-box",
};

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  flex: 1, width: "100%", padding: "13px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700,
  background: disabled ? "#aab0c7" : "#3b5bdb", color: "#fff",
  border: "none", cursor: disabled ? "not-allowed" : "pointer",
});

const backBtnS: React.CSSProperties = {
  padding: "13px 16px", borderRadius: 10, fontSize: 14,
  background: "#f6f7fb", color: "#555", border: "1px solid #e6e9f2", cursor: "pointer",
};
