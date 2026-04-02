"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [role, setRole] = useState("student");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const [studentMode, setStudentMode] = useState("login");
  const [schoolCode, setSchoolCode] = useState("");
  const [grade, setGrade] = useState(null);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [classSection, setClassSection] = useState("А");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [teacherGmail, setTeacherGmail] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [newPersonalCode, setNewPersonalCode] = useState("");

  const [parentMode, setParentMode] = useState("login");
  const [studentPersonalCode, setStudentPersonalCode] = useState("");

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(d.teachers || []));
  }, []);

  function reset() {
    setGmail(""); setPassword(""); setConfirmPassword(""); setSchoolCode(""); setGrade(null);
    setLastName(""); setFirstName(""); setTeacherGmail(""); setStudentPersonalCode("");
    setError(""); setNewPersonalCode(""); setClassSection("А"); setShowPw(false);
  }

  const isRegister = role === "teacher" || (role === "student" && studentMode === "register") || (role === "parent" && parentMode === "register");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (isRegister && password !== confirmPassword) return setError("Нууц үг таарахгүй байна");
    if (isRegister && password.length < 6) return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
    setLoading(true);
    try {
      if (role === "teacher") {
        const res = await fetch("/api/auth/teacher", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({gmail,password}) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("user", JSON.stringify({...data.teacher, role:"teacher"}));
        router.push("/teacher");
      } else if (role === "student") {
        const body = studentMode === "login" ? {gmail,password} : {gmail,password,schoolCode,grade,classSection,teacherGmail,lastName,firstName};
        const res = await fetch("/api/auth/student", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.mode === "registered") {
          setNewPersonalCode(data.personalCode);
          sessionStorage.setItem("user", JSON.stringify({...data.student, role:"student", teacherName:data.teacher.name}));
          return;
        }
        sessionStorage.setItem("user", JSON.stringify({...data.student, role:"student", teacherName:data.teacher.name}));
        router.push("/student");
      } else {
        const body = parentMode === "login" ? {gmail,password} : {gmail,password,studentPersonalCode};
        const res = await fetch("/api/auth/parent", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("user", JSON.stringify({...data.parent, role:"parent", teacherName:data.teacher.name, student:data.student}));
        router.push("/parent");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (newPersonalCode) return (
    <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(135deg,#e0f7fa 0%,#f0fdfd 60%,#ffffff 100%)" }}>
      <div className="bg-white rounded-3xl shadow-xl p-12 text-center" style={{ maxWidth: 480, width: "100%" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Бүртгэл амжилттай!</h2>
        <p className="text-gray-500 mb-6">Доорх <strong>хувийн кодоо</strong> эцэг эхдээ өгнө үү. Дараа нэвтрэхдээ ч ашиглана.</p>
        <div className="rounded-2xl py-6 px-8 mb-6" style={{ background: "#f0fdff", border: "2px dashed #06b6d4" }}>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Таны хувийн код</p>
          <p className="text-4xl font-black tracking-widest" style={{ color: "#06b6d4", letterSpacing: "0.2em" }}>{newPersonalCode}</p>
        </div>
        <p className="text-xs text-gray-400 mb-6">Энэ кодыг хадгалаарай — эцэг эхийн нэвтрэлтэд ч ашиглагдана.</p>
        <button onClick={() => router.push("/student")}
          className="w-full py-4 rounded-xl text-white font-bold text-lg"
          style={{ background: "#06b6d4" }}>
          Үргэлжлүүлэх →
        </button>
      </div>
    </div>
  );

  const roles = [
    { value:"student", label:"Сурагч", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg> },
    { value:"teacher", label:"Багш", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
    { value:"parent", label:"Эцэг эх", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  ];
  const sections = ["А","Б","В","Г","Д"];
  const pwMatch = confirmPassword && password === confirmPassword;
  const pwNoMatch = confirmPassword && password !== confirmPassword;

  const inputBox = (children) => (
    <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
      {children}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto"
      style={{ background: "linear-gradient(135deg,#e0f7fa 0%,#f0fdfd 60%,#ffffff 100%)" }}>
    <div className="min-h-full flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20">

        {/* Left — Branding */}
        <div className="flex flex-col items-center lg:items-start justify-center lg:flex-1">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
            style={{ background: "linear-gradient(135deg,#4dd0e1 0%,#f97316 100%)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
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
              { bg:"#fce4ec", fill:"#e91e63", icon:<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>, title:"Даалгавар илгээх", sub:"Цаг алдалгүй даалгавар оноох, илгээх" },
              { bg:"#e8eaf6", fill:"#7986cb", icon:<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>, title:"Шууд мессеж", sub:"Багш сурагч хоорондоо шууд харилцах" },
              { bg:"#fff8e1", fill:"#fbc02d", icon:<path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>, title:"Үнэлгээ өгөх", sub:"Ажлыг үнэлж, сэтгэгдэл үлдээх" },
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
                <button key={r.value} type="button"
                  onClick={() => { setRole(r.value); reset(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 text-lg font-semibold transition-colors"
                  style={role === r.value ? { background: "#06b6d4", color: "white" } : { background: "white", color: "#6b7280" }}>
                  {r.icon}{r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Student sub-mode toggle */}
              {role === "student" && (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {[{ v:"login", l:"Нэвтрэх" }, { v:"register", l:"Шинэ бүртгэл" }].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => { setStudentMode(v); setError(""); setConfirmPassword(""); }}
                      className="flex-1 py-3 text-base font-semibold transition-colors"
                      style={studentMode === v ? { background: "#e0f7fa", color: "#0891b2" } : { background: "white", color: "#9ca3af" }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* Parent sub-mode toggle */}
              {role === "parent" && (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {[{ v:"login", l:"Нэвтрэх" }, { v:"register", l:"Шинэ бүртгэл" }].map(({ v, l }) => (
                    <button key={v} type="button"
                      onClick={() => { setParentMode(v); setError(""); setConfirmPassword(""); }}
                      className="flex-1 py-3 text-base font-semibold transition-colors"
                      style={parentMode === v ? { background: "#e0f7fa", color: "#0891b2" } : { background: "white", color: "#9ca3af" }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* Student register: school code */}
              {role === "student" && studentMode === "register" && (<>
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Сургуулийн код</label>
                  {inputBox(<>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <input type="text" placeholder="OLULA2025" value={schoolCode} onChange={e=>setSchoolCode(e.target.value.toUpperCase())}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400 uppercase" required/>
                  </>)}
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Анги сонгох</label>
                  <button type="button" onClick={() => setGradeOpen(o => !o)}
                    className="w-full flex items-center justify-between rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                    <span className={`text-lg ${grade ? "text-gray-700 font-semibold" : "text-gray-400"}`}>{grade ? `${grade}-р анги` : "Анги сонгох..."}</span>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#9ca3af"
                      style={{ transform: gradeOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>
                  {gradeOpen && (
                    <div className="grid grid-cols-6 gap-2 mt-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(g => (
                        <button key={g} type="button" onClick={() => { setGrade(g); setGradeOpen(false); }}
                          className="py-3 rounded-lg text-lg font-semibold transition-colors"
                          style={grade === g ? { background: "#06b6d4", color: "white" } : { background: "#f3f4f6", color: "#6b7280" }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Бүлэг</label>
                  <div className="flex gap-2">
                    {sections.map(s => (
                      <button key={s} type="button" onClick={() => setClassSection(s)}
                        className="flex-1 py-3 rounded-xl text-lg font-bold border transition-colors"
                        style={classSection === s ? { background: "#06b6d4", color: "white", borderColor: "#06b6d4" } : { background: "white", color: "#6b7280", borderColor: "#e5e7eb" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Анги багш</label>
                  <div className="rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
                    <select value={teacherGmail} onChange={e=>setTeacherGmail(e.target.value)} required
                      className="bg-transparent w-full text-lg outline-none"
                      style={{ color: teacherGmail ? "#374151" : "#9ca3af" }}>
                      <option value="">Анги багшаа сонгоно уу...</option>
                      {teachers.map(t => <option key={t.gmail} value={t.gmail}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-base font-medium text-gray-600 mb-2">Овог</label>
                    {inputBox(<input type="text" placeholder="Дорж" value={lastName} onChange={e=>setLastName(e.target.value)}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400" required/>)}
                  </div>
                  <div className="flex-1">
                    <label className="block text-base font-medium text-gray-600 mb-2">Нэр</label>
                    {inputBox(<input type="text" placeholder="Болд" value={firstName} onChange={e=>setFirstName(e.target.value)}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400" required/>)}
                  </div>
                </div>
              </>)}

              {/* Parent register: child personal code */}
              {role === "parent" && parentMode === "register" && (
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Хүүхдийн хувийн код</label>
                  {inputBox(<>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    <input type="text" placeholder="AB12CD" value={studentPersonalCode} onChange={e=>setStudentPersonalCode(e.target.value.toUpperCase())}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400 uppercase" required/>
                  </>)}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-base font-medium text-gray-600 mb-2">И-мэйл хаяг</label>
                {inputBox(<>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  <input type="email" placeholder={role === "teacher" ? "bagsh@olula.edu.mn" : "example@gmail.com"}
                    value={gmail} onChange={e=>setGmail(e.target.value)}
                    className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400" required/>
                </>)}
              </div>

              {/* Password */}
              <div>
                <label className="block text-base font-medium text-gray-600 mb-2">Нууц үг</label>
                {inputBox(<>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <input type={showPw ? "text" : "password"} placeholder="Нууц үгээ оруулна уу"
                    value={password} onChange={e=>setPassword(e.target.value)}
                    className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400" required/>
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="text-gray-400 hover:text-gray-600" style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
                    {showPw
                      ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>}
                  </button>
                </>)}
                {role === "teacher" && <p className="text-xs text-gray-400 mt-1">Анх нэвтрэх үед нууц үг тохируулагдана</p>}
              </div>

              {/* Confirm password */}
              {isRegister && (
                <div>
                  <label className="block text-base font-medium text-gray-600 mb-2">Нууц үг давтах</label>
                  <div className="flex items-center gap-3 rounded-xl px-5 py-4"
                    style={{ background: "#f3f4f6", outline: pwNoMatch ? "2px solid #ef4444" : pwMatch ? "2px solid #10b981" : "none" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                    <input type="password" placeholder="Дахин оруулна уу" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                      className="bg-transparent flex-1 text-lg text-gray-700 outline-none placeholder-gray-400" required/>
                    {pwMatch && <span style={{ color:"#10b981", fontSize:20 }}>✓</span>}
                    {pwNoMatch && <span style={{ color:"#ef4444", fontSize:20 }}>✗</span>}
                  </div>
                  {pwNoMatch && <p className="text-sm mt-1" style={{ color:"#ef4444" }}>Нууц үг таарахгүй байна</p>}
                </div>
              )}

              {error && <p className="text-base text-center bg-red-50 rounded-xl py-3 px-4" style={{ color:"#ef4444" }}>{error}</p>}

              <button type="submit" disabled={loading || (isRegister && !!confirmPassword && pwNoMatch)}
                className="w-full py-5 rounded-xl text-white font-bold text-lg transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#06b6d4" }}>
                {loading ? "Түр хүлээнэ үү..." : isRegister ? "Бүртгүүлэх" : "Нэвтрэх →"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}
