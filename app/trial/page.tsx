"use client";
import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SlotOption {
  startAt: string;
  displayEndAt: string;
  available: boolean;
}
interface BookingResult {
  bookingId: string;
  startAt: string;
}

// ─── Options ─────────────────────────────────────────────────────────────────
const STUDY_PERIOD_OPTIONS = [
  { value: "1m",        label: "1ヶ月以内" },
  { value: "3m",        label: "3ヶ月程度" },
  { value: "6m",        label: "半年程度" },
  { value: "1y+",       label: "1年以上" },
  { value: "undecided", label: "まだ未定" },
];
const MOTIVATION_OPTIONS = [
  { value: "kpop",         label: "K-POP" },
  { value: "drama",        label: "韓ドラ・映画" },
  { value: "travel",       label: "旅行" },
  { value: "fanmeet",      label: "ファンミーティング" },
  { value: "study_abroad", label: "留学・仕事" },
  { value: "hobby",        label: "趣味・教養" },
];
const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "まったく初めて" },
  { value: "self",     label: "独学経験あり" },
  { value: "academy",  label: "スクール経験あり" },
  { value: "both",     label: "独学＋スクール両方" },
];
const MODE_OPTIONS = [
  { value: "OFFLINE", label: "対面" },
  { value: "ONLINE",  label: "オンライン" },
  { value: "BOTH",    label: "どちらでも" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });

const toDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "long", day: "numeric", weekday: "short" });

