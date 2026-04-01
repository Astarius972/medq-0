"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "parent") { router.push("/"); return; }
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

      <div className="flex-1 flex flex-col px-8 py-8 max-w-6xl mx-auto w-full">
        {/* Banner */}
        <div
          className="rounded-3xl p-8 mb-8 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)" }}
        >
          <div>
            <p className="text-orange-100 text-sm mb-1">Тавтай морилно уу</p>
            <h1 className="text-white text-3xl font-black mb-1">{user.gmail.split("@")[0]}</h1>
            <p className="text-orange-200 text-sm">Эцэг эхийн хяналтын самбар</p>
          </div>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fff8e1" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#f97316">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Багш</p>
              <p className="text-xl font-bold text-gray-900">{user.teacherName}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#e0f7fa" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#06b6d4">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Нэвтэрсэн сурагчид</p>
              <p className="text-xl font-bold text-gray-900">{(user.children || []).length} сурагч</p>
            </div>
          </div>
        </div>

        {/* Children list */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 text-lg mb-4">Ангийн сурагчид</h2>
          {(user.children || []).length === 0 ? (
            <p className="text-gray-300 text-sm text-center py-8">Сурагч бүртгэлгүй байна</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(user.children || []).map((c, i) => (
                <div key={c.gmail} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#f9fafb" }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "#f97316" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{c.gmail}</span>
                  {c.grade && (
                    <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: "#e0f7fa", color: "#06b6d4" }}>
                      {c.grade}-р анги
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
