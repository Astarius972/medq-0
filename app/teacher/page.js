"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Сайн байна уу, {user.name}!</h1>
        <p className="text-gray-500 text-sm mb-8">Оюутнуудаа удирдах хяналтын самбар</p>

        {/* Code card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-sm text-gray-500 mb-2">Ангийн код — оюутнуудаа нэвтрүүлэх</p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 rounded-xl px-5 py-4 text-center"
              style={{ background: "#e0f7fa" }}
            >
              <span className="text-3xl font-black tracking-widest" style={{ color: "#06b6d4" }}>
                {user.code}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-4 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "#06b6d4" }}
            >
              {copied ? "Хуулагдлаа!" : "Хуулах"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Энэ кодыг оюутнуудад өгнө үү. Тэд gmail хаягаа болон энэ кодыг ашиглан нэвтэрнэ.
          </p>
        </div>

        {/* Students list */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Нэвтэрсэн оюутнууд</h2>
            <span
              className="text-xs font-semibold px-2 py-1 rounded-full"
              style={{ background: "#e0f7fa", color: "#06b6d4" }}
            >
              {students.length}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <p className="text-gray-400 text-sm">Одоохондоо оюутан нэвтрээгүй байна</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {students.map((s, i) => (
                <div
                  key={s.gmail}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "#f9fafb" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: "#06b6d4" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700">{s.gmail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
