"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate, isPast } from "@/lib/formatters";

function StatCard({ label, value, sub, bg, iconPath }) {
  return (
    <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d={iconPath} /></svg>
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#111827", lineHeight: 1.2 }}>{value}</p>
        {sub && <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{sub}</p>}
      </div>
    </div>
  );
}

function DonutChart({ pct, color }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="16" />
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="16"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
      <text x="70" y="70" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 22, fontWeight: 900, fill: "#111827" }}>{pct}%</text>
    </svg>
  );
}

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "parent") { router.push("/"); return; }
    setUser(parsed);

    const s = parsed.student;
    if (!s) return;

    Promise.all([
      fetch(`/api/assignments?grade=${s.grade}`).then(r => r.json()),
      fetch(`/api/submissions?studentGmail=${encodeURIComponent(s.gmail)}`).then(r => r.json()),
    ]).then(([aData, sData]) => {
      setAssignments(aData.assignments || []);
      setSubmissions(sData.submissions || []);
    });
  }, [router]);

  function logout() { sessionStorage.removeItem("user"); router.push("/"); }

  if (!user) return null;

  const student = user.student || {};
  const studentName = student.lastName && student.firstName
    ? `${student.lastName} ${student.firstName}`
    : student.gmail?.split("@")[0] || "Сурагч";
  const initials = student.lastName && student.firstName
    ? (student.lastName[0] + student.firstName[0]).toUpperCase()
    : (student.gmail || "S")[0].toUpperCase();

  const total = assignments.length;
  const submitted = submissions.length;
  const pending = assignments.filter(a => !isPast(a.deadline) && !submissions.find(s => s.assignmentId === a.id)).length;
  const gradedSubs = submissions.filter(s => s.score !== null);
  const avgScore = gradedSubs.length
    ? Math.round(gradedSubs.reduce((acc, s) => acc + s.score, 0) / gradedSubs.length)
    : null;
  const completionPct = total > 0 ? Math.round((submitted / total) * 100) : 0;

  // Bar chart: last 6 graded submissions
  const barData = [...gradedSubs]
    .sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt))
    .slice(0, 6)
    .map(sub => ({
      title: assignments.find(a => a.id === sub.assignmentId)?.title || "Даалгавар",
      score: sub.score,
      color: sub.score >= 80 ? "#06b6d4" : sub.score >= 50 ? "#f97316" : "#ef4444",
    }));

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#111827" }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #f1f5f9", padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4dd0e1,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>Анги платформ</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{user.gmail}</span>
          <button onClick={logout} style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 8 }}>
            Гарах
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>

        {/* Student card */}
        <div style={{ borderRadius: 20, padding: "28px 32px", marginBottom: 28, background: "linear-gradient(135deg,#f97316,#fb923c)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 20 }}>
              {initials}
            </div>
            <div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: 12 }}>Сурагч</p>
              <p style={{ margin: 0, color: "white", fontWeight: 900, fontSize: 22 }}>{studentName}</p>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                {student.grade}-р анги · Багш: {user.teacherName}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Хувийн код</p>
            <p style={{ margin: 0, color: "white", fontWeight: 900, fontSize: 18, letterSpacing: "0.12em", fontFamily: "monospace" }}>
              {student.personalCode || "—"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard label="Нийт даалгавар" value={total} bg="#06b6d4"
            iconPath="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" />
          <StatCard label="Илгээсэн" value={submitted} bg="#10b981"
            iconPath="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          <StatCard label="Хүлээгдэж буй" value={pending} bg="#f97316"
            iconPath="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
          <StatCard label="Дундаж оноо" value={avgScore !== null ? `${avgScore}%` : "—"} bg="#8b5cf6"
            iconPath="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, marginBottom: 28 }}>

          {/* Donut chart */}
          <div style={{ background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 15, color: "#111827", alignSelf: "flex-start" }}>Гүйцэтгэлийн хувь</p>
            <DonutChart pct={completionPct} color="#06b6d4" />
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Илгээсэн</p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#06b6d4" }}>{submitted}</p>
              </div>
              <div style={{ width: 1, background: "#f1f5f9" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Нийт</p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: "#111827" }}>{total}</p>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 20px", fontWeight: 700, fontSize: 15, color: "#111827" }}>Сүүлийн оноонууд</p>
            {barData.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140 }}>
                <p style={{ color: "#d1d5db", fontSize: 13 }}>Үнэлгээтэй ажил байхгүй</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {barData.map((item, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{item.title}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: item.color, flexShrink: 0, marginLeft: 8 }}>{item.score}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 99, width: `${item.score}%`, background: item.color, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Assignment list */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>Бүх даалгаварууд</p>
          </div>
          {assignments.length === 0 ? (
            <p style={{ textAlign: "center", color: "#d1d5db", padding: "40px 0", margin: 0 }}>Даалгавар байхгүй</p>
          ) : (
            assignments.map(a => {
              const sub = submissions.find(s => s.assignmentId === a.id);
              const past = isPast(a.deadline);
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderBottom: "1px solid #f9fafb" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: sub ? "#10b981" : past ? "#ef4444" : "#f97316", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{a.title}</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>
                      {fmtDate(a.deadline)} · {a.points} оноо
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    {sub ? (
                      sub.score !== null ? (
                        <span style={{ fontSize: 20, fontWeight: 900, color: sub.score >= 80 ? "#06b6d4" : sub.score >= 50 ? "#f97316" : "#ef4444" }}>
                          {sub.score}%
                        </span>
                      ) : (
                        <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                          Илгээсэн
                        </span>
                      )
                    ) : past ? (
                      <span style={{ background: "#fee2e2", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                        Илгээгээгүй
                      </span>
                    ) : (
                      <span style={{ background: "#fff7ed", color: "#f97316", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>
                        Хүлээгдэж буй
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
