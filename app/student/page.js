"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [activeNav, setActiveNav] = useState("dashboard");
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "student") { router.push("/"); return; }
    setUser(parsed);
  }, [router]);

  function logout() {
    sessionStorage.removeItem("user");
    router.push("/");
  }

  if (!user) return null;

  const initials = user.gmail?.slice(0, 1).toUpperCase() ?? "А";
  const displayName = user.gmail?.split("@")[0] ?? "Сурагч";

  return (
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
        </div>
      </aside>

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
        </div>
      </div>
    </div>
  );
}
