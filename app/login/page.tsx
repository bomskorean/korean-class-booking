"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { C, S } from "@/lib/design";

interface Student { id: string; name: string; email: string }

export default function LoginPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dev-auth")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) { router.replace("/regular"); return; }
        setStudents(data.students ?? []);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [router]);

  async function selectStudent(id: string) {
    setSelecting(id);
    await fetch("/api/dev-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id }),
    });
    router.push("/regular");
  }

  return (
    <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ ...S.card(32) }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{
            background: "#FFF3BF", color: "#805500",
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
            display: "inline-block", marginBottom: 14,
          }}>
            DEV ONLY — 開発用ログイン
          </span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: "0 0 6px" }}>
            テスト学生を選択
          </h1>
          <p style={{ color: C.muted, fontSize: 13 }}>
            本番環境では LINE ／ メールでのログインに置き換えられます。
          </p>
        </div>

        {loading ? (
          <p style={{ color: C.muted }}>読み込み中...</p>
        ) : students.length === 0 ? (
          <div style={S.errorBox()}>
            学生が見つかりません。<code>npm run seed</code> を実行してください。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {students.map((s) => (
              <button key={s.id} onClick={() => selectStudent(s.id)}
                disabled={selecting !== null}
                style={{
                  padding: "14px 18px", borderRadius: 12, textAlign: "left", cursor: "pointer",
                  border: `1.5px solid ${selecting === s.id ? C.yellow : C.border}`,
                  background: selecting === s.id ? C.yellowLight : C.card,
                  opacity: selecting !== null && selecting !== s.id ? 0.4 : 1,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{s.name}</div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{s.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
