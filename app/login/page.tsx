"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dev-auth")
      .then((r) => r.json())
      .then((data) => {
        // Already logged in → go to /regular
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
    <main style={{ maxWidth: 480, margin: "60px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      {/* Dev badge */}
      <div style={{ display: "inline-block", background: "#fff3bf", color: "#805500",
        fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4, marginBottom: 20 }}>
        DEV ONLY — 開発用ログイン
      </div>

      <h1 style={{ fontSize: 20, marginBottom: 4 }}>テスト学生を選択してください</h1>
      <p style={{ color: "#67708a", fontSize: 13, marginBottom: 28 }}>
        本番環境では LINE / メールでのログインに置き換えられます。
      </p>

      {loading ? (
        <p style={{ color: "#aab0c7" }}>読み込み中...</p>
      ) : students.length === 0 ? (
        <p style={{ color: "#e03131" }}>
          学生が見つかりません。<code>npm run seed</code> を実行してください。
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {students.map((s) => (
            <button key={s.id} onClick={() => selectStudent(s.id)}
              disabled={selecting !== null}
              style={{
                padding: "14px 18px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                border: selecting === s.id ? "2px solid #3b5bdb" : "1px solid #e6e9f2",
                background: selecting === s.id ? "#eef2ff" : "#fff",
                opacity: selecting !== null && selecting !== s.id ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{s.name}</div>
              <div style={{ color: "#67708a", fontSize: 12, marginTop: 2 }}>{s.email}</div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
