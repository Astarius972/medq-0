"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(1);
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

  const gradeStudents = students.filter((s) => s.grade === selectedGrade);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f0fdfd" }}>
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between shrink-0">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — grades */}
        <div className="w-52 bg-white border-r border-gray-100 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ангиуд</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => {
              const count = students.filter((s) => s.grade === g).length;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors"
                  style={
                    selectedGrade === g
                      ? { background: "#e0f7fa", color: "#06b6d4", fontWeight: 700 }
                      : { color: "#374151" }
                  }
                >
                  <span>{g}-р анги</span>
                  {count > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={
                        selectedGrade === g
                          ? { background: "#06b6d4", color: "white" }
                          : { background: "#f3f4f6", color: "#6b7280" }
                      }
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Code at bottom of sidebar */}
          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">Ангийн код</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-widest" style={{ color: "#06b6d4" }}>
                {user.code}
              </span>
              <button
                onClick={copyCode}
                className="ml-auto text-xs px-2 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
                style={{ background: "#e0f7fa", color: "#06b6d4" }}
              >
                {copied ? "✓" : "Хуулах"}
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedGrade}-р анги</h1>
              <p className="text-sm text-gray-400">{gradeStudents.length} оюутан нэвтэрсэн</p>
            </div>
          </div>

          {gradeStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
              <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
              <p className="text-gray-400 text-sm">Энэ ангид оюутан нэвтрээгүй байна</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {gradeStudents.map((s, i) => (
                <div
                  key={s.gmail}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0"
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
