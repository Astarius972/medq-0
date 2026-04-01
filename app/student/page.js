"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0fdfd" }}>
      {/* Header */}
      <div className="bg-white shadow-sm px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4dd0e1, #f97316)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">Анги платформ</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">{user.gmail}</span>
          <button
            onClick={logout}
            className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-50"
          >
            Гарах
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col px-8 py-8 max-w-6xl mx-auto w-full">

        {/* Welcome banner */}
        <div
          className="rounded-3xl p-8 mb-8 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)" }}
        >
          <div>
            <p className="text-cyan-100 text-sm mb-1">Тавтай морилно уу</p>
            <h1 className="text-white text-3xl font-black mb-1">{user.gmail.split("@")[0]}</h1>
            <p className="text-cyan-200 text-sm">{user.gmail}</p>
          </div>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e0f7fa" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#06b6d4">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Анги</p>
              <p className="text-2xl font-black text-gray-900">{user.grade}-р анги</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fce4ec" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#e91e63">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Багш</p>
              <p className="text-lg font-bold text-gray-900">{user.teacherName}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e8eaf6" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#7986cb">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Элссэн огноо</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(user.joinedAt).toLocaleDateString("mn-MN")}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#fce4ec" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e91e63">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              </span>
              Даалгаварууд
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-300 text-sm">Одоохондоо даалгавар байхгүй</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#e8eaf6" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#7986cb">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </span>
              Мессежүүд
            </h2>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-300 text-sm">Одоохондоо мессеж байхгүй</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
