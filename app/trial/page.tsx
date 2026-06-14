"use client";
import { useState, useEffect } from "react";
import { C, S } from "@/lib/design";

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

// ─── Types ───────────────────────────────────────────────────────────────────
interface SlotOption  { startAt: string; displayEndAt: string; available: boolean }
interface BookingResult { bookingId: string; startAt: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const jst = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", ...opts });
const toDate = (iso: string) =>
  jst(iso, { year: "numeric", month: "long", day: "numeric", weekday: "short" });
const toTime = (iso: string) => jst(iso, { hour: "2-digit", minute: "2-digit" });
const minDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" }); };
const maxDate = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toLocaleDateString("sv", { timeZone: "Asia/Tokyo" }); };

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TrialPage() {
  const [step, setStep] = useState(1);

  const [studyPeriod, setStudyPeriod]   = useState("");
  const [motivations, setMotivations]   = useState<string[]>([]);
  const [experience, setExperience]     = useState("");
  const [preferredMode, setPreferredMode] = useState("");
  const [goalText, setGoalText]         = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots]               = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState("");
  const [selectedEnd, setSelectedEnd]     = useState("");

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [lineHandle, setLineHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [result, setResult] = useState<BookingResult | null>(null);

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedStart("");
    fetch(`/api/slots?date=${selectedDate}&kind=trial`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
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
          name: name.trim(), email: email.trim(),
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

  // ── Step indicator ────────────────────────────────────────────────────────
  const STEPS = ["アンケート", "日程選択", "連絡先"];
  const stepIndicator = step < 4 && (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 36 }}>
      {STEPS.map((label, i) => {
        const idx = i + 1;
        const done    = step > idx;
        const current = step === idx;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%",
                background: done ? C.yellow : current ? C.yellow : "#EEEEEE",
                border: `2px solid ${done || current ? C.yellow : "#DDDDDD"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 14, color: done || current ? C.text : "#BBBBBB",
                flexShrink: 0,
              }}>
                {done ? "✓" : idx}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: current ? C.text : "#AAAAAA", whiteSpace: "nowrap" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 20,
                background: step > idx ? C.yellow : "#EEEEEE",
                margin: "0 6px 20px",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Step 1 ────────────────────────────────────────────────────────────────
  if (step === 1) return (
    <main style={S.page()}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={h1S}>無料体験レッスンのご予約</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>50分 ／ 無料 ／ ログイン不要</p>
      </div>
      {stepIndicator}

      <Section title="勉強の目標期間">
        {STUDY_PERIOD_OPTIONS.map((o) => (
          <RadioCard key={o.value} {...o} checked={studyPeriod === o.value} onChange={setStudyPeriod} />
        ))}
      </Section>

      <Section title="韓国語を始めるきっかけ（複数可）">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MOTIVATION_OPTIONS.map((o) => (
            <Chip key={o.value} {...o} checked={motivations.includes(o.value)} onChange={toggleMotivation} />
          ))}
        </div>
      </Section>

      <Section title="韓国語の経験">
        {EXPERIENCE_OPTIONS.map((o) => (
          <RadioCard key={o.value} {...o} checked={experience === o.value} onChange={setExperience} />
        ))}
      </Section>

      <Section title="希望するレッスン形式">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODE_OPTIONS.map((o) => (
            <Chip key={o.value} {...o} checked={preferredMode === o.value} onChange={setPreferredMode} />
          ))}
        </div>
      </Section>

      <Section title="目標・ひとこと（任意）">
        <textarea value={goalText} onChange={(e) => setGoalText(e.target.value)}
          placeholder="例：来年の旅行までに挨拶程度できるようになりたいです"
          rows={3} style={{ ...S.input(), resize: "vertical" }} />
      </Section>

      <button onClick={() => setStep(2)} disabled={!step1Ok} style={S.primaryBtn(!step1Ok)}>
        次へ：日程を選ぶ →
      </button>
    </main>
  );

  // ── Step 2 ────────────────────────────────────────────────────────────────
  if (step === 2) return (
    <main style={S.page()}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={h1S}>無料体験レッスンのご予約</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>50分 ／ 無料 ／ ログイン不要</p>
      </div>
      {stepIndicator}

      <Section title="日付">
        <input type="date" min={minDate()} max={maxDate()} value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedStart(""); }}
          style={S.input()} />
      </Section>

      {selectedDate && (
        <Section title="開始時刻（50分・開始は正時のみ）">
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
                    {!s.available && <span style={{ marginLeft: 4, fontSize: 11 }}>×</span>}
                  </button>
                );
              })}
            </div>
          )}
        </Section>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => setStep(1)} style={S.backBtn()}>← 戻る</button>
        <button onClick={() => setStep(3)} disabled={!step2Ok} style={S.primaryBtn(!step2Ok)}>
          次へ：連絡先を入力 →
        </button>
      </div>
    </main>
  );

  // ── Step 3 ────────────────────────────────────────────────────────────────
  if (step === 3) return (
    <main style={S.page()}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={h1S}>無料体験レッスンのご予約</h1>
        <p style={{ color: C.muted, fontSize: 14 }}>50分 ／ 無料 ／ ログイン不要</p>
      </div>
      {stepIndicator}

      <div style={{ ...S.card(), marginBottom: 24, background: C.yellowLight, borderColor: C.yellow }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
          {toDate(selectedStart)}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginTop: 4 }}>
          {toTime(selectedStart)} 〜 {toTime(selectedEnd)}
          <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8, color: C.sub }}>（50分）</span>
        </div>
      </div>

      <Section title="お名前">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="山田 花子" style={S.input()} />
      </Section>

      <Section title="メールアドレス">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com" style={S.input()} />
        <p style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>
          ※ 現在開発中のため、確認メールはサーバーログに出力されます
        </p>
      </Section>

      <Section title="LINE ID（任意）">
        <input type="text" value={lineHandle} onChange={(e) => setLineHandle(e.target.value)}
          placeholder="@yourlineid" style={S.input()} />
      </Section>

      {submitError && <div style={S.errorBox()}>{submitError}</div>}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={() => setStep(2)} style={S.backBtn()}>← 戻る</button>
        <button onClick={submit} disabled={!step3Ok || submitting} style={S.primaryBtn(!step3Ok || submitting)}>
          {submitting ? "送信中..." : "予約を確定する"}
        </button>
      </div>
    </main>
  );

  // ── Step 4 (Complete) ─────────────────────────────────────────────────────
  return (
    <main style={S.page()}>
      <div style={{ textAlign: "center", padding: "32px 0" }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          ご予約ありがとうございます！
        </h2>
        <p style={{ color: C.sub, marginBottom: 32, fontSize: 15 }}>
          無料体験レッスンのご予約が完了しました。
        </p>

        {result && (
          <div style={{ ...S.card(24), marginBottom: 28, textAlign: "left", background: C.yellowLight, borderColor: C.yellow }}>
            <InfoRow label="日時">
              <span style={{ fontWeight: 700 }}>{toDate(result.startAt)}</span>
              <br />
              <span>{toTime(result.startAt)} 〜（50分）</span>
            </InfoRow>
            <InfoRow label="予約ID">
              <code style={{ fontSize: 12, background: "#FFFFFF", padding: "2px 6px", borderRadius: 4 }}>
                {result.bookingId}
              </code>
            </InfoRow>
          </div>
        )}

        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.8, marginBottom: 28 }}>
          ※ 確認メールは開発中のためサーバーログに出力されます。<br />
          詳細は後日メールにてご連絡いたします。
        </p>

        <a href="/" style={{
          display: "inline-block", padding: "13px 28px",
          borderRadius: 12, background: C.yellow, color: C.text,
          fontWeight: 700, fontSize: 15,
        }}>
          ← ホームに戻る
        </a>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <label style={S.label()}>{title}</label>
      {children}
    </div>
  );
}

function RadioCard({ value, label, checked, onChange }: {
  value: string; label: string; checked: boolean; onChange: (v: string) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(value)} style={{
      display: "flex", alignItems: "center", gap: 12,
      width: "100%", padding: "11px 14px", borderRadius: 10, marginBottom: 6,
      border: `1.5px solid ${checked ? C.yellow : C.border}`,
      background: checked ? C.yellowLight : C.card,
      cursor: "pointer", textAlign: "left",
      transition: "border-color 0.15s, background 0.15s",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${checked ? C.yellow : "#CCCCCC"}`,
        background: checked ? C.yellow : C.card,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {checked && <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.text }} />}
      </div>
      <span style={{ fontSize: 14, color: C.text, fontWeight: checked ? 700 : 400 }}>{label}</span>
    </button>
  );
}

function Chip({ value, label, checked, onChange }: {
  value: string; label: string; checked: boolean; onChange: (v: string) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(value)} style={{
      padding: "8px 16px", borderRadius: 20,
      border: `1.5px solid ${checked ? C.yellow : C.border}`,
      background: checked ? C.yellow : C.card,
      color: C.text, fontSize: 13,
      cursor: "pointer", fontWeight: checked ? 700 : 400,
    }}>
      {label}
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 10, fontSize: 14, alignItems: "flex-start" }}>
      <span style={{ color: C.sub, minWidth: 56, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const h1S: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: C.text, margin: "0 0 4px" };

const slotBtnS = (sel: boolean, available: boolean): React.CSSProperties => ({
  padding: "10px 16px", borderRadius: 10, fontSize: 13,
  cursor: available ? "pointer" : "not-allowed",
  border: `1.5px solid ${sel ? C.yellow : available ? C.border : "#EEEEEE"}`,
  background: sel ? C.yellow : available ? C.card : "#F5F5F5",
  color: sel ? C.text : available ? C.text : "#BBBBBB",
  fontWeight: sel ? 700 : 400,
  minWidth: 110,
});
