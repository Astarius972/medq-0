"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [role, setRole] = useState("student");
  const [gmail, setGmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "teacher") {
        const res = await fetch("/api/auth/teacher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("user", JSON.stringify({ ...data.teacher, role: "teacher" }));
        router.push("/teacher");
      } else {
        const res = await fetch("/api/auth/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmail, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem(
          "user",
          JSON.stringify({ ...data.student, role: "student", teacherName: data.teacher.name })
        );
        router.push("/student");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "linear-gradient(135deg, #e0f7fa 0%, #f0fdfd 60%, #ffffff 100%)" }}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-stretch gap-10 lg:gap-16">
      {/* Left — Branding */}
      <div className="flex flex-col items-center lg:items-start justify-center lg:flex-1">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, #4dd0e1 0%, #f97316 100%)" }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
          </svg>
        </div>

        <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3 text-center lg:text-left">
          Анги платформ<span style={{ color: "#06b6d4" }}>.</span>
        </h1>
        <p className="text-gray-500 text-base lg:text-lg mb-8 max-w-xs text-center lg:text-left leading-relaxed">
          Багш оюутны харилцаа холбоог хялбаршуулсан орчин үеийн сургалтын систем
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {[
            {
              bg: "#fce4ec",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#e91e63">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
              ),
              title: "Даалгавар илгээх",
              sub: "Цаг алдалгүй даалгавар оноох, илгээх",
            },
            {
              bg: "#e8eaf6",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#7986cb">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              ),
              title: "Шууд мессеж",
              sub: "Багш оюутан хоорондоо шууд харилцах",
            },
            {
              bg: "#fff8e1",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbc02d">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              ),
              title: "Үнэлгээ өгөх",
              sub: "Ажлыг үнэлж, сэтгэгдэл үлдээх",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: f.bg }}
              >
                {f.icon}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{f.title}</p>
                <p className="text-gray-400 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex items-center justify-center w-full lg:w-auto px-4 pb-10 lg:px-8 lg:py-12">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-1">Нэвтрэх</h2>
          <p className="text-center text-gray-400 text-sm mb-6">Та өөрийн эрхээр нэвтрэнэ үү</p>

          {/* Role selector */}
          <p className="text-xs text-gray-500 mb-2">Дүр сонгох</p>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-5">
            {[
              { value: "student", label: "Оюутан" },
              { value: "teacher", label: "Багш" },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setRole(r.value); setError(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-colors"
                style={
                  role === r.value
                    ? { background: "#06b6d4", color: "white" }
                    : { background: "white", color: "#6b7280" }
                }
              >
                {r.value === "student" ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
                {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Code field — student only */}
            {role === "student" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ангийн код</label>
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#f3f4f6" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="#9ca3af">
                    <path d="M17 8C8 10 5.9 16.17 3.82 22H5.71c.5-1.53 1.14-3 2.29-4.07L12 22l4-4-1-1-2.59 2.59C11.23 16.4 11.8 13.47 17 8z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Ангийн код (жш: ABC123)"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-transparent flex-1 text-sm text-gray-700 outline-none placeholder-gray-400 uppercase"
                    required
                  />
                </div>
              </div>
            )}

            {/* Gmail field */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gmail хаяг</label>
              <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "#f3f4f6" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#9ca3af">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  className="bg-transparent flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-xs text-center bg-red-50 rounded-xl py-2 px-3">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ background: "#06b6d4" }}
            >
              {loading ? "Түр хүлээнэ үү..." : role === "student" ? "Оюутнаар нэвтрэх" : "Багшаар нэвтрэх"}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
