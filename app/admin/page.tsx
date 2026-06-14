"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingUser { id: string; name: string; email: string }
interface BookingSlot { startAt: string; displayEndAt: string; status: string }
interface Booking {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  user: BookingUser;
  slot: BookingSlot | null;
}

interface ClosedSlot {
  id: string;
  startAt: string;
  blockEndAt: string;
}

interface Student { id: string; name: string; email: string }
interface Package { id: string; name: string; totalCount: number; price: number; validMonths: number }

type Tab = "bookings" | "slots" | "tickets";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });

const fmtDateTime = (iso: string) =>
  jst(iso, { year: "numeric", month: "2-digit", day: "2-digit",
              hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });

const fmtTime = (iso: string) =>
  jst(iso, { hour: "2-digit", minute: "2-digit" });

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "確定",
  CANCELLED: "キャンセル",
  CHANGED:   "変更",
  COMPLETED: "完了",
  NO_SHOW:   "無断欠席",
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("bookings");

  return (
    <main style={mainS}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>管理画面</h1>
        <p style={{ fontSize: 13, color: "#67708a" }}>馬賑韓国語教室 — 先生用ダッシュボード</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "2px solid #e6e9f2" }}>
        {(["bookings", "slots", "tickets"] as Tab[]).map((t) => {
          const labels: Record<Tab, string> = {
            bookings: "予約一覧",
            slots:    "時間帯管理",
            tickets:  "チケット付与",
          };
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "10px 18px", fontSize: 14, fontWeight: tab === t ? 700 : 400,
              background: "none", border: "none", cursor: "pointer",
              borderBottom: tab === t ? "2px solid #3b5bdb" : "2px solid transparent",
              color: tab === t ? "#3b5bdb" : "#67708a",
              marginBottom: -2,
            }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {tab === "bookings" && <BookingsTab />}
      {tab === "slots"    && <SlotsTab />}
      {tab === "tickets"  && <TicketsTab />}
    </main>
  );
}

// ─── Tab 1: 予約一覧 ──────────────────────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? []))
      .catch(() => setError("読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={loadingS}>読み込み中...</p>;
  if (error)   return <p style={errorS}>{error}</p>;
  if (bookings.length === 0) return <p style={emptyS}>予約がまだありません。</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={tableS}>
        <thead>
          <tr>
            {["日時", "種類", "名前", "メール", "ステータス"].map((h) => (
              <th key={h} style={thS}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} style={{ borderBottom: "1px solid #e6e9f2" }}>
              <td style={tdS}>
                {b.slot ? (
                  <>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(b.slot.startAt)}</div>
                    <div style={{ color: "#67708a", fontSize: 12 }}>
                      {fmtTime(b.slot.startAt)}〜{fmtTime(b.slot.displayEndAt)}
                    </div>
                  </>
                ) : "—"}
              </td>
              <td style={tdS}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: b.type === "TRIAL" ? "#fff3bf" : "#e7f5ff",
                  color: b.type === "TRIAL" ? "#805500" : "#1864ab",
                }}>
                  {b.type === "TRIAL" ? "体験" : "正規"}
                </span>
              </td>
              <td style={tdS}>{b.user?.name ?? "—"}</td>
              <td style={{ ...tdS, fontSize: 12, color: "#67708a" }}>{b.user?.email ?? "—"}</td>
              <td style={tdS}>
                <span style={{
                  fontSize: 12, padding: "2px 8px", borderRadius: 4,
                  background: b.status === "CONFIRMED" ? "#d3f9d8"
                            : b.status === "CANCELLED" ? "#ffe3e3" : "#f1f3f5",
                  color:      b.status === "CONFIRMED" ? "#2b8a3e"
                            : b.status === "CANCELLED" ? "#c92a2a" : "#555",
                }}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: "#aab0c7", marginTop: 12 }}>全 {bookings.length} 件</p>
    </div>
  );
}