const toTime = (iso: string) =>
  jst(iso, { hour: "2-digit", minute: "2-digit" });

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
export default function TrialPage() {
  const [step, setStep] = useState(1);

  // Step 1 — intake
  const [studyPeriod, setStudyPeriod] = useState("");
  const [motivations, setMotivations] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [preferredMode, setPreferredMode] = useState("");
  const [goalText, setGoalText] = useState("");

  // Step 2 — slot
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd] = useState("");

  // Step 3 — contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [lineHandle, setLineHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Step 4 — result
  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedStart("");
    fetch(`/api/slots?date=${selectedDate}&kind=trial`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const toggleMotivation = (v: string) =>
    setMotivations((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const step1Ok = !!(studyPeriod && motivations.length > 0 && experience && preferredMode);
  const step2Ok = !!selectedStart;
  const step3Ok = !!(name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studyPeriod, motivations, experience,
          textbooks: [], preferredMode,
          goalText: goalText || undefined,
          name: name.trim(),
          email: email.trim(),
          lineUserId: lineHandle.trim() || undefined,
          startAt: selectedStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.message ?? "エラーが発生しました。"); return; }
      setResult({ bookingId: data.bookingId, startAt: data.startAt });
      setStep(4);
    } catch {
      setSubmitError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>無料体験レッスンのご予約</h1>
      <p style={{ color: "#67708a", fontSize: 14, marginBottom: 28 }}>50分 ／ 無料 ／ ログイン不要</p>

      {/* Step indicator */}
      {step < 4 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {["アンケート", "日程選択", "連絡先"].map((label, i) => {
            const done = step > i + 1;
            const active = step === i + 1;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, marginBottom: 6,
                  background: active || done ? "#3b5bdb" : "#e6e9f2",
                  opacity: done ? 0.45 : 1 }} />
                <span style={{ fontSize: 11, color: active ? "#3b5bdb" : "#aab0c7" }}>{label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Intake ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 style={h2}>まずは簡単なアンケートにお答えください</h2>

          <Field label="勉強の目標期間">
            {STUDY_PERIOD_OPTIONS.map((o) => (
              <Radio key={o.value} {...o} checked={studyPeriod === o.value} onChange={setStudyPeriod} />
            ))}
          </Field>

          <Field label="韓国語を始めるきっかけ（複数可）">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MOTIVATION_OPTIONS.map((o) => (
                <Chip key={o.value} {...o} checked={motivations.includes(o.value)} onChange={toggleMotivation} />
              ))}
            </div>
          </Field>

          <Field label="韓国語の経験">
            {EXPERIENCE_OPTIONS.map((o) => (
              <Radio key={o.value} {...o} checked={experience === o.value} onChange={setExperience} />
            ))}
          </Field>

          <Field label="希望するレッスン形式">
            {MODE_OPTIONS.map((o) => (
              <Radio key={o.value} {...o} checked={preferredMode === o.value} onChange={setPreferredMode} />
            ))}
          </Field>

          <Field label="目標・ひとこと（任意）">
            <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)}
              placeholder="例：来年の旅行までに挨拶程度できるようになりたいです"
              rows={3} style={textareaS} />
          </Field>

          <Btn onClick={() => setStep(2)} disabled={!step1Ok}>次へ：日程を選ぶ →</Btn>
        </div>
      )}

      {/* ── Step 2: Slot ─────────────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 style={h2}>ご希望の日時を選んでください</h2>

          <Field label="日付">
            <input type="date" min={minDate()} max={maxDate()} value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(""); }}
              style={inputS} />
          </Field>

          {selectedDate && (
            <Field label="開始時刻（50分・開始は正時のみ）">
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
                          padding: "10px 16px", borderRadius: 8, fontSize: 14,
                          cursor: s.available ? "pointer" : "not-allowed",
                          border: sel ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
                          background: sel ? "#eef2ff" : s.available ? "#fff" : "#f6f7fb",
                          color: sel ? "#3b5bdb" : s.available ? "#222" : "#c0c5d8",
                          fontWeight: sel ? 700 : 400,
                        }}>
                        {toTime(s.startAt)}〜{toTime(s.displayEndAt)}
                        {!s.available && <span style={{ fontSize: 11, marginLeft: 4 }}>×</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            <BackBtn onClick={() => setStep(1)} />
            <Btn onClick={() => setStep(3)} disabled={!step2Ok}>次へ：連絡先を入力 →</Btn>
          </div>
        </div>
      )}

      {/* ── Step 3: Contact ──────────────────────────────────────────────── */}
      {step === 3 && (
        <div>
          <h2 style={h2}>ご連絡先をご入力ください</h2>

          <div style={{ background: "#eef2ff", borderRadius: 10, padding: 14, marginBottom: 24,
            fontSize: 14, lineHeight: 1.7 }}>
            <strong>{toDate(selectedStart)}</strong><br />
            {toTime(selectedStart)}〜{toTime(selectedEnd)}（50分）
          </div>

          <Field label="お名前">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="山田 花子" style={inputS} />
          </Field>

          <Field label="メールアドレス">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com" style={inputS} />
            <p style={{ fontSize: 12, color: "#67708a", marginTop: 4 }}>
              ※ 現在開発中のため、確認メールはサーバーのログに出力されます
            </p>
          </Field>

          <Field label="LINE ID（任意）">
            <input type="text" value={lineHandle} onChange={(e) => setLineHandle(e.target.value)}
              placeholder="@yourlineid" style={inputS} />
          </Field>

          {submitError && (
            <div style={{ color: "#e03131", background: "#fff5f5", border: "1px solid #ffa8a8",
              borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16 }}>
              {submitError}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 32 }}>
            <BackBtn onClick={() => setStep(2)} />
            <Btn onClick={submit} disabled={!step3Ok || submitting}>
              {submitting ? "送信中..." : "予約を確定する"}
            </Btn>
          </div>
        </div>
      )}

      {/* ── Step 4: Complete ─────────────────────────────────────────────── */}
      {step === 4 && result && (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>ご予約ありがとうございます！</h2>
          <p style={{ color: "#67708a", marginBottom: 28 }}>無料体験レッスンのご予約が完了しました。</p>

          <div style={{ background: "#eef2ff", borderRadius: 12, padding: 20, marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <Row label="日時">
                {toDate(result.startAt)}<br />{toTime(result.startAt)}〜（50分）
              </Row>
              <Row label="予約ID">
                <code style={{ fontSize: 12, color: "#3b5bdb" }}>{result.bookingId}</code>
              </Row>
            </div>
          </div>

          <p style={{ color: "#67708a", fontSize: 13, lineHeight: 1.8 }}>
            ※ 確認メールは開発中のためサーバーログに出力されます。<br />
            詳細は後日メールにてご連絡いたします。
          </p>
          <p style={{ marginTop: 24 }}>
            <a href="/" style={{ color: "#3b5bdb", fontSize: 14 }}>← トップに戻る</a>
          </p>
        </div>
      )}
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 10, color: "#333" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Radio({ value, label, checked, onChange }: {
  value: string; label: string; checked: boolean; onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
      cursor: "pointer", fontSize: 14 }}>
      <input type="radio" value={value} checked={checked} onChange={() => onChange(value)}
        style={{ accentColor: "#3b5bdb", width: 16, height: 16 }} />
      {label}
    </label>
  );
}

function Chip({ value, label, checked, onChange }: {
  value: string; label: string; checked: boolean; onChange: (v: string) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(value)} style={{
      padding: "8px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
      border: checked ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
      background: checked ? "#eef2ff" : "#fff",
      color: checked ? "#3b5bdb" : "#555",
      fontWeight: checked ? 700 : 400,
    }}>
      {label}
    </button>
  );
}

function Btn({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: "13px 20px", borderRadius: 10, fontSize: 15, fontWeight: 700,
      background: disabled ? "#aab0c7" : "#3b5bdb", color: "#fff",
      border: "none", cursor: disabled ? "not-allowed" : "pointer",
    }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "13px 16px", borderRadius: 10, fontSize: 14,
      background: "#f6f7fb", color: "#555", border: "1px solid #e6e9f2", cursor: "pointer",
    }}>
      ← 戻る
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
      <span style={{ color: "#67708a", minWidth: 60 }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const h2: React.CSSProperties = { fontSize: 16, marginBottom: 20 };

const inputS: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #d0d5e8", fontSize: 14, boxSizing: "border-box",
};

const textareaS: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8,
  border: "1px solid #d0d5e8", fontSize: 14, boxSizing: "border-box",
  resize: "vertical", fontFamily: "sans-serif",
};
