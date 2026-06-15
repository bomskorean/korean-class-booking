"use client";
import { useState, useEffect, useCallback } from "react";
import { C, S } from "@/lib/design";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BookingUser { id: string; name: string; email: string }
interface BookingSlot { startAt: string; displayEndAt: string; status: string }
interface Booking {
  id: string; type: string; status: string; createdAt: string;
  user: BookingUser; slot: BookingSlot | null;
}
interface OpenSlot { id: string; startAt: string; displayEndAt: string; mode: string }
interface Student { id: string; name: string; email: string }
interface Package { id: string; name: string; totalCount: number; price: number; validMonths: number }
type Tab = "bookings" | "slots" | "tickets";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });
const fmtDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
const fmtTime = (iso: string) => jst(iso, { hour: "2-digit", minute: "2-digit" });

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "確定", CANCELLED: "キャンセル",
  CHANGED: "変更", COMPLETED: "完了", NO_SHOW: "無断欠席",
};
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  CONFIRMED: { bg: C.greenBg,  color: C.green },
  CANCELLED: { bg: C.redBg,    color: C.red   },
  COMPLETED: { bg: C.yellowLight, color: "#8B6F00" },
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("bookings");

  const TAB_LABELS: Record<Tab, string> = {
    bookings: "予約一覧",
    slots:    "時間帯管理",
    tickets:  "チケット付与",
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: C.yellow, color: C.text,
            fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 4,
          }}>
            管理者
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0 }}>管理画面</h1>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>馬賑韓国語教室 — 先生用ダッシュボード</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `2px solid ${C.border}`, marginBottom: 28 }}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "10px 20px", fontSize: 14,
            fontWeight: tab === t ? 700 : 500,
            background: "none", border: "none", cursor: "pointer",
            borderBottom: `3px solid ${tab === t ? C.yellow : "transparent"}`,
            color: tab === t ? C.text : C.sub,
            marginBottom: -2,
          }}>
            {TAB_LABELS[t]}
          </button>
        ))}
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

  if (loading) return <p style={{ color: C.muted }}>読み込み中...</p>;
  if (error)   return <p style={{ color: C.red }}>{error}</p>;
  if (bookings.length === 0) return (
    <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
      <p>予約がまだありません。</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#FFFAE0" }}>
            {["日時", "種類", "名前", "メール", "ステータス"].map((h) => (
              <th key={h} style={{
                padding: "12px 14px", textAlign: "left",
                fontWeight: 700, fontSize: 12, color: C.sub,
                borderBottom: `2px solid ${C.border}`,
                whiteSpace: "nowrap",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={b.id} style={{
              borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? C.card : "#FFFDF8",
            }}>
              <td style={tdS}>
                {b.slot ? (
                  <>
                    <div style={{ fontWeight: 600 }}>{fmtDate(b.slot.startAt)}</div>
                    <div style={{ color: C.muted, fontSize: 12 }}>
                      {fmtTime(b.slot.startAt)} 〜 {fmtTime(b.slot.displayEndAt)}
                    </div>
                  </>
                ) : "—"}
              </td>
              <td style={tdS}>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 4,
                  background: b.type === "TRIAL" ? "#FFF3BF" : C.yellowLight,
                  color: b.type === "TRIAL" ? "#805500" : "#8B6F00",
                }}>
                  {b.type === "TRIAL" ? "体験" : "正規"}
                </span>
              </td>
              <td style={{ ...tdS, fontWeight: 600 }}>{b.user?.name ?? "—"}</td>
              <td style={{ ...tdS, fontSize: 12, color: C.sub }}>{b.user?.email ?? "—"}</td>
              <td style={tdS}>
                <span style={{
                  fontSize: 12, padding: "3px 9px", borderRadius: 4,
                  ...(STATUS_COLOR[b.status] ?? { bg: "#F5F5F5", color: C.sub }),
                  background: (STATUS_COLOR[b.status] ?? { bg: "#F5F5F5" }).bg,
                  color: (STATUS_COLOR[b.status] ?? { color: C.sub }).color,
                }}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 12 }}>全 {bookings.length} 件</p>
    </div>
  );
}

// ─── Tab 2: 時間帯管理 ────────────────────────────────────────────────────────
const MODE_LABELS: Record<string, string> = { ONLINE: "オンライン", OFFLINE: "対面", BOTH: "どちらでも" };

