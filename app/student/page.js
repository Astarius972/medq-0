"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isPast, fmtDate, timeLeft, relTime } from "@/lib/formatters";

const MOCK_ASSIGNMENTS = [
  { id: 1, title: "Математикийн тест 6", subject: "Математик", date: "2-р сарын 18", points: 100, urgent: true },
  { id: 2, title: "Биологийн лаб 4", subject: "Биологи", date: "2-р сарын 20", points: 80, urgent: false },
  { id: 3, title: "Түүхийн эссэ 2", subject: "Түүх", date: "2-р сарын 22", points: 120, urgent: false },
];

const MOCK_PROGRESS = [
  { subject: "Математик", teacher: "Б.Жонсон", pct: 75, color: "#06b6d4" },
  { subject: "Биологи", teacher: "Д.Мартинез", pct: 82, color: "#f97316" },
  { subject: "Түүх", teacher: "Н.Томпсон", pct: 68, color: "#06b6d4" },
  { subject: "Физик", teacher: "Х.Андерсон", pct: 90, color: "#f97316" },
];

const NAV = [
  {
    key: "dashboard",
    label: "Хяналтын самбар",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    key: "assignments",
    label: "Миний даалгавар",
    badge: 3,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    ),
  },
  {
    key: "messages",
    label: "Мессеж",
    badge: 1,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
];

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
 HEAD
  const [activeNav, setActiveNav] = useState("dashboard");

  const [activeTab, setActiveTab] = useState("dashboard");
 8562c995784a3e0cd96a9cf4e7821641296010f5
  const router = useRouter();

  // assignments
  const [assignments, setAssignments] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [submitText, setSubmitText] = useState("");
  const [submitFile, setSubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);

  // chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "student") { router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch(`/api/assignments?studentTeacherGmail=${encodeURIComponent(user.teacherGmail)}&grade=${user.grade}`).then(r => r.json()),
      fetch(`/api/submissions?studentGmail=${encodeURIComponent(user.gmail)}`).then(r => r.json()),
    ]).then(([aData, sData]) => {
      setAssignments(aData.assignments || []);
      setMySubmissions(sData.submissions || []);
    });
  }, [user]);

  const loadChat = useCallback((gmail, teacherGmail) => {
    fetch(`/api/chat?studentGmail=${encodeURIComponent(gmail)}&teacherGmail=${encodeURIComponent(teacherGmail)}`)
      .then(r => r.json()).then(d => setChatMessages(d.messages || []));
  }, []);

  // load chat on mount, then poll when on chat tab
  useEffect(() => {
    if (!user) return;
    loadChat(user.gmail, user.teacherGmail);
  }, [user, loadChat]);

  useEffect(() => {
    if (!user || activeTab !== "chat") return;
    const iv = setInterval(() => loadChat(user.gmail, user.teacherGmail), 5000);
    return () => clearInterval(iv);
  }, [user, activeTab, loadChat]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  function logout() { sessionStorage.removeItem("user"); router.push("/"); }

  function getSubmission(assignmentId) {
    return mySubmissions.find(s => s.assignmentId === assignmentId) || null;
  }

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
    if (!chatInput.trim()) return;
    setChatSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromGmail: user.gmail, toGmail: user.teacherGmail, text: chatInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatMessages(prev => [...prev, data.message]);
      setChatInput("");
    } finally { setChatSending(false); }
  }

  if (!user) return null;
  const displayName = user.lastName && user.firstName ? `${user.lastName} ${user.firstName}` : user.gmail.split("@")[0];
  const activeAssignments = assignments.filter(a => !isPast(a.deadline));
  const pastAssignments = assignments.filter(a => isPast(a.deadline));
  const unreadChat = (() => {
    if (!chatMessages.length) return false;
    const sorted = [...chatMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    const last = sorted[sorted.length - 1];
    return last.fromGmail === user.teacherGmail;
  })();

  const TABS = [
    { key: "dashboard", label: "Хяналтын самбар", badge: null },
    { key: "assignments", label: "Даалгаврууд", badge: activeAssignments.length || null },
    { key: "chat", label: "Чат", badge: unreadChat ? "!" : null },
  ];

  const initials = user.gmail?.slice(0, 1).toUpperCase() ?? "А";
  const displayName = user.gmail?.split("@")[0] ?? "Сурагч";

  return (
 HEAD
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className="w-64 flex flex-col shrink-0 text-white"
        style={{ background: "linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)" }}
      >
        {/* Sidebar top */}
        <div className="px-5 pt-6 pb-5 flex items-center gap-3 border-b border-white/10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white leading-tight truncate">Сурагчийн самбар</p>
            <p className="text-xs text-cyan-100">Сурагч</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={
                  active
                    ? { background: "white", color: "#06b6d4" }
                    : { color: "rgba(255,255,255,0.85)" }
                }
              >
                <span className={active ? "text-cyan-500" : "text-white/80"}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={
                      active
                        ? { background: "#06b6d4", color: "white" }
                        : { background: "rgba(255,255,255,0.2)", color: "white" }
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar bottom — user */}
        <div
          className="mx-3 mb-4 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <p className="text-xs text-cyan-100">Сурагч</p>
          </div>
          <button onClick={logout} className="text-white/70 hover:text-white transition-colors" title="Гарах">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>

    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden", background: "#f0fdfd", color: "#111827" }}>
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#4dd0e1,#f97316)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">Анги платформ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">{user.gmail}</span>
          <button onClick={logout} className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-50">Гарах</button>
 8562c995784a3e0cd96a9cf4e7821641296010f5
        </div>
      </aside>

 HEAD
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-start justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Сайн байна уу, {displayName}!</h1>
            <p className="text-sm text-gray-400 mt-0.5">Өнөөдөр хичээлээ сайн явуулаарай</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span
                className="absolute -top-0.5 -right-0.5 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center"
                style={{ background: "#06b6d4" }}
              >
                2
              </span>
            </button>
            {/* Settings */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-7">
            {[
              {
                label: "Элссэн хичээл",
                value: "4",
                bg: "#e0f7fa",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#06b6d4">
                    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
                  </svg>
                ),
              },
              {
                label: "Хүлээгдэж буй",
                value: "3",
                bg: "#fff3e0",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#f97316">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
                  </svg>
                ),
              },
              {
                label: "Дууссан",
                value: "9",
                bg: "#e8f5e9",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#22c55e">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                ),
              },
              {
                label: "Дундаж үнэлгээ",
                value: "92%",
                bg: "#fce4ec",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#f97316">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
                  </svg>
                ),
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-gray-900">{stat.value}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: stat.bg }}
                >
                  {stat.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-3 gap-6">
            {/* Upcoming assignments — 2 cols */}
            <div className="col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="font-bold text-gray-900">Удахгүй болох даалгавар</p>
                <button className="text-sm font-semibold" style={{ color: "#06b6d4" }}>
                  Бүгдийг үзэх →
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {MOCK_ASSIGNMENTS.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-4 rounded-xl p-4 border-l-4"
                    style={{
                      background: "#f9fafb",
                      borderLeftColor: a.urgent ? "#f97316" : "#06b6d4",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                        {a.urgent && (
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                            style={{ background: "#f97316" }}
                          >
                            Яаралтай
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{a.subject}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
                        </svg>
                        {a.date}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-500 shrink-0">{a.points} оноо</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Course progress */}
              <div className="bg-white rounded-2xl shadow-sm p-5 flex-1">
                <p className="font-bold text-gray-900 mb-4">Хичээлийн явц</p>
                <div className="flex flex-col gap-4">
                  {MOCK_PROGRESS.map((p) => (
                    <div key={p.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-bold text-gray-800">{p.subject}</p>
                          <p className="text-xs text-gray-400">{p.teacher}</p>
                        </div>
                        <p className="text-sm font-bold text-gray-700">{p.pct}%</p>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${p.pct}%`, background: p.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip card */}
              <div
                className="rounded-2xl p-5 text-white"
                style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                  </svg>
                  <p className="font-bold text-sm">Зөвлөмж</p>
                </div>
                <p className="text-xs text-cyan-100 leading-relaxed">
                  Математикийн тест ойртож байна. Өмнөх сэдвүүдийг давтаж бэлдээрэй!
                </p>
              </div>
            </div>
          </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-8 shrink-0">
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-colors"
              style={activeTab === tab.key ? { borderColor: "#06b6d4", color: "#06b6d4" } : { borderColor: "transparent", color: "#9ca3af" }}>
              {tab.label}
              {tab.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: "#06b6d4" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-6xl mx-auto">
              <div className="rounded-3xl p-8 mb-8 flex items-center justify-between"
                style={{ background: "linear-gradient(135deg,#06b6d4 0%,#0891b2 100%)" }}>
                <div>
                  <p className="text-cyan-100 text-sm mb-1">Тавтай морилно уу</p>
                  <h1 className="text-white text-3xl font-black mb-1">{displayName}</h1>
                  <p className="text-cyan-200 text-sm">{user.gmail}</p>
                </div>
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e0f7fa" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#06b6d4"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" /></svg>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Анги</p><p className="text-2xl font-black text-gray-900">{user.grade}-р анги</p></div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fce4ec" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#e91e63"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Багш</p><p className="text-lg font-bold text-gray-900">{user.teacherName}</p></div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8eaf6" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#7986cb"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" /></svg>
                  </div>
                  <div><p className="text-xs text-gray-400 mb-0.5">Элссэн огноо</p><p className="text-lg font-bold text-gray-900">{new Date(user.joinedAt).toLocaleDateString("mn-MN")}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
                  <h2 className="font-bold text-gray-900 mb-4">Идэвхтэй даалгаврууд</h2>
                  {activeAssignments.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center"><p className="text-gray-300 text-sm">Даалгавар байхгүй</p></div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {activeAssignments.slice(0, 3).map(a => {
                        const sub = getSubmission(a.id);
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f9fafb" }}>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                              <p className="text-xs text-gray-400">{timeLeft(a.deadline)}</p>
                            </div>
                            {sub ? (
                              <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>Илгээсэн</span>
                            ) : (
                              <button onClick={() => { setSubmitTarget(a); setSubmitText(""); setSubmitFile(null); setSubmitError(""); setActiveTab("assignments"); }}
                                className="text-xs px-3 py-1.5 rounded-lg font-bold text-white" style={{ background: "#06b6d4" }}>
                                Илгээх
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
                  <h2 className="font-bold text-gray-900 mb-4">Багштай харилцах</h2>
                  {chatMessages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      <p className="text-gray-300 text-sm">Мессеж байхгүй</p>
                      <button onClick={() => setActiveTab("chat")}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white" style={{ background: "#06b6d4" }}>
                        Чат нээх
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 flex-1">
                      {chatMessages.slice(-3).map(msg => {
                        const isMe = msg.fromGmail === user.gmail;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm"
                              style={isMe ? { background: "#06b6d4", color: "white" } : { background: "#f3f4f6", color: "#111827" }}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => setActiveTab("chat")} className="text-xs text-gray-400 underline self-end mt-1">
                        Бүгдийг харах
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-black text-gray-900 mb-6">Миний даалгаврууд</h2>
              {assignments.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" /></svg>
                  <p className="text-gray-400">Одоохондоо даалгавар байхгүй</p>
                </div>
              ) : (
                <>
                  {activeAssignments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Идэвхтэй</h3>
                      <div className="flex flex-col gap-3">
                        {activeAssignments.map(a => {
                          const sub = getSubmission(a.id);
                          const tl = timeLeft(a.deadline);
                          return (
                            <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border-l-4" style={{ borderColor: "#06b6d4" }}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-900 text-lg">{a.title}</p>
                                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                    <span>Хугацаа: {fmtDate(a.deadline)}</span>
                                    <span>•</span>
                                    <span>{a.points} оноо</span>
                                    {tl && <><span>•</span><span className="font-semibold" style={{ color: "#06b6d4" }}>{tl}</span></>}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  {sub ? (
                                    <>
                                      {sub.score !== null ? (
                                        <span className="text-2xl font-black" style={{ color: "#06b6d4" }}>{sub.score}%</span>
                                      ) : (
                                        <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>✓ Илгээсэн</span>
                                      )}
                                      <button onClick={() => { setSubmitTarget(a); setSubmitText(sub.text || ""); setSubmitFile(null); setSubmitError(""); }}
                                        className="text-xs text-gray-400 underline">Дахин илгээх</button>
                                    </>
                                  ) : (
                                    <button onClick={() => { setSubmitTarget(a); setSubmitText(""); setSubmitFile(null); setSubmitError(""); }}
                                      className="px-5 py-2.5 rounded-xl font-bold text-white text-sm" style={{ background: "#06b6d4" }}>
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
                      <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">Хугацаа дууссан</h3>
                      <div className="flex flex-col gap-3">
                        {pastAssignments.map(a => {
                          const sub = getSubmission(a.id);
                          return (
                            <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-gray-200 opacity-70">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-gray-700">{a.title}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span>Дууссан: {fmtDate(a.deadline)}</span>
                                    <span>•</span>
                                    <span>{a.points} оноо</span>
                                  </div>
                                </div>
                                <div>
                                  {sub ? (
                                    sub.score !== null
                                      ? <span className="text-2xl font-black" style={{ color: "#06b6d4" }}>{sub.score}%</span>
                                      : <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>✓ Илгээсэн</span>
                                  ) : (
                                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#ef4444" }}>Илгээгээгүй</span>
                                  )}
                                </div>
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
          </div>
        )}

        {/* CHAT */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col bg-white max-w-2xl mx-auto w-full">
            <div className="px-6 py-4 border-b border-gray-100 shrink-0">
              <p className="font-bold text-gray-900">Багштай харилцах</p>
              <p className="text-xs text-gray-400">{user.teacherName || user.teacherGmail}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {chatMessages.length === 0 && (
                <p className="text-center text-gray-300 text-sm mt-12">Мессеж байхгүй. Эхний мессежийг илгээнэ үү.</p>
              )}
              {[...chatMessages].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)).map(msg => {
                const isMe = msg.fromGmail === user.gmail;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                      style={isMe
                        ? { background: "#06b6d4", color: "white", borderBottomRightRadius: 4 }
                        : { background: "#f3f4f6", color: "#111827", borderBottomLeftRadius: 4 }}>
                      <p>{msg.text}</p>
                      <p className="text-xs mt-1 opacity-60">{relTime(msg.sentAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>
            <form onSubmit={handleSendChat} className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
              <input type="text" placeholder="Мессеж бичих..." value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                style={{ background: "#f3f4f6", color: "#111827" }} />
              <button type="submit" disabled={chatSending || !chatInput.trim()}
                className="px-5 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: "#06b6d4" }}>
                Илгээх
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SUBMIT MODAL */}
      {submitTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold text-gray-900">Даалгавар илгээх</h3>
              <button onClick={() => setSubmitTarget(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">{submitTarget.title}</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Тайлбар (сонголтой)</label>
                <textarea placeholder="Ажлын тайлбар бичнэ үү..." rows={3} value={submitText}
                  onChange={e => setSubmitText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "#f3f4f6", color: "#111827" }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Зураг / файл хавсаргах</label>
                <div className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: submitFile ? "#06b6d4" : "#e5e7eb", background: submitFile ? "#e0f7fa" : "white" }}
                  onClick={() => fileInputRef.current?.click()}>
                  {submitFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {submitFile.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(submitFile)} alt="" className="h-20 rounded-lg object-contain"
                          onLoad={e => URL.revokeObjectURL(e.target.src)} />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#06b6d4"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z" /></svg>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{submitFile.name}</p>
                        <button type="button" onClick={e => { e.stopPropagation(); setSubmitFile(null); }}
                          className="text-xs text-red-400 mt-0.5">Устгах</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto mb-2" width="28" height="28" viewBox="0 0 24 24" fill="#9ca3af"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
                      <p className="text-sm text-gray-400">Зураг, файл хавсаргах</p>
                      <p className="text-xs text-gray-300 mt-1">Товшиж файл сонгох</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                  onChange={e => setSubmitFile(e.target.files?.[0] || null)} />
              </div>
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 text-sm"
                  style={{ background: "#06b6d4" }}>
                  {submitting ? "Илгээж байна..." : "Илгээх"}
                </button>
                <button type="button" onClick={() => setSubmitTarget(null)}
                  className="px-6 py-3 rounded-xl font-semibold text-sm text-gray-600 border border-gray-200">
                  Болих
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
