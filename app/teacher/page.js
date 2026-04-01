"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const NAV = [
  {
    key: "dashboard",
    label: "Хяналтын самбар",
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    key: "assignments",
    label: "Даалгаврууд",
    badge: 5,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
      </svg>
    ),
  },
  {
    key: "students",
    label: "Сурагчид",
    badge: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    key: "chat",
    label: "Чат",
    badge: 3,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
];

const AVATAR_COLORS = ["#f97316", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

function avatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let n = 0;
  for (let i = 0; i < str.length; i++) n += str.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(lastName, firstName, gmail) {
  if (lastName && firstName) return (lastName[0] + firstName[0]).toUpperCase();
  if (gmail) return gmail[0].toUpperCase();
  return "?";
}

function studentDisplayName(s) {
  if (s.lastName && s.firstName) return `${s.lastName[0]}.${s.firstName}`;
  return s.gmail.split("@")[0];
}

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "teacher") { router.push("/"); return; }
    setUser(parsed);

    fetch(`/api/codes?gmail=${encodeURIComponent(parsed.gmail)}`)
      .then((r) => r.json())
      .then((d) => setStudents(d.students || []));
  }, [router]);

  function copyCode() {
    if (!user?.code) return;
    navigator.clipboard.writeText(user.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function logout() {
    sessionStorage.removeItem("user");
    router.push("/");
  }

  if (!user) return null;

  const teacherInitial = (user.name || user.gmail || "B")[0].toUpperCase();
  const teacherDisplay = user.name || user.gmail.split("@")[0];
  const recentStudents = students.slice(0, 4);
  const topStudents = students.slice(0, 4);

  return (
    <div className="min-h-screen flex" style={{ background: "#f8f9fa" }}>

      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0" style={{ background: "#f97316" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0"
            style={{ background: "rgba(255,255,255,0.25)", color: "white" }}
          >
            {teacherInitial}
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Багшийн самбар</p>
            <p className="text-orange-200 text-xs">Сурлатын платформ</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                style={
                  active
                    ? { background: "white", color: "#f97316" }
                    : { background: "transparent", color: "rgba(255,255,255,0.85)" }
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={
                      active
                        ? { background: "#f97316", color: "white" }
                        : { background: "rgba(255,255,255,0.25)", color: "white" }
                    }
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User at bottom */}
        <div
          className="mx-3 mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: "rgba(255,255,255,0.9)", color: "#f97316" }}
          >
            {teacherInitial}{teacherInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{teacherDisplay}</p>
            <p className="text-orange-200 text-xs">Багш</p>
          </div>
          <button onClick={logout} title="Гарах">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top header */}
        <header className="bg-white px-8 py-4 flex items-center justify-between shrink-0 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Сайн байна уу, {teacherDisplay}!</h1>
            <p className="text-sm text-gray-400">Өнөөдөр ажлаа амжилттай явуулаарай</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Bell */}
            <button className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{ background: "#f97316", fontSize: "10px" }}
              >
                2
              </span>
            </button>
            {/* Settings */}
            <button className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">

          {/* Stats */}
          <div className="grid grid-cols-4 gap-5 mb-6">
            {[
              {
                label: "Нийт сурагч", value: students.length, sub: `+${Math.max(0, students.length)} энэ сард`,
                bg: "#fff7ed", fill: "#f97316",
                icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
              },
              {
                label: "Идэвхтэй даалгавар", value: 0, sub: "0 хүлээгдэж буй",
                bg: "#eff6ff", fill: "#3b82f6",
                icon: <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
              },
              {
                label: "Үнэлсэн даалгавар", value: 0, sub: "Энэ сард",
                bg: "#f0fdf4", fill: "#10b981",
                icon: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />,
              },
              {
                label: "Дундаж амжилт", value: "—", sub: "Өгөгдөл алга",
                bg: "#fafafa", fill: "#6b7280",
                icon: <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />,
              },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={s.fill}>{s.icon}</svg>
                </div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-3 gap-5 mb-6">

            {/* Шинэ илгээлтүүд */}
            <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Шинэ илгээлтүүд</h2>
                {recentStudents.length > 0 && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#fff7ed", color: "#f97316" }}>
                    {recentStudents.length} хүлээгдэж буй
                  </span>
                )}
              </div>
              {recentStudents.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-gray-300 text-sm">Одоохондоо илгээлт байхгүй</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-gray-50">
                  {recentStudents.map((s) => {
                    const name = studentDisplayName(s);
                    const color = avatarColor(s.gmail);
                    const init = initials(s.lastName, s.firstName, s.gmail);
                    return (
                      <div key={s.gmail} className="flex items-center gap-4 py-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: color }}
                        >
                          {init}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{name}</p>
                          <p className="text-xs text-gray-400">{s.grade}-р анги</p>
                        </div>
                        <button
                          className="text-xs px-3 py-1 rounded-lg font-semibold"
                          style={{ background: "#fff7ed", color: "#f97316" }}
                        >
                          Үнэлэх
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Удахгүй дуусах хугацаа */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span style={{ color: "#f97316" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
                  </svg>
                </span>
                Удахгүй дуусах хугацаа
              </h2>
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-300 text-sm text-center">Даалгавар байхгүй</p>
              </div>
            </div>
          </div>

          {/* Шилдэг сурагчид */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Шилдэг сурагчид</h2>
              {/* Class code */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Ангийн код:</span>
                <span className="font-black tracking-widest text-sm" style={{ color: "#f97316" }}>{user.code}</span>
                <button
                  onClick={copyCode}
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{ background: "#fff7ed", color: "#f97316" }}
                >
                  {copied ? "✓" : "Хуулах"}
                </button>
              </div>
            </div>
            {topStudents.length === 0 ? (
              <div className="flex items-center justify-center h-20">
                <p className="text-gray-300 text-sm">Сурагч бүртгэгдээгүй байна</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {topStudents.map((s, i) => {
                  const name = studentDisplayName(s);
                  const color = avatarColor(s.gmail);
                  const rankColors = ["#f59e0b", "#9ca3af", "#f97316", "#06b6d4"];
                  return (
                    <div key={s.gmail} className="flex items-center gap-4 py-2.5 px-3 rounded-xl" style={{ background: "#f9fafb" }}>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                        style={{ background: rankColors[i] || "#d1d5db" }}
                      >
                        {i + 1}
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: color }}
                      >
                        {initials(s.lastName, s.firstName, s.gmail)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{name}</p>
                        <p className="text-xs text-gray-400">{s.grade}-р анги</p>
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
  );
}
