"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [role, setRole] = useState("student");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // student
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

  // parent
  const [parentMode, setParentMode] = useState("login");
  const [studentPersonalCode, setStudentPersonalCode] = useState("");

  useEffect(() => {
    fetch("/api/teachers").then(r => r.json()).then(d => setTeachers(d.teachers || []));
  }, []);

  function reset() {
    setGmail(""); setPassword(""); setConfirmPassword(""); setSchoolCode(""); setGrade(null);
    setLastName(""); setFirstName(""); setTeacherGmail(""); setStudentPersonalCode("");
    setError(""); setNewPersonalCode(""); setClassSection("А");
  }

  function needsConfirm() {
    if (role === "teacher") return true;
    if (role === "student" && studentMode === "register") return true;
    if (role === "parent" && parentMode === "register") return true;
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (needsConfirm() && password !== confirmPassword)
      return setError("Нууц үг таарахгүй байна");
    if (needsConfirm() && password.length < 6)
      return setError("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");

    setLoading(true);
    try {
      if (role === "teacher") {
        const res = await fetch("/api/auth/teacher", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gmail, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("user", JSON.stringify({ ...data.teacher, role: "teacher" }));
        router.push("/teacher");

      } else if (role === "student") {
        const body = studentMode === "login"
          ? { gmail, password }
          : { gmail, password, schoolCode, grade, classSection, teacherGmail, lastName, firstName };

        const res = await fetch("/api/auth/student", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.mode === "registered") {
          setNewPersonalCode(data.personalCode);
          sessionStorage.setItem("user", JSON.stringify({ ...data.student, role: "student", teacherName: data.teacher.name }));
          return;
        }
        sessionStorage.setItem("user", JSON.stringify({ ...data.student, role: "student", teacherName: data.teacher.name }));
        router.push("/student");

      } else {
        const body = parentMode === "login"
          ? { gmail, password }
          : { gmail, password, studentPersonalCode };

        const res = await fetch("/api/auth/parent", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        sessionStorage.setItem("user", JSON.stringify({
          ...data.parent, role: "parent",
          teacherName: data.teacher.name, student: data.student,
        }));
        router.push("/parent");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inp = (children) => (
    <div className="flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "#f3f4f6" }}>
      {children}
    </div>
  );

  const emailIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>;
  const lockIcon = <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>;

  if (newPersonalCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "linear-gradient(135deg,#e0f7fa,#f0fdfd,#fff)" }}>
        <div className="bg-white rounded-3xl shadow-xl p-12 text-center" style={{ maxWidth: 480, width: "100%" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Бүртгэл амжилттай!</h2>
          <p className="text-gray-500 mb-6">Энэ <strong>хувийн кодоо</strong> эцэг эхдээ өгнө үү — тэд энэ кодоор нэвтэрнэ.</p>
          <div className="rounded-2xl py-6 px-8 mb-6" style={{ background: "#f0fdff", border: "2px dashed #06b6d4" }}>
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-widest">Таны хувийн код</p>
            <p className="text-4xl font-black tracking-widest" style={{ color: "#06b6d4", letterSpacing: "0.2em" }}>{newPersonalCode}</p>
          </div>
          <button onClick={() => router.push("/student")}
            className="w-full py-4 rounded-xl text-white font-bold text-lg"
            style={{ background: "#06b6d4" }}>
            Сурагчийн самбар руу →
          </button>
        </div>
      </div>
    );
  }

  const roles = [
    { value: "student", label: "Сурагч", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg> },
    { value: "teacher", label: "Багш", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
    { value: "parent", label: "Эцэг эх", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  ];

  const isRegister = (role === "teacher") || (role === "student" && studentMode === "register") || (role === "parent" && parentMode === "register");
  const sections = ["А", "Б", "В", "Г", "Д"];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "linear-gradient(135deg,#e0f7fa 0%,#f0fdfd 60%,#fff 100%)" }}>
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left branding */}
        <div className="flex flex-col items-center lg:items-start justify-center lg:flex-1">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
            style={{ background: "linear-gradient(135deg,#4dd0e1,#f97316)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black text-gray-900 mb-4 text-center lg:text-left leading-tight">
            Анги платформ<span style={{ color: "#06b6d4" }}>.</span>
          </h1>
          <p className="text-gray-500 text-xl mb-10 max-w-sm text-center lg:text-left leading-relaxed">
            Багш сурагчийн харилцааг хялбаршуулсан орчин үеийн сургалтын систем
          </p>
          {[
            { bg:"#fce4ec", fill:"#e91e63", t:"Даалгавар илгээх", s:"Цаг алдалгүй даалгавар оноох", path:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" },
            { bg:"#e8eaf6", fill:"#7986cb", t:"Шууд мессеж", s:"Багш сурагч хоорондоо харилцах", path:"M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" },
            { bg:"#fff8e1", fill:"#fbc02d", t:"Үнэлгээ өгөх", s:"Ажлыг үнэлж сэтгэгдэл үлдээх", path:"M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" },
          ].map(f => (
            <div key={f.t} className="bg-white rounded-2xl px-6 py-5 flex items-center gap-4 shadow-sm mb-3 w-full max-w-sm">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: f.bg }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={f.fill}><path d={f.path}/></svg>
              </div>
              <div><p className="font-bold text-gray-900">{f.t}</p><p className="text-gray-400 text-sm">{f.s}</p></div>
            </div>
          ))}
        </div>

        {/* Right form */}
        <div className="flex items-start justify-center w-full lg:w-auto">
          <div className="bg-white rounded-3xl shadow-xl p-10" style={{ width: 560, maxWidth: "100%" }}>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-1">Нэвтрэх</h2>
            <p className="text-center text-gray-400 mb-6">Та өөрийн эрхээр нэвтрэнэ үү</p>

            {/* Role tabs */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-6">
              {roles.map(r => (
                <button key={r.value} type="button" onClick={() => { setRole(r.value); reset(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors"
                  style={role === r.value ? { background:"#06b6d4", color:"white" } : { background:"white", color:"#6b7280" }}>
                  {r.icon}{r.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Student sub-mode */}
              {role === "student" && (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {[{v:"login",l:"Нэвтрэх"},{v:"register",l:"Шинэ бүртгэл"}].map(({v,l}) => (
                    <button key={v} type="button" onClick={() => { setStudentMode(v); setError(""); setConfirmPassword(""); }}
                      className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                      style={studentMode===v?{background:"#e0f7fa",color:"#0891b2"}:{background:"white",color:"#9ca3af"}}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* Parent sub-mode */}
              {role === "parent" && (
                <div className="flex rounded-xl overflow-hidden border border-gray-200">
                  {[{v:"login",l:"Нэвтрэх"},{v:"register",l:"Шинэ бүртгэл"}].map(({v,l}) => (
                    <button key={v} type="button" onClick={() => { setParentMode(v); setError(""); setConfirmPassword(""); }}
                      className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                      style={parentMode===v?{background:"#e0f7fa",color:"#0891b2"}:{background:"white",color:"#9ca3af"}}>
                      {l}
                    </button>
                  ))}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">И-мэйл хаяг</label>
                {inp(<>{emailIcon}<input type="email" placeholder={role==="teacher"?"bagsh@olula.edu.mn":"example@gmail.com"}
                  value={gmail} onChange={e=>setGmail(e.target.value)}
                  className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400" required/></>)}
              </div>

              {/* Student register fields */}
              {role === "student" && studentMode === "register" && (<>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Сургуулийн код</label>
                  {inp(<><svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    <input type="text" placeholder="Сургуулийн нэгдсэн код" value={schoolCode}
                      onChange={e=>setSchoolCode(e.target.value.toUpperCase())}
                      className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400 uppercase" required/></>)}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Анги</label>
                    <button type="button" onClick={() => setGradeOpen(o=>!o)}
                      className="w-full flex items-center justify-between rounded-xl px-4 py-3.5 text-sm"
                      style={{ background:"#f3f4f6" }}>
                      <span className={grade?"text-gray-700 font-semibold":"text-gray-400"}>{grade?`${grade}-р анги`:"Анги..."}</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af"
                        style={{transform:gradeOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}>
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                    {gradeOpen && (
                      <div className="grid grid-cols-6 gap-1.5 mt-2">
                        {Array.from({length:12},(_,i)=>i+1).map(g=>(
                          <button key={g} type="button" onClick={()=>{setGrade(g);setGradeOpen(false);}}
                            className="py-2 rounded-lg text-sm font-semibold"
                            style={grade===g?{background:"#06b6d4",color:"white"}:{background:"#f3f4f6",color:"#6b7280"}}>
                            {g}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ width: 100 }}>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Бүлэг</label>
                    <div className="flex gap-1">
                      {sections.map(s=>(
                        <button key={s} type="button" onClick={()=>setClassSection(s)}
                          className="flex-1 py-3.5 rounded-xl text-sm font-bold"
                          style={classSection===s?{background:"#06b6d4",color:"white"}:{background:"#f3f4f6",color:"#6b7280"}}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Анги багш</label>
                  <div className="rounded-xl px-4 py-3.5 text-sm" style={{ background:"#f3f4f6" }}>
                    <select value={teacherGmail} onChange={e=>setTeacherGmail(e.target.value)}
                      className="w-full bg-transparent text-gray-700 outline-none" required>
                      <option value="">Анги багшаа сонгоно уу...</option>
                      {teachers.map(t=>(
                        <option key={t.gmail} value={t.gmail}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Овог</label>
                    {inp(<input type="text" placeholder="Овог" value={lastName} onChange={e=>setLastName(e.target.value)}
                      className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400" required/>)}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Нэр</label>
                    {inp(<input type="text" placeholder="Нэр" value={firstName} onChange={e=>setFirstName(e.target.value)}
                      className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400" required/>)}
                  </div>
                </div>
              </>)}

              {/* Parent register: student personal code */}
              {role === "parent" && parentMode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Хүүхдийн хувийн код</label>
                  {inp(<>{lockIcon}<input type="text" placeholder="Хүүхдийн өгсөн хувийн код"
                    value={studentPersonalCode} onChange={e=>setStudentPersonalCode(e.target.value.toUpperCase())}
                    className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400 uppercase" required/></>)}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Нууц үг</label>
                {inp(<>{lockIcon}<input type="password" placeholder="Нууц үг"
                  value={password} onChange={e=>setPassword(e.target.value)}
                  className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400" required/></>)}
              </div>

              {/* Confirm password */}
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Нууц үг давтах</label>
                  {inp(<>{lockIcon}<input type="password" placeholder="Нууц үгийг дахин оруулна уу"
                    value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                    className="bg-transparent flex-1 text-base text-gray-700 outline-none placeholder-gray-400" required/></>)}
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-red-500 mt-1">Нууц үг таарахгүй байна</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-xs text-green-500 mt-1">✓ Нууц үг таарч байна</p>
                  )}
                </div>
              )}

              {error && <p className="text-red-500 text-sm text-center bg-red-50 rounded-xl py-3 px-4">{error}</p>}

              <button type="submit" disabled={loading || (isRegister && password !== confirmPassword && !!confirmPassword)}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background:"#06b6d4" }}>
                {loading ? "Түр хүлээнэ үү..." : isRegister ? "Бүртгүүлэх" : "Нэвтрэх"}
              </button>

              {role === "teacher" && (
                <p className="text-xs text-gray-400 text-center">Анх нэвтрэхэд бүртгэл автоматаар үүснэ. Зөвхөн @olula.edu.mn хаяг.</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