function SlotsTab() {
  const [slots, setSlots]     = useState<OpenSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]           = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [mode, setMode]           = useState("BOTH");
  const [adding, setAdding]       = useState(false);
  const [addMsg, setAddMsg]       = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/slots")
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addSlot() {
    if (!date) return;
    setAdding(true);
    setAddMsg(null);
    const res = await fetch("/api/admin/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, startTime, mode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAddMsg({ ok: false, text: data.error ?? "エラーが発生しました" });
    } else {
      setAddMsg({ ok: true, text: `${fmtDate(data.slot.startAt)} ${fmtTime(data.slot.startAt)} の予約枠を追加しました` });
      setDate("");
      load();
    }
    setAdding(false);
  }

  async function remove(id: string) {
    if (!confirm("この予約枠を削除しますか？")) return;
    await fetch(`/api/admin/slots/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: C.sub, marginBottom: 24, lineHeight: 1.7 }}>
        生徒が予約できる<strong>予約可能枠</strong>を追加します。
        追加した枠が学生の予約画面に表示されます（表示は50分）。
      </p>

      {/* Add form */}
      <div style={{ ...S.card(20), marginBottom: 32 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 18px" }}>
          予約枠を追加
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={S.label()}>日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              style={{ ...S.input(), width: 180 }} />
          </div>
          <div>
            <label style={S.label()}>開始時刻（JST）</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              style={{ ...S.input(), width: 130 }} />
          </div>
          <div>
            <label style={S.label()}>形式</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...S.input(), width: 150 }}>
              <option value="BOTH">どちらでも</option>
              <option value="ONLINE">オンライン</option>
              <option value="OFFLINE">対面</option>
            </select>
          </div>
          <button onClick={addSlot} disabled={adding || !date} style={{
            padding: "11px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: !date || adding ? "#D4D4D4" : C.yellow, color: C.text,
            border: "none", cursor: !date || adding ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}>
            {adding ? "追加中..." : "予約枠を追加"}
          </button>
        </div>
        {addMsg && (
          <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: addMsg.ok ? C.green : C.red }}>
            {addMsg.text}
          </p>
        )}
      </div>

      {/* List */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: "0 0 14px" }}>
        予約可能枠一覧
      </h3>
      {loading ? (
        <p style={{ color: C.muted }}>読み込み中...</p>
      ) : slots.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.muted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <p style={{ fontSize: 14 }}>予約可能枠がありません。上のフォームから追加してください。</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {slots.map((s) => (
            <div key={s.id} style={{
              ...S.card(14),
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{fmtDate(s.startAt)}</span>
                <span style={{ color: C.sub, fontSize: 13, marginLeft: 14 }}>
                  {fmtTime(s.startAt)} 〜 {fmtTime(s.displayEndAt)}
                </span>
                <span style={{
                  marginLeft: 10, fontSize: 11, fontWeight: 600, padding: "2px 7px",
                  borderRadius: 4, background: C.yellowLight, color: "#8B6F00",
                }}>
                  {MODE_LABELS[s.mode] ?? s.mode}
                </span>
              </div>
              <button onClick={() => remove(s.id)} style={{
                padding: "6px 14px", fontSize: 12, fontWeight: 600, borderRadius: 8,
                background: C.redBg, color: C.red,
                border: `1px solid ${C.redBorder}`, cursor: "pointer",
                flexShrink: 0,
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
      if ((p.packages ?? []).length > 0) { setPackageId(p.packages[0].id); setCount(p.packages[0].totalCount); }
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
    setMsg(res.ok
      ? { ok: true,  text: `✓ ${data.userName} さんに「${data.packageName}」を ${count} 回付与しました` }
      : { ok: false, text: data.error ?? "エラーが発生しました" },
    );
    setSubmitting(false);
  }

  const selectedPkg = packages.find((p) => p.id === packageId);

  if (loading) return <p style={{ color: C.muted }}>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 520 }}>
      <p style={{ fontSize: 14, color: C.sub, marginBottom: 28, lineHeight: 1.7 }}>
        現金払いや特別対応で、生徒に<strong>チケットを手動で付与</strong>します。
      </p>

      <div style={S.card(24)}>
        <div style={{ marginBottom: 20 }}>
          <label style={S.label()}>生徒</label>
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={S.select()}>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}（{s.email}）</option>
            ))}
          </select>
          {students.length === 0 && <p style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>生徒が登録されていません。</p>}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={S.label()}>チケット種類</label>
          <select value={packageId} onChange={(e) => onPackageChange(e.target.value)} style={S.select()}>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（¥{p.price.toLocaleString()} ／ 有効{p.validMonths}か月）
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={S.label()}>付与回数</label>
          <input type="number" min={1} max={99} value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
            style={{ ...S.input(), width: 110 }} />
          {selectedPkg && (
            <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
              パッケージ標準 {selectedPkg.totalCount} 回 ／ ¥{selectedPkg.price.toLocaleString()}
              （1回 ¥{(selectedPkg.price / selectedPkg.totalCount).toLocaleString()}）
            </p>
          )}
        </div>

        {msg && (
          <div style={{ ...(msg.ok ? S.successBox() : S.errorBox()) }}>
            {msg.text}
          </div>
        )}

        <button onClick={submit} disabled={submitting || !userId || !packageId}
          style={S.primaryBtn(submitting || !userId || !packageId)}>
          {submitting ? "付与中..." : "チケットを付与する"}
        </button>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tdS: React.CSSProperties = { padding: "13px 14px", verticalAlign: "middle" };
