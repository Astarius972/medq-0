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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e0f2fe,#f0fdf4)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"white",borderRadius:24,padding:"48px 40px",maxWidth:440,width:"100%",textAlign:"center",boxShadow:"0 8px 40px rgba(0,0,0,0.1)"}}>
        <div style={{width:64,height:64,borderRadius:20,background:"linear-gradient(135deg,#0d9488,#059669)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800,color:"#111827"}}>Бүртгэл амжилттай!</h2>
        <p style={{margin:"0 0 24px",color:"#6b7280",fontSize:14}}>Доорх хувийн кодоо <strong>эцэг эхдээ</strong> өгнө үү</p>
        <div style={{background:"#f0fdf4",border:"2px dashed #10b981",borderRadius:16,padding:"20px 32px",marginBottom:24}}>
          <p style={{margin:"0 0 4px",fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:2}}>Таны хувийн код</p>
          <p style={{margin:0,fontSize:40,fontWeight:900,color:"#0d9488",letterSpacing:"0.25em"}}>{newPersonalCode}</p>
        </div>
        <button onClick={() => router.push("/student")} style={{width:"100%",padding:"14px 0",borderRadius:14,background:"#0d9488",color:"white",fontWeight:700,fontSize:15,border:"none",cursor:"pointer"}}>
          Сурагчийн самбар руу →
        </button>
      </div>
    </div>
  );

  const roles = [
    { value:"student", label:"Сурагч" },
    { value:"teacher", label:"Багш" },
    { value:"parent", label:"Эцэг эх" },
  ];
  const sections = ["А","Б","В","Г","Д"];
  const pwMatch = confirmPassword && password === confirmPassword;
  const pwNoMatch = confirmPassword && password !== confirmPassword;

  return (
    <div style={{minHeight:"100vh",display:"flex",background:"linear-gradient(135deg,#e8f4fd 0%,#f0f9ff 50%,#f8fafc 100%)"}}>

      {/* LEFT PANEL */}
      <div style={{width:"42%",padding:"56px 52px",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:"100vh"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:52}}>
            <div style={{width:44,height:44,borderRadius:12,background:"#0d9488",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
            </div>
            <div>
              <p style={{fontSize:17,fontWeight:800,color:"#111827",margin:0}}>Анги платформ</p>
              <p style={{fontSize:12,color:"#9ca3af",margin:0}}>olula.edu.mn</p>
            </div>
          </div>
          <h1 style={{fontSize:44,fontWeight:900,color:"#111827",lineHeight:1.15,margin:"0 0 20px"}}>
            "Боловсролын<br/>ирээдүйг<br/>хамтдаа<br/>бүтээлцэнэ."
          </h1>
          <p style={{fontSize:16,color:"#6b7280",lineHeight:1.7,maxWidth:320}}>
            Багш, сурагч, эцэг эхийн хооронд шилдэг харилцааг бүтээх орчин үеийн сургалтын систем.
          </p>
        </div>
        <div style={{background:"rgba(255,255,255,0.75)",borderRadius:16,padding:"18px 22px",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",gap:14,border:"1px solid rgba(255,255,255,0.9)"}}>
          <div style={{width:46,height:46,borderRadius:12,background:"#0d9488",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
          </div>
          <div>
            <p style={{fontWeight:700,color:"#111827",margin:0,fontSize:14}}>Монгол сургууль</p>
            <p style={{color:"#6b7280",margin:0,fontSize:12}}>Цахим сургалтын систем</p>
          </div>
          <p style={{marginLeft:"auto",fontSize:11,color:"#9ca3af"}}>© 2024</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 40px 40px 0"}}>
        <div style={{background:"white",borderRadius:24,padding:"40px 36px",width:"100%",maxWidth:480,boxShadow:"0 4px 32px rgba(0,0,0,0.08)"}}>

          {/* Role tabs */}
          <div style={{display:"flex",background:"#f3f4f6",borderRadius:14,padding:4,marginBottom:28,gap:2}}>
            {roles.map(r => (
              <button key={r.value} onClick={() => { setRole(r.value); reset(); }}
                style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,transition:"all 0.15s",
                  background:role===r.value?"white":"transparent",
                  color:role===r.value?"#0d9488":"#9ca3af",
                  boxShadow:role===r.value?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Sub-tabs */}
          {role === "student" && (
            <div style={{display:"flex",borderBottom:"2px solid #f3f4f6",marginBottom:24,gap:24}}>
              {[{v:"login",l:"Нэвтрэх"},{v:"register",l:"Бүртгүүлэх"}].map(({v,l}) => (
                <button key={v} onClick={() => { setStudentMode(v); setError(""); setConfirmPassword(""); }}
                  style={{paddingBottom:12,fontWeight:700,fontSize:14,background:"none",border:"none",cursor:"pointer",
                    color:studentMode===v?"#0d9488":"#9ca3af",
                    borderBottom:studentMode===v?"2px solid #0d9488":"2px solid transparent",
                    marginBottom:-2}}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {role === "parent" && (
            <div style={{display:"flex",borderBottom:"2px solid #f3f4f6",marginBottom:24,gap:24}}>
              {[{v:"login",l:"Нэвтрэх"},{v:"register",l:"Бүртгүүлэх"}].map(({v,l}) => (
                <button key={v} onClick={() => { setParentMode(v); setError(""); setConfirmPassword(""); }}
                  style={{paddingBottom:12,fontWeight:700,fontSize:14,background:"none",border:"none",cursor:"pointer",
                    color:parentMode===v?"#0d9488":"#9ca3af",
                    borderBottom:parentMode===v?"2px solid #0d9488":"2px solid transparent",
                    marginBottom:-2}}>
                  {l}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:16}}>

            {/* Email */}
            <div>
              <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Цахим шуудан</label>
              <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                <input type="email" placeholder={role==="teacher"?"bagsh@olula.edu.mn":"email@gmail.com"}
                  value={gmail} onChange={e=>setGmail(e.target.value)}
                  style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#111827"}} required/>
              </div>
            </div>

            {/* Student register fields */}
            {role==="student" && studentMode==="register" && (<>
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Сургуулийн код</label>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                  <input type="text" placeholder="OLULA2025" value={schoolCode} onChange={e=>setSchoolCode(e.target.value.toUpperCase())}
                    style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#111827",textTransform:"uppercase"}} required/>
                </div>
              </div>
              <div style={{display:"flex",gap:12}}>
                <div style={{flex:1}}>
                  <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Анги</label>
                  <button type="button" onClick={()=>setGradeOpen(o=>!o)}
                    style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px",cursor:"pointer"}}>
                    <span style={{fontSize:14,color:grade?"#111827":"#9ca3af"}}>{grade?`${grade}-р анги`:"Сонгох..."}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#9ca3af" style={{transform:gradeOpen?"rotate(180deg)":"none",transition:"0.2s"}}><path d="M7 10l5 5 5-5z"/></svg>
                  </button>
                  {gradeOpen && <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginTop:6}}>
                    {Array.from({length:12},(_,i)=>i+1).map(g=>(
                      <button key={g} type="button" onClick={()=>{setGrade(g);setGradeOpen(false);}}
                        style={{padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                          background:grade===g?"#0d9488":"#f3f4f6",color:grade===g?"white":"#6b7280"}}>{g}</button>
                    ))}
                  </div>}
                </div>
                <div>
                  <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Бүлэг</label>
                  <div style={{display:"flex",gap:4}}>
                    {sections.map(s=>(
                      <button key={s} type="button" onClick={()=>setClassSection(s)}
                        style={{width:36,height:44,borderRadius:10,border:"1.5px solid",cursor:"pointer",fontSize:13,fontWeight:700,
                          background:classSection===s?"#0d9488":"#f9fafb",
                          color:classSection===s?"white":"#6b7280",
                          borderColor:classSection===s?"#0d9488":"#e5e7eb"}}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Анги багш</label>
                <div style={{background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px"}}>
                  <select value={teacherGmail} onChange={e=>setTeacherGmail(e.target.value)} required
                    style={{width:"100%",background:"none",border:"none",outline:"none",fontSize:14,color:teacherGmail?"#111827":"#9ca3af"}}>
                    <option value="">Анги багшаа сонгоно уу...</option>
                    {teachers.map(t=><option key={t.gmail} value={t.gmail}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:12}}>
                {[{label:"Овог",val:lastName,set:setLastName,ph:"Дорж"},{label:"Нэр",val:firstName,set:setFirstName,ph:"Болд"}].map(f=>(
                  <div key={f.label} style={{flex:1}}>
                    <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>{f.label}</label>
                    <input type="text" placeholder={f.ph} value={f.val} onChange={e=>f.set(e.target.value)} required
                      style={{width:"100%",background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px",fontSize:14,color:"#111827",outline:"none",boxSizing:"border-box"}}/>
                  </div>
                ))}
              </div>
            </>)}

            {/* Parent register */}
            {role==="parent" && parentMode==="register" && (
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Хүүхдийн хувийн код</label>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px"}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <input type="text" placeholder="AB12CD" value={studentPersonalCode} onChange={e=>setStudentPersonalCode(e.target.value.toUpperCase())} required
                    style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#111827",textTransform:"uppercase"}}/>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <label style={{fontSize:13,fontWeight:600,color:"#374151"}}>Нууц үг</label>
                {!isRegister && <span style={{fontSize:12,color:"#0d9488",cursor:"pointer",fontWeight:500}}>Нууц үг мартсан?</span>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"11px 14px"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                <input type={showPw?"text":"password"} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required
                  style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#111827"}}/>
                <button type="button" onClick={()=>setShowPw(p=>!p)} style={{background:"none",border:"none",cursor:"pointer",padding:0,color:"#9ca3af"}}>
                  {showPw
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            {isRegister && (
              <div>
                <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Нууц үг давтах</label>
                <div style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",borderRadius:12,padding:"11px 14px",
                  border:`1.5px solid ${pwNoMatch?"#ef4444":pwMatch?"#10b981":"#e5e7eb"}`}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#9ca3af"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <input type="password" placeholder="Дахин оруулна уу" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required
                    style={{flex:1,background:"none",border:"none",outline:"none",fontSize:14,color:"#111827"}}/>
                  {pwMatch && <span style={{color:"#10b981",fontSize:18}}>✓</span>}
                  {pwNoMatch && <span style={{color:"#ef4444",fontSize:18}}>✗</span>}
                </div>
                {pwNoMatch && <p style={{margin:"4px 0 0",fontSize:12,color:"#ef4444"}}>Нууц үг таарахгүй байна</p>}
                {pwMatch && <p style={{margin:"4px 0 0",fontSize:12,color:"#10b981"}}>Нууц үг таарч байна ✓</p>}
              </div>
            )}

            {!isRegister && (
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,color:"#6b7280"}}>
                <input type="checkbox" style={{accentColor:"#0d9488",width:16,height:16}}/>
                Намайг санах
              </label>
            )}

            {error && <p style={{margin:0,fontSize:13,color:"#ef4444",background:"#fef2f2",padding:"10px 14px",borderRadius:10,textAlign:"center"}}>{error}</p>}

            <button type="submit" disabled={loading || (isRegister && !!confirmPassword && pwNoMatch)}
              style={{padding:"14px 0",borderRadius:14,background:"#0d9488",color:"white",fontWeight:700,fontSize:15,border:"none",cursor:"pointer",
                opacity:loading?0.7:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:4}}>
              {loading ? "Түр хүлээнэ үү..." : isRegister ? "Бүртгүүлэх" : <>Нэвтрэх <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10.02 6L8.61 7.41 13.19 12l-4.58 4.59L10.02 18l6-6-6-6z"/></svg></>}
            </button>

            {role==="teacher" && <p style={{margin:0,textAlign:"center",fontSize:12,color:"#9ca3af"}}>Зөвхөн @olula.edu.mn хаяг. Анх нэвтрэхэд бүртгэл автоматаар үүснэ.</p>}
          </form>

          <p style={{textAlign:"center",fontSize:11,color:"#d1d5db",marginTop:20}}>© 2024 Анги платформ. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </div>
  );
}
