"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { isPast, fmtDate, timeLeft, relTime } from "@/lib/formatters";

function StudentChatToast({ n, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 320); }, 4700);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [onClose]);
  return (
    <div style={{
      transform: visible ? "translateX(0)" : "translateX(calc(100% + 20px))",
      opacity: visible ? 1 : 0,
      transition: "transform 0.32s cubic-bezier(.22,.68,0,1.2), opacity 0.32s ease",
      background: "#1b2838", borderRadius: 10, padding: "12px 14px", width: 280,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)", borderLeft: "3px solid #06b6d4",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#06b6d4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: "#acb2b8", fontSize: 10, marginBottom: 2, textTransform: "uppercase", letterSpacing: 1 }}>Багшаас мессеж</p>
        <p style={{ color: "white", fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.text}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 320); }}
        style={{ color: "#8f98a0", background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );
}

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const router = useRouter();

  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedTeacherGmail, setSelectedTeacherGmail] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  const [aiMode, setAiMode] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [aiSending, setAiSending] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");
  const [chatNotifications, setChatNotifications] = useState([]);
  const seenMsgIds = useRef(new Set());
  const userRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "student") { router.push("/"); return; }
    setUser(parsed);
    setSelectedTeacherGmail(parsed.teacherGmail);
  }, [router]);

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => setAllTeachers(d.teachers || []));
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/assignments?grade=${user.grade}`).then(r => r.json()),
      fetch(`/api/submissions?studentGmail=${encodeURIComponent(user.gmail)}`).then(r => r.json()),
    ]).then(([aData, sData]) => {
      setAssignments(aData.assignments || []);
      setMySubmissions(sData.submissions || []);
    });
  }, [user]);

  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    if (!user || !selectedTeacherGmail) return;
    const load = (isFirst) =>
      fetch(`/api/chat?studentGmail=${encodeURIComponent(user.gmail)}&teacherGmail=${encodeURIComponent(selectedTeacherGmail)}`)
        .then(r => r.json()).then(d => {
          const msgs = d.messages || [];
          if (isFirst) {
            msgs.forEach(m => seenMsgIds.current.add(m.id));
          } else {
            const fresh = msgs.filter(m => !seenMsgIds.current.has(m.id) && m.fromGmail !== user.gmail);
            fresh.forEach(m => {
              seenMsgIds.current.add(m.id);
              const nid = m.id;
              setChatNotifications(prev => [...prev, { nid, text: m.text }]);
              setTimeout(() => setChatNotifications(prev => prev.filter(n => n.nid !== nid)), 5000);
              if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
                new Notification("Анги платформ — Шинэ мессеж", { body: m.text, icon: "/favicon.ico" });
              }
            });
            if (fresh.length) setChatMessages(msgs);
          }
          if (isFirst) setChatMessages(msgs);
        });
    load(true);
    const iv = setInterval(() => load(false), 2000);
    return () => clearInterval(iv);
  }, [user, selectedTeacherGmail]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  function logout() { sessionStorage.removeItem("user"); router.push("/"); }
  function getSubmission(aid) { return mySubmissions.find(s => s.assignmentId === aid) || null; }
  function isUrgent(deadline) { const d = new Date(deadline) - new Date(); return d > 0 && d < 24 * 3600 * 1000; }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!submitFile && !submitText.trim()) { setSubmitError("Зураг эсвэл тайлбар оруулна уу"); return; }
    setSubmitting(true); setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("assignmentId", submitTarget.id);
      fd.append("studentGmail", user.gmail);
      fd.append("text", submitText);
      if (submitFile) fd.append("file", submitFile);
      const res = await fetch("/api/submissions", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMySubmissions(prev => [...prev.filter(s => s.assignmentId !== submitTarget.id), data.submission]);
      setSubmitTarget(null); setSubmitText(""); setSubmitFile(null);
    } catch (err) { setSubmitError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedTeacherGmail) return;
    setChatSending(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromGmail: user.gmail, toGmail: selectedTeacherGmail, text: chatInput }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatMessages(prev => [...prev, data.message]);
      setChatInput("");
    } finally { setChatSending(false); }
  }

  async function handleSendAi(e) {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const userMsg = { role: "user", content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput("");
    setAiSending(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiInput, history: aiMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Алдаа гарлаа: " + err.message }]);
    } finally {
      setAiSending(false);
    }
  }

  if (!user) return null;

  const displayName = user.lastName && user.firstName
    ? `${user.lastName} ${user.firstName}`
    : user.gmail.split("@")[0];
  const initials = user.lastName && user.firstName
    ? (user.lastName[0] + user.firstName[0]).toUpperCase()
    : user.gmail[0].toUpperCase();

  const activeAssignments = assignments.filter(a => !isPast(a.deadline));
  const pastAssignments = assignments.filter(a => isPast(a.deadline));
  const pendingCount = activeAssignments.filter(a => !getSubmission(a.id)).length;
  const gradedSubs = mySubmissions.filter(s => s.score !== null);
  const avgScore = gradedSubs.length
    ? Math.round(gradedSubs.reduce((s, sub) => s + sub.score, 0) / gradedSubs.length)
    : null;

  const unreadChat = (() => {
    if (!chatMessages.length) return false;
    const sorted = [...chatMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    return sorted[sorted.length - 1].fromGmail !== user.gmail;
  })();

  const selectedTeacher = allTeachers.find(t => t.gmail === selectedTeacherGmail);

  const NAV = [
    { key: "dashboard", label: "Хяналтын самбар", badge: null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
    { key: "assignments", label: "Миний даалгавар", badge: pendingCount || null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/></svg> },
    { key: "chat", label: "Мессеж", badge: unreadChat ? 1 : null,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
  ];

  const S = {
    sidebar: { width: 220, background: "linear-gradient(180deg,#06b6d4 0%,#0891b2 100%)", display: "flex", flexDirection: "column", flexShrink: 0 },
    navBtn: (active) => ({
      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, textAlign: "left",
      background: active ? "white" : "transparent",
      color: active ? "#06b6d4" : "rgba(255,255,255,0.9)",
    }),
    card: { background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", color: "#111827" }}>

      <div style={S.sidebar}>
        <div style={{ padding: "22px 14px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Сурагчийн самбар</p>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: 0 }}>Сурагч</p>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map(item => {
            const active = activeTab === item.key;
            return (
              <button key={item.key} onClick={() => setActiveTab(item.key)} style={S.navBtn(active)}>
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge != null && (
                  <span style={{
                    background: active ? "#06b6d4" : "rgba(255,255,255,0.25)",
                    color: "white", fontSize: 11, fontWeight: 700,
                    padding: "1px 7px", borderRadius: 99,
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ margin: "0 10px 16px", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "white", fontWeight: 700, fontSize: 12, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</p>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, margin: 0 }}>Сурагч</p>
          </div>
          <button onClick={logout} title="Гарах" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 4, display: "flex", alignItems: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        <div style={{ background: "white", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <div>
            {activeTab === "dashboard" && <>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Сайн байна уу, {displayName}!</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Өнөөдөр хичээлээ сайн явуулаарай</p>
            </>}
            {activeTab === "assignments" && <>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Миний даалгаврууд</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{assignments.length} даалгавар нийт</p>
            </>}
            {activeTab === "chat" && <>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>Мессеж</h1>
              <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>{user.teacherName || user.teacherGmail}</p>
            </>}
          </div>
          {unreadChat && (
            <button onClick={() => setActiveTab("chat")}
              style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "#f1f5f9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              <span style={{ position: "absolute", top: -3, right: -3, width: 16, height: 16, background: "#ef4444", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 9, fontWeight: 800 }}>!</span>
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>

          {activeTab === "dashboard" && (
            <div style={{ height: "100%", overflowY: "auto", padding: "24px 28px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Элссэн хичээл", value: assignments.length, bg: "#e0f7fa",
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#06b6d4"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></svg> },
                  { label: "Хүлээгдэж буй", value: pendingCount, bg: "#fff3e0",
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#f97316"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg> },
                  { label: "Дууссан", value: mySubmissions.length, bg: "#e8fdf5",
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#10b981"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
                  { label: "Дундаж үнэлгээ", value: avgScore !== null ? `${avgScore}%` : "—", bg: "#fff3e0",
                    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#f97316"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg> },
                ].map((s, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", marginBottom: 4 }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#111827" }}>{s.value}</p>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>Удахгүй болох даалгавар</p>
                      <button onClick={() => setActiveTab("assignments")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#06b6d4", fontWeight: 600 }}>
                        Бүгдийг үзэх →
                      </button>
                    </div>
                    {activeAssignments.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "20px 0", margin: 0 }}>Даалгавар байхгүй</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {activeAssignments.slice(0, 4).map(a => {
                          const sub = getSubmission(a.id);
                          const urgent = isUrgent(a.deadline);
                          return (
                            <div key={a.id} style={{ borderLeft: "3px solid #06b6d4", paddingLeft: 14, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: "0 10px 10px 0", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</p>
                                  {urgent && !sub && <span style={{ background: "#f97316", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, flexShrink: 0 }}>Яаралтай</span>}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#9ca3af", fontSize: 12 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                                  <span>{fmtDate(a.deadline)}</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{a.points} оноо</span>
                                {sub ? (
                                  <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99 }}>✓</span>
                                ) : (
                                  <button onClick={() => { setSubmitTarget(a); setSubmitText(""); setSubmitFile(null); setSubmitError(""); }}
                                    style={{ background: "#06b6d4", color: "white", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8 }}>
                                    Илгээх
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {gradedSubs.length > 0 && (
                    <div style={S.card}>
                      <p style={{ margin: "0 0 14px", fontWeight: 700, fontSize: 15, color: "#111827" }}>Сүүлийн үнэлгээ</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {[...gradedSubs].sort((a, b) => new Date(b.gradedAt) - new Date(a.gradedAt)).slice(0, 3).map(sub => {
                          const asgn = assignments.find(a => a.id === sub.assignmentId);
                          const scoreColor = sub.score >= 80 ? "#10b981" : sub.score >= 50 ? "#f97316" : "#ef4444";
                          return (
                            <div key={sub.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
                              <div>
                                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#111827" }}>{asgn?.title || "Даалгавар"}</p>
                                <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{relTime(sub.gradedAt)}</p>
                              </div>
                              <span style={{ fontSize: 22, fontWeight: 900, color: scoreColor }}>{sub.score}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={S.card}>
                    <p style={{ margin: "0 0 16px", fontWeight: 700, fontSize: 15, color: "#111827" }}>Хичээлийн явц</p>
                    {gradedSubs.length === 0 ? (
                      <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 13, padding: "10px 0", margin: 0 }}>Үнэлгээ байхгүй</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {[...gradedSubs].slice(0, 4).map(sub => {
                          const asgn = assignments.find(a => a.id === sub.assignmentId);
                          const bar = sub.score >= 80 ? "#06b6d4" : sub.score >= 50 ? "#f97316" : "#ef4444";
                          return (
                            <div key={sub.id}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{asgn?.title || "Даалгавар"}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{sub.score}%</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 99, background: "#f1f5f9", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 99, width: `${sub.score}%`, background: bar }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ borderRadius: 16, padding: "20px", background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                      <p style={{ margin: 0, color: "white", fontWeight: 700, fontSize: 14 }}>Зөвлөмж</p>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                      {["Даалгаврыг хугацаанаас өмнө илгээх","Материалыг сайтар уншаад бодох","Асуул байвал багшаас асуух","Өдөр бүр идэвхтэй оролцох"].map((tip, i) => (
                        <li key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", display: "flex", gap: 8, lineHeight: 1.4 }}>
                          <span style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>•</span>{tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" }}>Багш</p>
                      <button onClick={() => setActiveTab("chat")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#06b6d4", fontWeight: 600 }}>
                        Нээх →
                      </button>
                    </div>
                    {chatMessages.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", padding: "8px 0", margin: 0 }}>Мессеж байхгүй</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {[...chatMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)).slice(-2).map(msg => {
                          const isMe = msg.fromGmail === user.gmail;
                          return (
                            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                              <div style={{ maxWidth: "80%", padding: "6px 12px", borderRadius: 12, fontSize: 12,
                                background: isMe ? "#06b6d4" : "#f3f4f6", color: isMe ? "white" : "#111827" }}>
                                {msg.text}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignments" && (
            <div style={{ height: "100%", overflowY: "auto", padding: "24px 28px" }}>
              {assignments.length === 0 ? (
                <div style={{ ...S.card, textAlign: "center", padding: "48px 20px" }}>
                  <svg style={{ display: "block", margin: "0 auto 12px" }} width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
                  <p style={{ color: "#9ca3af", margin: 0 }}>Одоохондоо даалгавар байхгүй</p>
                </div>
              ) : (
                <>
                  {activeAssignments.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Идэвхтэй</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {activeAssignments.map(a => {
                          const sub = getSubmission(a.id);
                          const tl = timeLeft(a.deadline);
                          const urgent = isUrgent(a.deadline);
                          return (
                            <div key={a.id} style={{ ...S.card, borderLeft: "4px solid #06b6d4", borderRadius: "0 14px 14px 0", padding: "16px 20px" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#111827" }}>{a.title}</p>
                                    {urgent && !sub && <span style={{ background: "#f97316", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>Яаралтай</span>}
                                  </div>
                                  {a.description && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{a.description}</p>}
                                  {a.imageUrl && (
                                    <img src={a.imageUrl} alt="task" onClick={() => setLightboxUrl(a.imageUrl)}
                                      style={{ marginTop: 8, maxHeight: 120, borderRadius: 8, cursor: "pointer", objectFit: "cover" }}/>
                                  )}
                                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, fontSize: 12, color: "#9ca3af" }}>
                                    <span>Хугацаа: {fmtDate(a.deadline)}</span>
                                    <span>•</span>
                                    <span>{a.points} оноо</span>
                                    {tl && <><span>•</span><span style={{ color: "#06b6d4", fontWeight: 600 }}>{tl}</span></>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                                  {sub ? (
                                    <>
                                      {sub.score !== null
                                        ? <span style={{ fontSize: 24, fontWeight: 900, color: "#06b6d4" }}>{sub.score}%</span>
                                        : <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>✓ Илгээсэн</span>}
                                      <button onClick={() => { setSubmitTarget(a); setSubmitText(sub.text || ""); setSubmitFile(null); setSubmitError(""); }}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9ca3af", textDecoration: "underline" }}>
                                        Дахин илгээх
                                      </button>
                                    </>
                                  ) : (
                                    <button onClick={() => { setSubmitTarget(a); setSubmitText(""); setSubmitFile(null); setSubmitError(""); }}
                                      style={{ background: "#06b6d4", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10 }}>
                                      Илгээх
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {pastAssignments.length > 0 && (
                    <div>
                      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Хугацаа дууссан</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {pastAssignments.map(a => {
                          const sub = getSubmission(a.id);
                          return (
                            <div key={a.id} style={{ ...S.card, borderLeft: "4px solid #e5e7eb", borderRadius: "0 14px 14px 0", padding: "16px 20px", opacity: 0.7 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div>
                                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#374151" }}>{a.title}</p>
                                  <div style={{ display: "flex", gap: 10, marginTop: 4, fontSize: 12, color: "#9ca3af" }}>
                                    <span>Дууссан: {fmtDate(a.deadline)}</span>
                                    <span>•</span>
                                    <span>{a.points} оноо</span>
                                  </div>
                                </div>
                                {sub ? (
                                  sub.score !== null
                                    ? <span style={{ fontSize: 22, fontWeight: 900, color: "#06b6d4" }}>{sub.score}%</span>
                                    : <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>✓ Илгээсэн</span>
                                ) : (
                                  <span style={{ background: "#fee2e2", color: "#ef4444", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 99 }}>Илгээгээгүй</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "chat" && (
            <div style={{ height: "100%", display: "flex" }}>
              <div style={{ width: 220, borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column", background: "white", flexShrink: 0 }}>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <p style={{ margin: 0, padding: "14px 16px 10px", fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>Багш нар</p>
                  {allTeachers.length === 0 && (
                    <p style={{ fontSize: 12, color: "#d1d5db", textAlign: "center", padding: "12px 8px", margin: 0 }}>Багш олдсонгүй</p>
                  )}
                  {allTeachers.map(t => {
                    const active = !aiMode && t.gmail === selectedTeacherGmail;
                    return (
                      <button key={t.gmail} onClick={() => { setAiMode(false); setSelectedTeacherGmail(t.gmail); }}
                        style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
                          background: active ? "#e0f7fa" : "transparent", borderLeft: active ? "3px solid #06b6d4" : "3px solid transparent" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? "#06b6d4" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", color: active ? "white" : "#6b7280", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                          {t.name[0].toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: active ? "#0891b2" : "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.gmail.split("@")[0]}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: "10px 12px", borderTop: "1px solid #f1f5f9" }}>
                  <button onClick={() => setAiMode(true)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                      background: aiMode ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#f3f0ff,#ede9fe)" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: aiMode ? "rgba(255,255,255,0.2)" : "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13z"/></svg>
                    </div>
                    <div style={{ minWidth: 0, textAlign: "left" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: aiMode ? "white" : "#6d28d9" }}>AI туслах</p>
                      <p style={{ margin: 0, fontSize: 11, color: aiMode ? "rgba(255,255,255,0.7)" : "#8b5cf6" }}>Хичээлд тусламж</p>
                    </div>
                  </button>
                </div>
              </div>

              {aiMode ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13z"/></svg>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>AI Хичээлийн туслах</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#8b5cf6" }}>Математик, физик, хими болон бусад хичээл</p>
                    </div>
                    <button onClick={() => setAiMessages([])}
                      style={{ marginLeft: "auto", background: "#f3f0ff", border: "none", cursor: "pointer", color: "#7c3aed", fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8 }}>
                      Цэвэрлэх
                    </button>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {aiMessages.length === 0 && (
                      <div style={{ textAlign: "center", marginTop: 40 }}>
                        <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#374151" }}>AI Хичээлийн туслах</p>
                        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Ойлгоогүй хичээлийнхээ талаар асуугаарай</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 }}>
                          {["2x + 5 = 13 бодлогыг хэрхэн бодох вэ?","Фотосинтез гэж юу вэ?","Дэлхийн 2-р дайн хэзээ дууссан вэ?","Хүндийн хүч гэж юу вэ?"].map(q => (
                            <button key={q} onClick={() => setAiInput(q)}
                              style={{ background: "#f3f0ff", border: "1px solid #ddd6fe", cursor: "pointer", color: "#6d28d9", fontSize: 12, padding: "6px 12px", borderRadius: 99, fontWeight: 500 }}>
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiMessages.map((msg, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: 440, padding: "10px 16px", borderRadius: 18, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                          borderBottomRightRadius: msg.role === "user" ? 4 : 18,
                          borderBottomLeftRadius: msg.role === "user" ? 18 : 4,
                          background: msg.role === "user" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "white",
                          color: msg.role === "user" ? "white" : "#111827",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {aiSending && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ background: "white", padding: "10px 16px", borderRadius: 18, borderBottomLeftRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", display: "flex", gap: 4, alignItems: "center" }}>
                          {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />)}
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendAi} style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, background: "white", flexShrink: 0 }}>
                    <input type="text" placeholder="Хичээлийн талаар асуух..." value={aiInput}
                      onChange={e => setAiInput(e.target.value)} disabled={aiSending}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #ddd6fe", fontSize: 14, outline: "none", color: "#111827", background: "#faf8ff" }} />
                    <button type="submit" disabled={aiSending || !aiInput.trim()}
                      style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 12, opacity: (aiSending || !aiInput.trim()) ? 0.5 : 1 }}>
                      Илгээх
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  {selectedTeacher && (
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9", background: "white", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#e0f7fa", display: "flex", alignItems: "center", justifyContent: "center", color: "#0891b2", fontWeight: 800, fontSize: 13 }}>
                        {selectedTeacher.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{selectedTeacher.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>{selectedTeacher.gmail}</p>
                      </div>
                    </div>
                  )}
                  <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {chatMessages.length === 0 && (
                      <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 13, marginTop: 48 }}>Мессеж байхгүй. Эхний мессежийг илгээнэ үү.</p>
                    )}
                    {[...chatMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)).map(msg => {
                      const isMe = msg.fromGmail === user.gmail;
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: 320, padding: "10px 14px", borderRadius: 18, fontSize: 14,
                            borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4,
                            background: isMe ? "#06b6d4" : "white", color: isMe ? "white" : "#111827",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                            <p style={{ margin: 0 }}>{msg.text}</p>
                            <p style={{ margin: "4px 0 0", fontSize: 11, opacity: 0.6 }}>{relTime(msg.sentAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>
                  <form onSubmit={handleSendChat} style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, background: "white", flexShrink: 0 }}>
                    <input type="text" placeholder={selectedTeacherGmail ? "Мессеж бичих..." : "Багш сонгоно уу"} value={chatInput}
                      onChange={e => setChatInput(e.target.value)} disabled={!selectedTeacherGmail}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", color: "#111827", background: "#f9fafb" }} />
                    <button type="submit" disabled={chatSending || !chatInput.trim() || !selectedTeacherGmail}
                      style={{ background: "#06b6d4", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, padding: "10px 20px", borderRadius: 12, opacity: (chatSending || !chatInput.trim() || !selectedTeacherGmail) ? 0.5 : 1 }}>
                      Илгээх
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {submitTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.4)" }}>
          <div style={{ background: "white", borderRadius: 24, width: "100%", maxWidth: 480, padding: 32, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Даалгавар илгээх</h3>
              <button onClick={() => setSubmitTarget(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#9ca3af" }}>{submitTarget.title}</p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Тайлбар (сонголтой)</label>
                <textarea placeholder="Ажлын тайлбар бичнэ үү..." rows={3} value={submitText}
                  onChange={e => setSubmitText(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", resize: "none", color: "#111827", background: "#f9fafb", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Зураг / файл хавсаргах</label>
                <div style={{ border: `2px dashed ${submitFile ? "#06b6d4" : "#e5e7eb"}`, borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", background: submitFile ? "#e0f7fa" : "white" }}
                  onClick={() => fileInputRef.current?.click()}>
                  {submitFile ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#111827" }}>{submitFile.name}</p>
                        <button type="button" onClick={e => { e.stopPropagation(); setSubmitFile(null); }}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", padding: 0, marginTop: 2 }}>Устгах</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg style={{ display: "block", margin: "0 auto 8px" }} width="28" height="28" viewBox="0 0 24 24" fill="#9ca3af"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>Зураг, файл хавсаргах</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }}
                  onChange={e => setSubmitFile(e.target.files?.[0] || null)} />
              </div>
              {submitError && <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>{submitError}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={submitting}
                  style={{ flex: 1, padding: "12px 0", borderRadius: 12, fontWeight: 700, color: "white", background: "#06b6d4", border: "none", cursor: "pointer", fontSize: 14, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Илгээж байна..." : "Илгээх"}
                </button>
                <button type="button" onClick={() => setSubmitTarget(null)}
                  style={{ padding: "12px 20px", borderRadius: 12, fontWeight: 600, fontSize: 14, color: "#6b7280", background: "white", border: "1px solid #e5e7eb", cursor: "pointer" }}>
                  Болих
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 200, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        {chatNotifications.map(n => (
          <StudentChatToast key={n.nid} n={n} onClose={() => setChatNotifications(prev => prev.filter(x => x.nid !== n.nid))} />
        ))}
      </div>

      {lightboxUrl && (
        <div onClick={() => setLightboxUrl("")}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "zoom-out" }}>
          <img src={lightboxUrl} alt="task" onClick={e => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 8px 48px rgba(0,0,0,0.6)", cursor: "default" }}/>
          <button onClick={() => setLightboxUrl("")}
            style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}