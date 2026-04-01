"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [role, setRole] = useState("student");
  const [gmail, setGmail] = useState("");
  const [code, setCode] = useState("");
  const [grade, setGrade] = useState(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
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
      } else if (role === "student") {
        const res = await fetch("/api/auth/student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmail, code, grade, lastName, firstName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem(
          "user",
          JSON.stringify({ ...data.student, role: "student", teacherName: data.teacher.name })
        );
        router.push("/student");
      } else {
        const res = await fetch("/api/auth/parent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmail, code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem(
          "user",
          JSON.stringify({ ...data.parent, role: "parent", teacherName: data.teacher.name, children: data.children })
        );
        router.push("/parent");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const roles = [
    {
      value: "student",
      label: "Сурагч",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
        </svg>
      ),
    },
    {
      value: "teacher",
      label: "Багш",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      ),
    },
    {
      value: "parent",
      label: "Эцэг эх",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
  ];

  const submitLabel = {
    student: "Сурагчаар нэвтрэх",
    teacher: "Багшаар нэвтрэх",
    parent: "Эцэг эхээр нэвтрэх",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(135deg, #e0f7fa 0%, #f0fdfd 60%, #ffffff 100%)" }}
    >
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20">

        {/* Left — Branding */}
        <div className="flex flex-col items-center lg:items-start justify-center lg:flex-1">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
            style={{ background: "linear-gradient(135deg, #4dd0e1 0%, #f97316 100%)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>

          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 mb-4 text-center lg:text-left leading-tight">
            Анги платформ<span style={{ color: "#06b6d4" }}>.</span>
          </h1>
          <p className="text-gray-500 text-xl lg:text-2xl mb-10 max-w-sm text-center lg:text-left leading-relaxed">
            Багш сурагчийн харилцаа холбоог хялбаршуулсан орчин үеийн сургалтын систем
          </p>

          <div className="flex flex-col gap-4 w-full max-w-sm">
            {[
              {
                bg: "#fce4ec", fill: "#e91e63",
                icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />,
                title: "Даалгавар илгээх", sub: "Цаг алдалгүй даалгавар оноох, илгээх",
              },
              {
                bg: "#e8eaf6", fill: "#7986cb",
                icon: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />,
                title: "Шууд мессеж", sub: "Багш сурагч хоорондоо шууд харилцах",
              },
              {
                bg: "#fff8e1", fill: "#fbc02d",
                icon: <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />,
                title: "Үнэлгээ өгөх", sub: "Ажлыг үнэлж, сэтгэгдэл үлдээх",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl px-7 py-6 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={f.fill}>{f.icon}</svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">{f.title}</p>
                  <p className="text-gray-400 text-base">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Login form */}
        <div className="flex items-center justify-center w-full lg:w-auto">
          <div className="bg-white rounded-3xl shadow-xl p-12" style={{ width: "600px", maxWidth: "100%" }}>
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-2">Нэвтрэх</h2>
            <p className="text-center text-gray-400 text-lg mb-8">Та өөрийн эрхээр нэвтрэнэ үү</p>

            {/* Role selector */}
            <p className="text-base font-medium text-gray-600 mb-3">Дүр сонгох</p>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-7">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); setError(""); setCode(""); setGrade(null); setLastName(""); setFirstName(""); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-lg font-semibold transition-colors"
                  style={
                    role === r.value
                      ? { background: "#06b6d4", color: "white" }
                      : { background: "white", color: "#6b7280" }
                  }
                >
                  {r.icon}
                  {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Code — student & parent */}
              {(role === "student" || role === "parent") && (
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">
                    {role === "parent" ? "Сурагчийн ангийн код" : "Ангийн код"}
                  </label>
                  <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af">
                      <path d="M17 8C8 10 5.9 16.17 3.82 22H5.71c.5-1.53 1.14-3 2.29-4.07L12 22l4-4-1-1-2.59 2.59C11.23 16.4 11.8 13.47 17 8z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Ангийн код (жш: ABC123)"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400 uppercase"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Grade — student only */}
              {role === "student" && (
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Анги сонгох</label>
                  <button
                    type="button"
                    onClick={() => setGradeOpen((o) => !o)}
                    className="w-full flex items-center justify-between rounded-xl px-5 py-4"
                    style={{ background: "#f3f4f6" }}
                  >
                    <span className={`text-lg ${grade ? "text-gray-700 font-semibold" : "text-gray-400"}`}>
                      {grade ? `${grade}-р анги` : "Анги сонгох..."}
                    </span>
                    <svg
                      width="22" height="22" viewBox="0 0 24 24" fill="#9ca3af"
                      style={{ transform: gradeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </button>
                  {gradeOpen && (
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => { setGrade(g); setGradeOpen(false); }}
                          className="py-3 rounded-lg text-lg font-semibold transition-colors"
                          style={grade === g ? { background: "#06b6d4", color: "white" } : { background: "#f3f4f6", color: "#6b7280" }}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Овог Нэр — student only */}
              {role === "student" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-base font-medium text-gray-600 mb-2">Овог</label>
                    <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                      <input
                        type="text"
                        placeholder="Овог"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-base font-medium text-gray-600 mb-2">Нэр</label>
                    <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                      <input
                        type="text"
                        placeholder="Нэр"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Gmail */}
              <div>
                <label className="block text-base font-medium text-gray-600 mb-2">И-мэйл хаяг</label>
                <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="example@olula.edu.mn"
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-base text-center bg-red-50 rounded-xl py-3 px-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-xl text-white font-bold text-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#06b6d4" }}
              >
                {loading ? "Түр хүлээнэ үү..." : submitLabel[role]}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
