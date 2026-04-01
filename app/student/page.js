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
    <div className="min-h-screen" style={{ background: "#f0fdfd" }}>
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #4dd0e1, #f97316)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
          <span className="font-bold text-gray-900">Анги платформ</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user.gmail}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Гарах
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Тавтай морил!</h1>
        <p className="text-gray-500 text-sm mb-8">Оюутны хяналтын самбар</p>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <p className="text-xs text-gray-400 mb-1">Таны gmail</p>
          <p className="font-semibold text-gray-800">{user.gmail}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <p className="text-xs text-gray-400 mb-1">Ангийн код</p>
          <span
            className="text-xl font-black tracking-widest"
            style={{ color: "#06b6d4" }}
          >
            {user.code}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs text-gray-400 mb-1">Багш</p>
          <p className="font-semibold text-gray-800">{user.teacherName}</p>
        </div>
      </div>
    </div>
  );
}
