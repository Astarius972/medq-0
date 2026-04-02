"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fmtDate, isPast, relTime } from "@/lib/formatters";

// ── helpers ──────────────────────────────────────────────
function schoolYear() {
  const y = new Date().getFullYear();
  return new Date().getMonth() >= 8 ? `${y}–${y+1}` : `${y-1}–${y}`;
}
function sName(s) {
  if (!s) return "";
  return s.lastName && s.firstName ? `${s.lastName} ${s.firstName}` : s.gmail?.split("@")[0] || "";
}
function sInitials(s) {
  if (!s) return "?";
  return s.lastName && s.firstName ? (s.lastName[0]+s.firstName[0]).toUpperCase() : (s.gmail||"?")[0].toUpperCase();
}

// ── SVG line chart ────────────────────────────────────────
function LineChart({ points }) {
  if (!points.length) return <div style={{height:120,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{color:"#d1d5db",fontSize:13}}>Мэдээлэл хүрэлцэхгүй</p></div>;
  const W=340, H=100, pad=10;
  const xs = points.map((_,i)=> pad + i*(W-pad*2)/(Math.max(points.length-1,1)));
  const min=Math.max(0,Math.min(...points.map(p=>p.score))-10);
  const max=Math.min(100,Math.max(...points.map(p=>p.score))+10);
  const ys = points.map(p=>H-pad-(p.score-min)/(max-min||1)*(H-pad*2));
  const d="M"+xs.map((x,i)=>`${x},${ys[i]}`).join("L");
  const fill=d+`L${xs[xs.length-1]},${H}L${xs[0]},${H}Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:100}}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3"/>
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#lg)"/>
      <path d={d} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {xs.map((x,i)=>(
        <circle key={i} cx={x} cy={ys[i]} r="4" fill="white" stroke="#7c3aed" strokeWidth="2"/>
      ))}
    </svg>
  );
}

const COLORS = ["#7c3aed","#06b6d4","#f97316","#10b981","#ef4444","#f59e0b"];
function teacherColor(gmail) {
  let n=0; for(let c of (gmail||"")) n+=c.charCodeAt(0);
  return COLORS[n%COLORS.length];
}

export default function ParentDashboard() {
  const [user, setUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { router.push("/"); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "parent") { router.push("/"); return; }
    setUser(parsed);

    const s = parsed.student;
    if (!s) return;

    Promise.all([
      fetch(`/api/assignments?grade=${s.grade}`).then(r=>r.json()),
      fetch(`/api/submissions?studentGmail=${encodeURIComponent(s.gmail)}`).then(r=>r.json()),
      fetch("/api/teachers").then(r=>r.json()),
    ]).then(([aD,sD,tD]) => {
      setAssignments(aD.assignments||[]);
      setSubmissions(sD.submissions||[]);
      setTeachers(tD.teachers||[]);
    });
  }, [router]);

  function logout() { sessionStorage.removeItem("user"); router.push("/"); }
  if (!user) return null;

  const student = user.student || {};
  const studentName = sName(student);
  const initials = sInitials(student);

  const total = assignments.length;
  const submitted = submissions.length;
  const pending = assignments.filter(a=>!isPast(a.deadline)&&!submissions.find(s=>s.assignmentId===a.id)).length;
  const gradedSubs = submissions.filter(s=>s.score!==null);
  const avgScore = gradedSubs.length ? Math.round(gradedSubs.reduce((a,s)=>a+s.score,0)/gradedSubs.length) : null;

  // score trend points (last 8 graded, chronological)
  const trendPoints = [...gradedSubs]
    .sort((a,b)=>new Date(a.gradedAt)-new Date(b.gradedAt))
    .slice(-8).map((s,i)=>({score:s.score,i}));

  // per-teacher subject progress (avg score per teacher)
  const byTeacher = {};
  gradedSubs.forEach(sub=>{
    const asgn = assignments.find(a=>a.id===sub.assignmentId);
    if(!asgn) return;
    if(!byTeacher[asgn.teacherGmail]) byTeacher[asgn.teacherGmail]={scores:[],name:""};
    byTeacher[asgn.teacherGmail].scores.push(sub.score);
  });
  teachers.forEach(t=>{ if(byTeacher[t.gmail]) byTeacher[t.gmail].name=t.name; });
  const teacherProgress = Object.entries(byTeacher).map(([gmail,d])=>({
    gmail, name: d.name||gmail.split("@")[0],
    avg: Math.round(d.scores.reduce((a,b)=>a+b,0)/d.scores.length),
    color: teacherColor(gmail),
  })).sort((a,b)=>b.avg-a.avg);

  // upcoming assignments
  const upcoming = assignments
    .filter(a=>!isPast(a.deadline))
    .sort((a,b)=>new Date(a.deadline)-new Date(b.deadline))
    .slice(0,3);

  const scoreColor = (s) => s>=80?"#7c3aed":s>=60?"#06b6d4":"#f97316";

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",display:"flex"}}>

      {/* Sidebar */}
      <div style={{width:240,background:"linear-gradient(180deg,#7c3aed,#6d28d9)",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"24px 16px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,margin:"0 0 2px",textTransform:"uppercase",letterSpacing:1}}>Эцэг эхийн самбар</p>
          <p style={{color:"white",fontSize:13,fontWeight:600,margin:0}}>Сурлагын платформ</p>
        </div>

        {/* Student card in sidebar */}
        <div style={{margin:"16px 12px",padding:"12px",borderRadius:12,background:"rgba(255,255,255,0.1)"}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:16,marginBottom:8}}>
            {initials}
          </div>
          <p style={{color:"white",fontWeight:700,fontSize:13,margin:"0 0 2px"}}>{studentName||"Сурагч"}</p>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,margin:0}}>{student.grade}-р анги {student.classSection && `· ${student.classSection} бүлэг`}</p>
        </div>

        <nav style={{padding:"8px 12px",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.2)",color:"white",fontWeight:600,fontSize:13,cursor:"pointer"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            Хяналтын самбар
          </div>
        </nav>

        <div style={{margin:"0 12px 16px",padding:"10px 12px",borderRadius:10,background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{minWidth:0}}>
            <p style={{color:"white",fontWeight:600,fontSize:12,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.gmail}</p>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,margin:0}}>Эцэг эх</p>
          </div>
          <button onClick={logout} title="Гарах" style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.7)",padding:4,flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Top bar */}
        <div style={{background:"white",padding:"16px 28px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#111827"}}>Сайн байна уу, {user.gmail.split("@")[0]}!</h1>
            <p style={{margin:0,fontSize:13,color:"#9ca3af"}}>Таны хүүгийн сурлагын мэдээлэл</p>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>

          {/* Student banner */}
          <div style={{borderRadius:20,padding:"24px 28px",marginBottom:24,background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:16}}>
              <div style={{width:56,height:56,borderRadius:16,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:20}}>
                {initials}
              </div>
              <div>
                <p style={{margin:"0 0 2px",color:"rgba(255,255,255,0.7)",fontSize:11,textTransform:"uppercase",letterSpacing:1}}>Хяналт тавьж буй сурагч</p>
                <p style={{margin:"0 0 4px",color:"white",fontWeight:900,fontSize:22}}>{studentName}</p>
                <p style={{margin:0,color:"rgba(255,255,255,0.7)",fontSize:13}}>
                  {student.grade}-р анги{student.classSection&&` · ${student.classSection} бүлэг`} · {schoolYear()} хичээлийн жил
                </p>
              </div>
            </div>
            <div style={{display:"flex",gap:32,textAlign:"right"}}>
              {avgScore!==null&&<div>
                <p style={{margin:0,color:"#fbbf24",fontSize:22,fontWeight:900}}>★ {avgScore}%</p>
                <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:12}}>Дундаж оноо</p>
              </div>}
              <div>
                <p style={{margin:0,color:"white",fontSize:22,fontWeight:900}}>{submitted}</p>
                <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:12}}>Дууссан даалгавар</p>
              </div>
              <div>
                <p style={{margin:0,color:"#fb923c",fontSize:22,fontWeight:900}}>{pending}</p>
                <p style={{margin:0,color:"rgba(255,255,255,0.6)",fontSize:12}}>Хүлээгдэж буй</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
            {[
              {label:"Хичээлийн тоо",value:teacherProgress.length||Object.keys(byTeacher).length||"—",sub:"Энэ улирал",icon:"M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z",bg:"#ede9fe",fill:"#7c3aed"},
              {label:"Хүлээгдэж буй",value:pending,sub:"Даалгавар",icon:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z",bg:"#fff7ed",fill:"#f97316"},
              {label:"Дууссан",value:submitted,sub:"Даалгавар",icon:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",bg:"#ecfdf5",fill:"#10b981"},
              {label:"Дундаж үнэлгээ",value:avgScore!==null?`${avgScore}%`:"—",sub:avgScore!==null&&avgScore>=80?"+Маш сайн":"",icon:"M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",bg:"#ede9fe",fill:"#7c3aed"},
            ].map((s,i)=>(
              <div key={i} style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <p style={{margin:"0 0 4px",fontSize:12,color:"#9ca3af"}}>{s.label}</p>
                  <p style={{margin:0,fontSize:28,fontWeight:900,color:"#111827",lineHeight:1}}>{s.value}</p>
                  {s.sub&&<p style={{margin:"4px 0 0",fontSize:11,color:"#9ca3af"}}>{s.sub}</p>}
                </div>
                <div style={{width:44,height:44,borderRadius:12,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={s.fill}><path d={s.icon}/></svg>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}}>

            {/* Left column */}
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* All assignments with grades */}
              <div style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <p style={{margin:0,fontWeight:700,fontSize:15,color:"#111827"}}>Даалгаврын үнэлгээ</p>
                  <span style={{background:"#ede9fe",color:"#7c3aed",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99}}>{assignments.length} нийт</span>
                </div>
                {assignments.length===0?(
                  <p style={{textAlign:"center",color:"#d1d5db",fontSize:13,padding:"24px 0",margin:0}}>Даалгавар байхгүй</p>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {[...assignments].sort((a,b)=>new Date(b.deadline)-new Date(a.deadline)).map(a=>{
                      const sub=submissions.find(s=>s.assignmentId===a.id);
                      const tName=teachers.find(t=>t.gmail===a.teacherGmail)?.name||a.teacherGmail?.split("@")[0]||"Багш";
                      const color=teacherColor(a.teacherGmail);
                      const past=isPast(a.deadline);
                      return(
                        <div key={a.id} style={{padding:"14px 16px",borderRadius:12,background:"#fafafa",border:"1px solid #f1f5f9",borderLeft:`3px solid ${color}`}}>
                          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.title}</p>
                              <p style={{margin:"2px 0 0",fontSize:12,color:"#9ca3af"}}>{tName} · {fmtDate(a.deadline)}</p>
                            </div>
                            <div style={{flexShrink:0,textAlign:"right"}}>
                              {sub?.score!==null&&sub?.score!==undefined?(
                                <>
                                  <p style={{margin:0,fontSize:22,fontWeight:900,color:scoreColor(sub.score)}}>{sub.score}%</p>
                                  <p style={{margin:0,fontSize:10,color:"#9ca3af"}}>{a.points} оноо</p>
                                </>
                              ):sub?(
                                <span style={{background:"#dcfce7",color:"#16a34a",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>✓ Илгээсэн</span>
                              ):past?(
                                <span style={{background:"#fee2e2",color:"#ef4444",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>Илгээгээгүй</span>
                              ):(
                                <span style={{background:"#fff7ed",color:"#f97316",fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:99}}>Хүлээгдэж буй</span>
                              )}
                            </div>
                          </div>
                          {sub?.score!==null&&sub?.score!==undefined&&(
                            <div style={{height:5,borderRadius:99,background:"#f1f5f9",overflow:"hidden",marginTop:10}}>
                              <div style={{height:"100%",borderRadius:99,width:`${sub.score}%`,background:scoreColor(sub.score)}}/>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={{display:"flex",flexDirection:"column",gap:20}}>

              {/* Trend chart */}
              <div style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#7c3aed"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                  <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111827"}}>Хичээлийн амжилтын чиг хандлага</p>
                </div>
                <LineChart points={trendPoints}/>
                {trendPoints.length>0&&(
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
                    <p style={{margin:0,fontSize:11,color:"#9ca3af"}}>{trendPoints.length} долоо хоногийн дундаж</p>
                    {trendPoints.length>=2&&(
                      <p style={{margin:0,fontSize:11,color:trendPoints[trendPoints.length-1].score>trendPoints[0].score?"#10b981":"#ef4444",fontWeight:600}}>
                        {trendPoints[trendPoints.length-1].score>trendPoints[0].score?"↑":"↓"} {Math.abs(trendPoints[trendPoints.length-1].score-trendPoints[0].score)} оноо
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming */}
              <div style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                  <p style={{margin:0,fontWeight:700,fontSize:14,color:"#111827"}}>Удахгүй болох даалгавар</p>
                </div>
                {upcoming.length===0?(
                  <p style={{color:"#d1d5db",fontSize:12,textAlign:"center",padding:"12px 0",margin:0}}>Даалгавар байхгүй</p>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {upcoming.map(a=>{
                      const daysLeft=Math.ceil((new Date(a.deadline)-new Date())/(1000*60*60*24));
                      const urgent=daysLeft<=3;
                      const t=teachers.find(t=>t.gmail===a.teacherGmail);
                      return(
                        <div key={a.id} style={{padding:"10px 12px",borderRadius:10,background:"#fafafa",borderLeft:`3px solid ${teacherColor(a.teacherGmail)}`}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <p style={{margin:0,fontWeight:600,fontSize:13,color:"#111827"}}>{a.title}</p>
                            {urgent&&<span style={{background:"#fef2f2",color:"#ef4444",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99}}>Яаралтай</span>}
                          </div>
                          <p style={{margin:"3px 0 0",fontSize:11,color:"#9ca3af"}}>{t?.name||a.teacherGmail.split("@")[0]} · {fmtDate(a.deadline)}</p>
                          <p style={{margin:"2px 0 0",fontSize:11,color:urgent?"#ef4444":"#9ca3af"}}>{daysLeft} өдөр үлдлээ</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Per-teacher progress */}
              {teacherProgress.length>0&&(
                <div style={{background:"white",borderRadius:16,padding:"20px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                  <p style={{margin:"0 0 14px",fontWeight:700,fontSize:14,color:"#111827"}}>Хичээл тус бүрийн явц</p>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {teacherProgress.map(tp=>(
                      <div key={tp.gmail}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <div>
                            <p style={{margin:0,fontSize:13,fontWeight:600,color:"#111827"}}>{tp.name}</p>
                          </div>
                          <span style={{fontSize:14,fontWeight:800,color:tp.color}}>{tp.avg}%</span>
                        </div>
                        <div style={{height:7,borderRadius:99,background:"#f1f5f9",overflow:"hidden"}}>
                          <div style={{height:"100%",borderRadius:99,width:`${tp.avg}%`,background:tp.color,transition:"width 0.6s"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