// ─── Tab 2: 時間帯管理 ────────────────────────────────────────────────────────
function SlotsTab() {
  const [slots, setSlots]     = useState<ClosedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Form state
  const [date, setDate]           = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime]     = useState("11:00");
  const [adding, setAdding]       = useState(false);
  const [addMsg, setAddMsg]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setError("読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addBlock() {
    if (!date || !startTime || !endTime) return;
    setAdding(true);
    setAddMsg("");
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, endTime }),
    });
    const data = await res.json();
    if (!res.ok) { setAddMsg(data.error ?? "エラーが発生しました"); }
    else { setAddMsg("ブロックを追加しました"); setDate(""); load(); }
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm("このブロックを削除しますか？")) return;
    await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: "#555", marginBottom: 20 }}>
        特定の日時をブロックすると、生徒側でその時間帯が予約不可になります。
      </p>

      {/* Add form */}
      <div style={{ background: "#f8f9ff", border: "1px solid #e6e9f2", borderRadius: 12,
        padding: 20, marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>時間帯をブロック</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={labelS}>日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputS} />
          </div>
          <div>
            <label style={labelS}>開始 (JST)</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ ...inputS, width: 120 }} />
          </div>
          <div>
            <label style={labelS}>終了 (JST)</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ ...inputS, width: 120 }} />
          </div>
          <button onClick={addBlock} disabled={adding || !date} style={{
            padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: !date || adding ? "#aab0c7" : "#e03131", color: "#fff",
            border: "none", cursor: !date || adding ? "not-allowed" : "pointer",
          }}>
            {adding ? "追加中..." : "ブロック追加"}
          </button>
        </div>
        {addMsg && <p style={{ marginTop: 10, fontSize: 13, color: "#2b8a3e" }}>{addMsg}</p>}
      </div>

      {/* Existing blocks */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>現在のブロック一覧</h3>
      {loading ? (
        <p style={loadingS}>読み込み中...</p>
      ) : error ? (
        <p style={errorS}>{error}</p>
      ) : slots.length === 0 ? (
        <p style={emptyS}>ブロックされた時間帯はありません。</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slots.map((s) => (
            <div key={s.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", border: "1px solid #e6e9f2", borderRadius: 10, background: "#fff",
            }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(s.startAt)}</span>
                <span style={{ color: "#555", fontSize: 13, marginLeft: 12 }}>
                  {fmtTime(s.startAt)} 〜 {fmtTime(s.blockEndAt)}
                </span>
              </div>
              <button onClick={() => remove(s.id)} style={{
                padding: "5px 12px", fontSize: 12, borderRadius: 6,
                background: "#fff5f5", color: "#c92a2a",
                border: "1px solid #ffa8a8", cursor: "pointer",
              }}>
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3: チケット付与 ──────────────────────────────────────────────────────
function TicketsTab() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [packages, setPackages]   = useState<Package[]>([]);
  const [loading, setLoading]     = useState(true);

  const [userId, setUserId]       = useState("");
  const [packageId, setPackageId] = useState("");
  const [count, setCount]         = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/packages").then((r) => r.json()),
    ]).then(([u, p]) => {
      setStudents(u.users ?? []);
      setPackages(p.packages ?? []);
      if ((u.users ?? []).length > 0) setUserId(u.users[0].id);
      if ((p.packages ?? []).length > 0) {
        setPackageId(p.packages[0].id);
        setCount(p.packages[0].totalCount);
      }
    }).finally(() => setLoading(false));
  }, []);

  function onPackageChange(pid: string) {
    setPackageId(pid);
    const pkg = packages.find((p) => p.id === pid);
    if (pkg) setCount(pkg.totalCount);
  }

  async function submit() {
    setSubmitting(true);
    setMsg(null);
    const res = await fetch("/api/admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, packageId, count }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ ok: true, text: `✓ ${data.userName} さんに「${data.packageName}」を ${count} 回付与しました` });
    } else {
      setMsg({ ok: false, text: data.error ?? "エラーが発生しました" });
    }
    setSubmitting(false);
  }

  const selectedPkg = packages.find((p) => p.id === packageId);

  if (loading) return <p style={loadingS}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: 14, color: "#555", marginBottom: 24 }}>
        生徒にチケットを手動で付与します（現金払いや特別対応用）。
      </p>

      <div style={{ marginBottom: 20 }}>
        <label style={labelS}>生徒</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)} style={selectS}>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}（{s.email}）</option>
          ))}
        </select>
        {students.length === 0 && <p style={{ color: "#aab0c7", fontSize: 13 }}>生徒が登録されていません。</p>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={labelS}>チケット種類</label>
        <select value={packageId} onChange={(e) => onPackageChange(e.target.value)} style={selectS}>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（¥{p.price.toLocaleString()} / 有効{p.validMonths}か月）
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={labelS}>付与回数</label>
        <input type="number" min={1} max={99} value={count}
          onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
          style={{ ...inputS, width: 100 }} />
        {selectedPkg && (
          <p style={{ fontSize: 12, color: "#67708a", marginTop: 6 }}>
            パッケージ標準: {selectedPkg.totalCount} 回 / ¥{selectedPkg.price.toLocaleString()}
            （1回 ¥{selectedPkg.price / selectedPkg.totalCount}）
          </p>
        )}
      </div>

      {msg && (
        <div style={{
          marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 14,
          background: msg.ok ? "#d3f9d8" : "#fff5f5",
          border: `1px solid ${msg.ok ? "#b2f2bb" : "#ffa8a8"}`,
          color: msg.ok ? "#2b8a3e" : "#c92a2a",
        }}>
          {msg.text}
        </div>
      )}

      <button onClick={submit} disabled={submitting || !userId || !packageId} style={{
        width: "100%", padding: "13px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700,
        background: submitting || !userId || !packageId ? "#aab0c7" : "#3b5bdb",
        color: "#fff", border: "none",
        cursor: submitting || !userId || !packageId ? "not-allowed" : "pointer",
      }}>
        {submitting ? "付与中..." : "チケットを付与する"}
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const mainS: React.CSSProperties = {
  maxWidth: 900, margin: "0 auto", padding: "28px 16px", fontFamily: "sans-serif",
};

const labelS: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 13, marginBottom: 6, color: "#333",
};

const inputS: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 8, border: "1px solid #d0d5e8",
  fontSize: 14, boxSizing: "border-box",
};

const selectS: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #d0d5e8",
  fontSize: 14, boxSizing: "border-box", background: "#fff",
};

const tableS: React.CSSProperties = {
  width: "100%", borderCollapse: "collapse", fontSize: 14,
};

const thS: React.CSSProperties = {
  textAlign: "left", padding: "10px 14px", fontWeight: 700, fontSize: 12,
  color: "#67708a", background: "#f8f9ff", borderBottom: "2px solid #e6e9f2",
};

const tdS: React.CSSProperties = {
  padding: "12px 14px", verticalAlign: "middle",
};

const loadingS: React.CSSProperties = { color: "#aab0c7", fontSize: 14 };
const errorS:   React.CSSProperties = { color: "#c92a2a", fontSize: 14 };
const emptyS:   React.CSSProperties = { color: "#aab0c7", fontSize: 14 };
