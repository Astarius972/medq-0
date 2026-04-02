"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { isPast, fmtDate, fmtDateTime, relTime } from "@/lib/formatters";

const AVATAR_COLORS = ["#f97316","#06b6d4","#8b5cf6","#10b981","#f59e0b","#ef4444","#3b82f6","#ec4899"];
function avatarColor(str) {
  if (!str) return AVATAR_COLORS[0];
  let n = 0; for (let i = 0; i < str.length; i++) n += str.charCodeAt(i);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(s) {
  if (s.lastName && s.firstName) return (s.lastName[0] + s.firstName[0]).toUpperCase();
  return (s.gmail || "?")[0].toUpperCase();
}
function displayName(s) {
  if (s.lastName && s.firstName) return `${s.lastName[0]}.${s.firstName}`;
  return s.gmail.split("@")[0];
}

const NAV = [
  { key:"dashboard", label:"Хяналтын самбар", badge:null, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> },
  { key:"assignments", label:"Даалгаврууд", badge:null, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> },
  { key:"students", label:"Сурагчид", badge:null, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  { key:"chat", label:"Чат", badge:null, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg> },
  { key:"research", label:"AI Судалгаа", badge:null, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5 2.5 2.5 0 0 0 7.5 18a2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 7.5 13m9 0a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 0 2.5-2.5A2.5 2.5 0 0 0 16.5 13z"/></svg> },
];

const EMPTY_FORM = { title:"", description:"", grade:"", deadline:"", points:100, imageUrl:"" };

function NotifCard({ n, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 320); }, 4700);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [onClose]);
  const name = n.student ? displayName(n.student) : "Сурагч";
  const color = n.student ? avatarColor(n.student.gmail) : "#f97316";
  const init = n.student ? initials(n.student) : "?";
  return (
    <div style={{
      transform: visible ? "translateX(0)" : "translateX(calc(100% + 20px))",
      opacity: visible ? 1 : 0,
      transition: "transform 0.32s cubic-bezier(.22,.68,0,1.2), opacity 0.32s ease",
      background: "#1b2838",
      borderRadius: 10,
      padding: "12px 14px",
      width: 300,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      borderLeft: "3px solid #f97316",
      cursor: "pointer",
    }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"bold", fontSize:14, flexShrink:0 }}>{init}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:"#acb2b8", fontSize:10, marginBottom:2, textTransform:"uppercase", letterSpacing:1 }}>Шинэ илгээлт</p>
        <p style={{ color:"white", fontWeight:700, fontSize:14, lineHeight:1.3 }}>{name}</p>
        <p style={{ color:"#8f98a0", fontSize:12, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.assignment?.title || "Даалгавар"}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 320); }}
        style={{ color:"#8f98a0", background:"none", border:"none", cursor:"pointer", fontSize:16, lineHeight:1, padding:4 }}>✕</button>
    </div>
  );
}

function ChatNotifCard({ n, onClose }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => { setVisible(false); setTimeout(onClose, 320); }, 4700);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); };
  }, [onClose]);
  const name = n.student ? displayName(n.student) : "Сурагч";
  const color = n.student ? avatarColor(n.student.gmail) : "#06b6d4";
  const init = n.student ? initials(n.student) : "?";
  return (
    <div style={{
      transform: visible ? "translateX(0)" : "translateX(calc(100% + 20px))",
      opacity: visible ? 1 : 0,
      transition: "transform 0.32s cubic-bezier(.22,.68,0,1.2), opacity 0.32s ease",
      background: "#1b2838",
      borderRadius: 10,
      padding: "12px 14px",
      width: 300,
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      borderLeft: "3px solid #06b6d4",
    }}>
      <div style={{ width:40, height:40, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:"bold", fontSize:14, flexShrink:0 }}>{init}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:"#acb2b8", fontSize:10, marginBottom:2, textTransform:"uppercase", letterSpacing:1 }}>Шинэ мессеж</p>
        <p style={{ color:"white", fontWeight:700, fontSize:14, lineHeight:1.3 }}>{name}</p>
        <p style={{ color:"#8f98a0", fontSize:12, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{n.text}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 320); }}
        style={{ color:"#8f98a0", background:"none", border:"none", cursor:"pointer", fontSize:16, lineHeight:1, padding:4 }}>✕</button>
    </div>
  );
}

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // inline login state
  const [loginGmail, setLoginGmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginPw2, setLoginPw2] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // assignments state
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // grade modal
  const [gradeTarget, setGradeTarget] = useState(null);
  const [gradeInput, setGradeInput] = useState("");
  const [grading, setGrading] = useState(false);

  // all submissions (for dashboard + polling)
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const seenIds = useRef(new Set());
  const studentsRef = useRef([]);
  const assignmentsRef = useRef([]);

  // search in assignments submissions list
  const [subSearch, setSubSearch] = useState("");

  // chat
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedChatStudent, setSelectedChatStudent] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);
  const [chatNotifications, setChatNotifications] = useState([]);
  const seenMsgIds = useRef(new Set());
  const selectedChatStudentRef = useRef(null);

  // research
  const [researchTopic, setResearchTopic] = useState("");
  const [researchResult, setResearchResult] = useState(null);
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState("");
  const [savedTopics, setSavedTopics] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) { setShowLogin(true); return; }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "teacher") { setShowLogin(true); return; }
    fetch("/api/school-code").then(r=>r.json()).then(d=>{
      parsed.schoolCode = d.code;
      setUser({...parsed});
      sessionStorage.setItem("user", JSON.stringify({...parsed}));
    });
    setUser(parsed);
    fetch(`/api/codes?gmail=${encodeURIComponent(parsed.gmail)}`)
      .then(r => r.json()).then(d => setStudents(d.students || []));
  }, []);

  const loadAssignments = useCallback((gmail) => {
    fetch(`/api/assignments?teacherGmail=${encodeURIComponent(gmail)}`)
      .then(r => r.json()).then(d => setAssignments(d.assignments || []));
  }, []);

  useEffect(() => {
    if (user && activeNav === "assignments") loadAssignments(user.gmail);
  }, [user, activeNav, loadAssignments]);

  useEffect(() => {
    if (!selectedAssignment) return;
    setLoadingSubs(true);
    fetch(`/api/submissions?assignmentId=${selectedAssignment.id}`)
      .then(r => r.json()).then(d => { setSubmissions(d.submissions || []); setLoadingSubs(false); });
    const iv = setInterval(() =>
      fetch(`/api/submissions?assignmentId=${selectedAssignment.id}`)
        .then(r => r.json()).then(d => setSubmissions(d.submissions || []))
    , 5000);
    return () => clearInterval(iv);
  }, [selectedAssignment]);

  // keep refs current to avoid stale closures in polling interval
  useEffect(() => { studentsRef.current = students; }, [students]);
  useEffect(() => { selectedChatStudentRef.current = selectedChatStudent; }, [selectedChatStudent]);
  useEffect(() => { assignmentsRef.current = assignments; }, [assignments]);

  const loadAllSubmissions = useCallback((gmail) =>
    fetch(`/api/submissions?teacherGmail=${encodeURIComponent(gmail)}`).then(r => r.json()).then(d => d.submissions || [])
  , []);

  // seed then poll every 10s — single effect so seeding always completes before first poll
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    let iv = null;
    loadAllSubmissions(user.gmail).then(subs => {
      if (!mounted) return;
      subs.forEach(s => seenIds.current.add(s.id));
      setAllSubmissions(subs);
      iv = setInterval(() => {
        loadAllSubmissions(user.gmail).then(subs2 => {
          if (!mounted) return;
          const fresh = subs2.filter(s => !seenIds.current.has(s.id));
          fresh.forEach(sub => {
            seenIds.current.add(sub.id);
            const student = studentsRef.current.find(s => s.gmail === sub.studentGmail);
            const assignment = assignmentsRef.current.find(a => a.id === sub.assignmentId);
            const nid = sub.id;
            setNotifications(prev => [...prev, { nid, student, assignment }]);
            setTimeout(() => setNotifications(prev => prev.filter(n => n.nid !== nid)), 5500);
          });
          setAllSubmissions(subs2);
        });
      }, 10000);
    });
    return () => { mounted = false; clearInterval(iv); };
  }, [user, loadAllSubmissions]);

  function copyCode() {
    if (!user?.schoolCode) return;
    navigator.clipboard.writeText(user.schoolCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  function logout() { sessionStorage.removeItem("user"); router.push("/"); }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError(""); setCreating(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.error);
        imageUrl = upData.url;
      }
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, teacherGmail: user.gmail, points: Number(form.points), imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCreate(false); setForm(EMPTY_FORM); setImageFile(null); setImagePreview("");
      loadAssignments(user.gmail);
    } catch(err) { setCreateError(err.message); }
    finally { setCreating(false); }
  }

  async function handleGrade(e) {
    e.preventDefault();
    setGrading(true);
    try {
      const res = await fetch(`/api/submissions/${gradeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: Number(gradeInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmissions(prev => prev.map(s => s.id === gradeTarget.id ? data.submission : s));
      setAllSubmissions(prev => prev.map(s => s.id === gradeTarget.id ? data.submission : s));
      setGradeTarget(null); setGradeInput("");
      loadAssignments(user.gmail);
    } catch(err) { alert(err.message); }
    finally { setGrading(false); }
  }

  // chat
  const loadChat = useCallback((teacherGmail, studentGmail) => {
    fetch(`/api/chat?teacherGmail=${encodeURIComponent(teacherGmail)}&studentGmail=${encodeURIComponent(studentGmail)}`)
      .then(r => r.json()).then(d => setChatMessages(d.messages || []));
  }, []);

  useEffect(() => {
    if (!user || !selectedChatStudent) return;
    setChatMessages([]);
    loadChat(user.gmail, selectedChatStudent.gmail);
    const iv = setInterval(() => loadChat(user.gmail, selectedChatStudent.gmail), 3000);
    return () => clearInterval(iv);
  }, [user, selectedChatStudent, loadChat]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMessages]);

  // grouped students for chat sidebar + background chat notifications
  const [allChatMessages, setAllChatMessages] = useState([]);
  useEffect(() => {
    if (!user) return;
    const load = (isFirst) => fetch(`/api/chat?teacherGmail=${encodeURIComponent(user.gmail)}`)
      .then(r => r.json()).then(d => {
        const msgs = d.messages || [];
        if (isFirst) {
          msgs.forEach(m => seenMsgIds.current.add(m.id));
        } else {
          const fresh = msgs.filter(m => !seenMsgIds.current.has(m.id) && m.fromGmail !== user.gmail);
          fresh.forEach(m => {
            seenMsgIds.current.add(m.id);
            const student = studentsRef.current.find(s => s.gmail === m.fromGmail);
            const nid = m.id;
            // don't notify if already viewing that student's chat
            if (selectedChatStudentRef.current?.gmail === m.fromGmail && activeNav === "chat") return;
            setChatNotifications(prev => [...prev, { nid, student, text: m.text }]);
            setTimeout(() => setChatNotifications(prev => prev.filter(n => n.nid !== nid)), 5000);
          });
        }
        setAllChatMessages(msgs);
      });
    load(true);
    const iv = setInterval(() => load(false), 5000);
    return () => clearInterval(iv);
  }, [user, activeNav]);

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChatStudent) return;
    setChatSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromGmail: user.gmail, toGmail: selectedChatStudent.gmail, text: chatInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChatMessages(prev => [...prev, data.message]);
      setChatInput("");
    } finally { setChatSending(false); }
  }

  // top 4 students by average score
  const topStudents = useMemo(() => {
    return students
      .map(st => {
        const scored = allSubmissions.filter(s => s.studentGmail === st.gmail && s.score !== null);
        const avg = scored.length > 0 ? Math.round(scored.reduce((sum, s) => sum + s.score, 0) / scored.length) : null;
        return { ...st, avgScore: avg };
      })
      .sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1))
      .slice(0, 4);
  }, [students, allSubmissions]);

  // students who have messaged the teacher
  const chatStudents = useMemo(() => {
    const seen = new Set();
    return students.filter(st => {
      const hasMsg = allChatMessages.some(m => m.fromGmail === st.gmail || m.toGmail === st.gmail);
      if (hasMsg && !seen.has(st.gmail)) { seen.add(st.gmail); return true; }
      return false;
    });
  }, [students, allChatMessages]);

  // chat badge: students with unread (last message from student, no reply after)
  const chatBadge = useMemo(() => {
    const count = students.filter(st => {
      const convo = allChatMessages
        .filter(m => m.fromGmail === st.gmail || m.toGmail === st.gmail)
        .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
      return convo.length > 0 && convo[0].fromGmail === st.gmail;
    }).length;
    return count || null;
  }, [students, allChatMessages]);

  async function handleTeacherLogin(e) {
    e.preventDefault();
    setLoginError("");
    if (!loginGmail.trim() || !loginPw.trim()) { setLoginError("И-мэйл болон нууц үгийг бөглөнө үү"); return; }
    if (loginPw !== loginPw2) { setLoginError("Нууц үг таарахгүй байна"); return; }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmail: loginGmail, password: loginPw }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || "Алдаа гарлаа"); return; }
      const u = { ...data.teacher, role: "teacher" };
      const scRes = await fetch("/api/school-code");
      const scData = await scRes.json();
      u.schoolCode = scData.code;
      sessionStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      setShowLogin(false);
      fetch(`/api/codes?gmail=${encodeURIComponent(u.gmail)}`)
        .then(r => r.json()).then(d => setStudents(d.students || []));
    } catch { setLoginError("Сүлжээний алдаа гарлаа"); }
    finally { setLoginLoading(false); }
  }

  if (showLogin && !user) {
    const pwMatch = loginPw && loginPw2 && loginPw === loginPw2;
    const pwNoMatch = loginPw && loginPw2 && loginPw !== loginPw2;
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/></svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>Багшийн нэвтрэх</h1>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>@olula.edu.mn и-мэйлээр нэвтрэнэ үү</p>
          </div>
          <form onSubmit={handleTeacherLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>И-мэйл хаяг</label>
              <input type="email" placeholder="name@olula.edu.mn" value={loginGmail}
                onChange={e => setLoginGmail(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", color: "#111827", background: "#f9fafb", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Нууц үг</label>
              <input type="password" placeholder="Нууц үг" value={loginPw}
                onChange={e => setLoginPw(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 14, outline: "none", color: "#111827", background: "#f9fafb", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Нууц үг давтах</label>
              <input type="password" placeholder="Нууц үгийг дахин оруулна уу" value={loginPw2}
                onChange={e => setLoginPw2(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${pwNoMatch ? "#ef4444" : pwMatch ? "#10b981" : "#e5e7eb"}`, fontSize: 14, outline: "none", color: "#111827", background: "#f9fafb", boxSizing: "border-box" }} />
              {pwNoMatch && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#ef4444" }}>Нууц үг таарахгүй байна</p>}
              {pwMatch && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#10b981" }}>Нууц үг таарч байна</p>}
            </div>
            {loginError && <p style={{ margin: 0, fontSize: 13, color: "#ef4444", background: "#fef2f2", padding: "10px 14px", borderRadius: 10 }}>{loginError}</p>}
            <button type="submit" disabled={loginLoading}
              style={{ padding: "12px 0", borderRadius: 12, fontWeight: 700, fontSize: 15, color: "white", background: "#f97316", border: "none", cursor: "pointer", opacity: loginLoading ? 0.7 : 1, marginTop: 4 }}>
              {loginLoading ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </button>
            <p style={{ margin: 0, textAlign: "center", fontSize: 12, color: "#9ca3af" }}>Анх удаа нэвтрэх үед нууц үг тохируулагдана</p>
          </form>
        </div>
      </div>
    );
  }

  if (!user) return null;
  const teacherInitial = (user.name || user.gmail)[0].toUpperCase();
  const teacherDisplay = user.name || user.gmail.split("@")[0];

  return (
    <div className="flex" style={{ background:"#f8f9fa", height:"100vh", overflow:"hidden", color:"#111827" }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0" style={{ background:"#f97316" }}>
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0" style={{ background:"rgba(255,255,255,0.25)", color:"white" }}>
            {teacherInitial}
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Багшийн самбар</p>
            <p className="text-orange-200 text-xs">Сурлатын платформ</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {NAV.map(item => {
            const active = activeNav === item.key;
            const badge = item.key === "assignments" ? (assignments.filter(a => !isPast(a.deadline)).length || null)
              : item.key === "chat" ? chatBadge : item.badge;
            return (
              <button key={item.key} onClick={() => setActiveNav(item.key)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
                style={active ? { background:"white", color:"#f97316" } : { background:"transparent", color:"rgba(255,255,255,0.85)" }}>
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={active ? { background:"#f97316", color:"white" } : { background:"rgba(255,255,255,0.25)", color:"white" }}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mx-3 mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background:"rgba(255,255,255,0.15)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0" style={{ background:"rgba(255,255,255,0.9)", color:"#f97316" }}>
            {teacherInitial}{teacherInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{teacherDisplay}</p>
            <p className="text-orange-200 text-xs">Багш</p>
          </div>
          <button onClick={logout} title="Гарах">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.7)">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white px-8 py-4 flex items-center justify-between shrink-0 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Сайн байна уу, {teacherDisplay}!</h1>
            <p className="text-sm text-gray-400">Өнөөдөр ажлаа амжилттай явуулаарай</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"#f3f4f6" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#6b7280"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">

          {/* ===== DASHBOARD ===== */}
          {activeNav === "dashboard" && (
            <div className="px-8 py-6">
              <div className="grid grid-cols-4 gap-5 mb-6">
                {[
                  { label:"Нийт сурагч", value:students.length, sub:`+${students.length} энэ сард`, bg:"#fff7ed", fill:"#f97316", icon:<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/> },
                  { label:"Идэвхтэй даалгавар", value:assignments.filter(a=>!isPast(a.deadline)).length, sub:"Нийт даалгавар", bg:"#eff6ff", fill:"#3b82f6", icon:<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/> },
                  { label:"Үнэлсэн даалгавар", value:0, sub:"Энэ сард", bg:"#f0fdf4", fill:"#10b981", icon:<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/> },
                  { label:"Дундаж амжилт", value:"—", sub:"Өгөгдөл алга", bg:"#fafafa", fill:"#6b7280", icon:<path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/> },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                      <p className="text-3xl font-black text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background:s.bg }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill={s.fill}>{s.icon}</svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-5 mb-6">
                <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900">Шинэ илгээлтүүд</h2>
                    {allSubmissions.length > 0 && (
                      <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background:"#fff7ed", color:"#f97316" }}>{allSubmissions.filter(s=>s.score===null).length} үнэлэгдээгүй</span>
                    )}
                  </div>
                  {allSubmissions.length === 0 ? (
                    <div className="flex items-center justify-center h-32"><p className="text-gray-300 text-sm">Одоохондоо илгээлт байхгүй</p></div>
                  ) : (
                    <div className="flex flex-col divide-y divide-gray-50">
                      {allSubmissions.slice(0,4).map(sub => {
                        const st = students.find(s => s.gmail === sub.studentGmail);
                        const asgn = assignments.find(a => a.id === sub.assignmentId);
                        const isImg = sub.filePath && /\.(jpg|jpeg|png|gif|webp)/i.test(sub.filePath);
                        return (
                          <div key={sub.id} className="flex items-center gap-3 py-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ background: st ? avatarColor(st.gmail) : "#9ca3af" }}>
                              {st ? initials(st) : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm">{st ? displayName(st) : sub.studentGmail.split("@")[0]}</p>
                              <p className="text-xs text-gray-400">{asgn?.title || "Даалгавар"} • {relTime(sub.submittedAt)}</p>
                            </div>
                            {sub.filePath && (
                              <a href={sub.filePath} target="_blank" rel="noreferrer"
                                className="text-xs px-2 py-1 rounded-lg shrink-0"
                                style={{ background:"#eff6ff", color:"#3b82f6" }}>
                                {isImg ? "Зураг" : "Файл"}
                              </a>
                            )}
                            {sub.score !== null
                              ? <span className="text-sm font-black shrink-0" style={{ color:"#f97316" }}>{sub.score}%</span>
                              : <button onClick={() => { setGradeTarget(sub); setGradeInput(""); }}
                                  className="text-xs px-3 py-1 rounded-lg font-semibold shrink-0" style={{ background:"#fff7ed", color:"#f97316" }}>Үнэлэх</button>
                            }
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span style={{ color:"#f97316" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg></span>
                    Удахгүй дуусах
                  </h2>
                  {assignments.filter(a => !isPast(a.deadline)).length === 0 ? (
                    <div className="flex items-center justify-center h-32"><p className="text-gray-300 text-sm text-center">Даалгавар байхгүй</p></div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {assignments.filter(a => !isPast(a.deadline)).slice(0,3).map(a => (
                        <div key={a.id} className="border-l-2 pl-3" style={{ borderColor:"#f97316" }}>
                          <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                          <p className="text-xs text-gray-400">{fmtDate(a.deadline)} • {a.grade}-р анги</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Шилдэг сурагчид</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Сургуулийн код:</span>
                    <span className="font-black tracking-widest text-sm" style={{ color:"#f97316" }}>{user.schoolCode || "…"}</span>
                    <button onClick={copyCode} className="text-xs px-2 py-1 rounded-lg font-semibold" style={{ background:"#fff7ed", color:"#f97316" }}>{copied ? "✓" : "Хуулах"}</button>
                  </div>
                </div>
                {topStudents.length === 0 ? (
                  <div className="flex items-center justify-center h-20"><p className="text-gray-300 text-sm">Сурагч бүртгэгдээгүй байна</p></div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {topStudents.map((s,i) => (
                      <div key={s.gmail} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background:"#f9fafb" }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background:["#f59e0b","#9ca3af","#f97316","#06b6d4"][i]||"#d1d5db" }}>{i+1}</div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background:avatarColor(s.gmail) }}>{initials(s)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{displayName(s)}</p>
                          <p className="text-xs text-gray-400">{s.grade}-р анги</p>
                        </div>
                        {s.avgScore !== null && (
                          <span className="text-sm font-black shrink-0" style={{ color:"#f97316" }}>{s.avgScore}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ASSIGNMENTS ===== */}
          {activeNav === "assignments" && (
            <div className="flex h-full" style={{ minHeight:"calc(100vh - 73px)" }}>
              {/* Left: assignment list */}
              <div className="w-96 border-r border-gray-100 bg-white flex flex-col">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">Даалгаврууд</h2>
                    <p className="text-xs text-gray-400">Даалгавар үүсгэх, үнэлэх</p>
                  </div>
                  <button onClick={() => { setShowCreate(true); setCreateError(""); setForm(EMPTY_FORM); setImageFile(null); setImagePreview(""); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
                    style={{ background:"#f97316" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                    Шинэ даалгавар
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-3">
                  {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="#d1d5db"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                      <p className="text-gray-400 text-sm">Даалгавар байхгүй байна</p>
                      <p className="text-gray-300 text-xs">Шинэ даалгавар үүсгэнэ үү</p>
                    </div>
                  ) : assignments.map(a => {
                    const past = isPast(a.deadline);
                    const selected = selectedAssignment?.id === a.id;
                    return (
                      <button key={a.id} onClick={() => setSelectedAssignment(a)}
                        className="w-full text-left px-6 py-4 border-b border-gray-50 transition-colors"
                        style={{ background: selected ? "#fff7ed" : "white" }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm leading-tight">{a.title}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                            style={past ? { background:"#fee2e2", color:"#ef4444" } : { background:"#dcfce7", color:"#16a34a" }}>
                            {past ? "Дууссан" : "Идэвхтэй"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{a.grade}-р анги</span>
                          <span>•</span>
                          <span>Хугацаа: {fmtDate(a.deadline)}</span>
                          <span>•</span>
                          <span>{a.submissionCount || 0} илгээлт</span>
                        </div>
                        {selected && (
                          <div className="mt-2 h-0.5 rounded-full" style={{ background:"#f97316" }}/>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: submissions */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {!selectedAssignment ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#e5e7eb"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    <p className="text-gray-400">Даалгавар сонгоно уу</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-white rounded-2xl p-6 shadow-sm mb-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{selectedAssignment.grade}-р анги</span>
                            <span>•</span>
                            <span>Хугацаа: {fmtDateTime(selectedAssignment.deadline)}</span>
                            <span>•</span>
                            <span>{selectedAssignment.points} оноо</span>
                          </div>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold"
                          style={isPast(selectedAssignment.deadline) ? { background:"#fee2e2", color:"#ef4444" } : { background:"#dcfce7", color:"#16a34a" }}>
                          {isPast(selectedAssignment.deadline) ? "Хугацаа дууссан" : "Идэвхтэй"}
                        </span>
                      </div>
                      {selectedAssignment.description && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedAssignment.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-bold text-gray-900">
                        Илгээлтүүд
                        <span className="ml-2 text-sm font-normal text-gray-400">({submissions.length})</span>
                      </h3>
                      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background:"#f3f4f6" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#9ca3af"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <input type="text" placeholder="Нэрээр хайх..." value={subSearch}
                          onChange={e => setSubSearch(e.target.value)}
                          className="flex-1 bg-transparent text-sm outline-none" style={{ color:"#111827" }}/>
                        {subSearch && <button onClick={() => setSubSearch("")} style={{ color:"#9ca3af", fontSize:12 }}>✕</button>}
                      </div>
                    </div>

                    {loadingSubs ? (
                      <div className="flex items-center justify-center py-12"><p className="text-gray-400">Уншиж байна...</p></div>
                    ) : submissions.length === 0 ? (
                      <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                        <p className="text-gray-300">Одоохондоо илгээлт байхгүй</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {submissions.filter(sub => {
                          if (!subSearch.trim()) return true;
                          const st = students.find(s => s.gmail === sub.studentGmail);
                          const name = st ? `${st.lastName || ""} ${st.firstName || ""} ${st.gmail}` : sub.studentGmail;
                          return name.toLowerCase().includes(subSearch.toLowerCase());
                        }).map(sub => {
                          const student = students.find(s => s.gmail === sub.studentGmail);
                          const name = student ? displayName(student) : sub.studentGmail.split("@")[0];
                          const color = avatarColor(sub.studentGmail);
                          const init = student ? initials(student) : sub.studentGmail[0].toUpperCase();
                          const isImg = sub.filePath && /\.(jpg|jpeg|png|gif|webp)/i.test(sub.filePath);
                          return (
                            <div key={sub.id} className="bg-white rounded-2xl p-5 shadow-sm">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background:color }}>{init}</div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{name}</p>
                                  <p className="text-xs text-gray-400">{fmtDateTime(sub.submittedAt)}</p>
                                </div>
                                {sub.score !== null ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black" style={{ color:"#f97316" }}>{sub.score}%</span>
                                    <button onClick={() => { setGradeTarget(sub); setGradeInput(String(sub.score)); }}
                                      className="text-xs px-2 py-1 rounded-lg" style={{ background:"#fff7ed", color:"#f97316" }}>Засах</button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setGradeTarget(sub); setGradeInput(""); }}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background:"#f97316" }}>
                                    Үнэлэх
                                  </button>
                                )}
                              </div>
                              {sub.text && <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 mb-3">{sub.text}</p>}
                              {sub.filePath && (
                                <div>
                                  {isImg ? (
                                    <img src={sub.filePath} alt="submission" className="rounded-xl max-h-72 object-contain border border-gray-100"/>
                                  ) : (
                                    <a href={sub.filePath} target="_blank" rel="noreferrer"
                                      className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                                      style={{ background:"#eff6ff", color:"#3b82f6" }}>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6z"/></svg>
                                      {sub.filePath.split("/").pop()}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ===== STUDENTS ===== */}
          {activeNav === "students" && (
            <div className="px-8 py-6">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Сурагчид ({students.length})</h2>
              {students.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><p className="text-gray-400">Сурагч бүртгэгдээгүй байна</p></div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {students.map((s) => (
                    <div key={s.gmail} className="flex items-center gap-4 px-6 py-3.5 border-b border-gray-50 last:border-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background:avatarColor(s.gmail) }}>{initials(s)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{displayName(s)}</p>
                        <p className="text-xs text-gray-400">{s.gmail}</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background:"#fff7ed", color:"#f97316" }}>{s.grade}-р анги</span>
                      {s.personalCode && (
                        <div className="flex flex-col items-end gap-0.5 ml-2">
                          <span className="text-xs text-gray-400">Хувийн код</span>
                          <span className="font-mono font-bold text-sm tracking-widest" style={{ color:"#06b6d4" }}>{s.personalCode}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CHAT ===== */}
          {activeNav === "chat" && (
            <div className="flex h-full" style={{ minHeight:"calc(100vh - 73px)" }}>
              {/* Student list */}
              <div className="w-72 border-r border-gray-100 bg-white flex flex-col shrink-0">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Чат</h2>
                  <p className="text-xs text-gray-400">Сурагчидтай харилцах</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {students.length === 0 ? (
                    <div className="flex items-center justify-center h-full"><p className="text-gray-300 text-sm">Сурагч байхгүй</p></div>
                  ) : students.map(st => {
                    const convo = allChatMessages.filter(m => m.fromGmail === st.gmail || m.toGmail === st.gmail)
                      .sort((a,b) => new Date(b.sentAt) - new Date(a.sentAt));
                    const last = convo[0];
                    const hasUnread = last && last.fromGmail === st.gmail;
                    const sel = selectedChatStudent?.gmail === st.gmail;
                    return (
                      <button key={st.gmail} onClick={() => setSelectedChatStudent(st)}
                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 text-left transition-colors"
                        style={{ background: sel ? "#fff7ed" : "white" }}>
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background:avatarColor(st.gmail) }}>{initials(st)}</div>
                          {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background:"#f97316" }}/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm">{displayName(st)}</p>
                          <p className="text-xs text-gray-400 truncate">{last ? last.text : "Мессеж байхгүй"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conversation */}
              <div className="flex-1 flex flex-col bg-white">
                {!selectedChatStudent ? (
                  <div className="flex-1 flex items-center justify-center"><p className="text-gray-300">Сурагч сонгоно уу</p></div>
                ) : (
                  <>
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background:avatarColor(selectedChatStudent.gmail) }}>{initials(selectedChatStudent)}</div>
                      <div>
                        <p className="font-bold text-gray-900">{displayName(selectedChatStudent)}</p>
                        <p className="text-xs text-gray-400">{selectedChatStudent.grade}-р анги</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                      {chatMessages.length === 0 && <p className="text-center text-gray-300 text-sm mt-8">Мессеж байхгүй</p>}
                      {chatMessages.sort((a,b) => new Date(a.sentAt)-new Date(b.sentAt)).map(msg => {
                        const isTeacher = msg.fromGmail === user.gmail;
                        return (
                          <div key={msg.id} className={`flex ${isTeacher ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm"
                              style={isTeacher
                                ? { background:"#f97316", color:"white", borderBottomRightRadius:4 }
                                : { background:"#f3f4f6", color:"#111827", borderBottomLeftRadius:4 }}>
                              <p>{msg.text}</p>
                              <p className="text-xs mt-1 opacity-60">{relTime(msg.sentAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef}/>
                    </div>
                    <form onSubmit={handleSendChat} className="px-6 py-4 border-t border-gray-100 flex gap-3">
                      <input type="text" placeholder="Мессеж бичих..." value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"#f3f4f6", color:"#111827" }}/>
                      <button type="submit" disabled={chatSending || !chatInput.trim()}
                        className="px-5 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                        style={{ background:"#f97316" }}>
                        Илгээх
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── RESEARCH ── */}
          {activeNav === "research" && (
            <div style={{ height:"100%", overflowY:"auto", padding:"28px 32px" }}>
              <div style={{ maxWidth:820, margin:"0 auto" }}>

                {/* Header */}
                <div style={{ marginBottom:24 }}>
                  <h2 style={{ margin:0, fontSize:22, fontWeight:800, color:"#111827" }}>AI Хичээлийн судалгаа</h2>
                  <p style={{ margin:"4px 0 0", fontSize:13, color:"#9ca3af" }}>Сэдэв оруулахад AI интернетээс мэдээлэл цуглуулж, хялбаршуулан тайлбарлана</p>
                </div>

                {/* Input */}
                <div style={{ background:"white", borderRadius:20, padding:24, boxShadow:"0 1px 6px rgba(0,0,0,0.07)", marginBottom:20 }}>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!researchTopic.trim()) return;
                    setResearchError(""); setResearchLoading(true); setResearchResult(null);
                    try {
                      const res = await fetch("/api/research", {
                        method:"POST", headers:{"Content-Type":"application/json"},
                        body: JSON.stringify({ topic: researchTopic }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      setResearchResult(data);
                      setSavedTopics(prev => [researchTopic, ...prev.filter(t => t !== researchTopic)].slice(0,8));
                    } catch(err) { setResearchError(err.message); }
                    finally { setResearchLoading(false); }
                  }}>
                    <label style={{ display:"block", fontSize:13, fontWeight:700, color:"#374151", marginBottom:8 }}>Судлах сэдэв</label>
                    <div style={{ display:"flex", gap:10 }}>
                      <input
                        type="text"
                        placeholder="Жишээ: Фотосинтез, Монголын түүх, Квадрат тэгшитгэл, Newton-ы хуулиуд..."
                        value={researchTopic}
                        onChange={e => setResearchTopic(e.target.value)}
                        disabled={researchLoading}
                        style={{ flex:1, padding:"12px 16px", borderRadius:12, border:"1px solid #e5e7eb", fontSize:14, outline:"none", color:"#111827", background:"#f9fafb" }}
                      />
                      <button type="submit" disabled={researchLoading || !researchTopic.trim()}
                        style={{ padding:"12px 24px", borderRadius:12, fontWeight:700, fontSize:14, color:"white", background:"#f97316", border:"none", cursor:"pointer", opacity:(researchLoading||!researchTopic.trim())?0.6:1, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:8 }}>
                        {researchLoading ? (
                          <><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"white", borderRadius:"50%", display:"inline-block", animation:"spin 0.7s linear infinite" }}/> Судалж байна...</>
                        ) : (
                          <><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg> Судлах</>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Quick topics */}
                  <div style={{ marginTop:14, display:"flex", flexWrap:"wrap", gap:8 }}>
                    {["Фотосинтез","Квадрат тэгшитгэл","Ньютоны хуулиуд","Монголын эзэнт гүрэн","Хүчилтөрөгч","Пифагорын теорем","Дэлхийн дулааралт","Хэлний хэсгүүд"].map(t => (
                      <button key={t} onClick={() => setResearchTopic(t)}
                        style={{ padding:"5px 12px", borderRadius:99, border:"1px solid #fed7aa", background:"#fff7ed", color:"#c2410c", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {researchError && (
                  <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"12px 16px", marginBottom:16, color:"#dc2626", fontSize:13 }}>
                    {researchError}
                  </div>
                )}

                {/* Loading skeleton */}
                {researchLoading && (
                  <div style={{ background:"white", borderRadius:20, padding:32, boxShadow:"0 1px 6px rgba(0,0,0,0.07)", textAlign:"center" }}>
                    <div style={{ width:48, height:48, border:"3px solid #fed7aa", borderTopColor:"#f97316", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 16px" }}/>
                    <p style={{ margin:0, fontWeight:700, color:"#374151", fontSize:15 }}>AI судалж байна...</p>
                    <p style={{ margin:"6px 0 0", color:"#9ca3af", fontSize:13 }}>"{researchTopic}" сэдвийн талаарх мэдээллийг боловсруулж байна</p>
                  </div>
                )}

                {/* Result */}
                {researchResult && !researchLoading && (
                  <div style={{ background:"white", borderRadius:20, padding:28, boxShadow:"0 1px 6px rgba(0,0,0,0.07)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:"1px solid #f1f5f9" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#f97316"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>
                        </div>
                        <div>
                          <p style={{ margin:0, fontWeight:800, fontSize:16, color:"#111827" }}>{researchResult.topic}</p>
                          <p style={{ margin:0, fontSize:12, color:"#9ca3af" }}>AI-ийн боловсруулсан материал</p>
                        </div>
                      </div>
                      <button onClick={() => {
                        const text = researchResult.content;
                        navigator.clipboard.writeText(text).catch(() => {});
                      }}
                        style={{ padding:"6px 14px", borderRadius:8, border:"1px solid #e5e7eb", background:"white", cursor:"pointer", fontSize:12, fontWeight:600, color:"#6b7280", display:"flex", alignItems:"center", gap:6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        Хуулах
                      </button>
                    </div>
                    <div style={{ fontSize:14, lineHeight:1.8, color:"#374151", whiteSpace:"pre-wrap" }}>
                      {researchResult.content.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h3 key={i} style={{ margin:"20px 0 8px", fontSize:16, fontWeight:800, color:"#111827", borderLeft:"3px solid #f97316", paddingLeft:12 }}>{line.replace("## ","")}</h3>;
                        if (line.startsWith("# ")) return <h2 key={i} style={{ margin:"0 0 12px", fontSize:18, fontWeight:800, color:"#111827" }}>{line.replace("# ","")}</h2>;
                        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ margin:"4px 0", fontWeight:700, color:"#111827" }}>{line.replace(/\*\*/g,"")}</p>;
                        if (line.match(/^\d+\./)) return <p key={i} style={{ margin:"4px 0 4px 12px", color:"#374151" }}>{line}</p>;
                        if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ margin:"3px 0 3px 16px", color:"#374151" }}>{"• " + line.replace(/^[-•]\s*/,"")}</p>;
                        if (line.trim() === "") return <div key={i} style={{ height:8 }}/>;
                        return <p key={i} style={{ margin:"3px 0", color:"#374151" }}>{line}</p>;
                      })}
                    </div>
                  </div>
                )}

                {/* Saved topics history */}
                {savedTopics.length > 0 && (
                  <div style={{ marginTop:20, background:"white", borderRadius:16, padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                    <p style={{ margin:"0 0 10px", fontSize:12, fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>Сүүлийн хайлтууд</p>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {savedTopics.map(t => (
                        <button key={t} onClick={() => setResearchTopic(t)}
                          style={{ padding:"5px 12px", borderRadius:99, border:"1px solid #e5e7eb", background:"#f9fafb", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ===== CREATE ASSIGNMENT MODAL ===== */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background:"rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Шинэ даалгавар үүсгэх</h3>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#6b7280"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Гарчиг</label>
                <input type="text" placeholder="Даалгаврын нэр" required value={form.title}
                  onChange={e => setForm(f=>({...f, title:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"#f3f4f6", color:"#111827" }}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Хэддүгээр анги</label>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({length:12},(_,i)=>i+1).map(g => (
                    <button key={g} type="button" onClick={() => setForm(f=>({...f,grade:g}))}
                      className="py-2.5 rounded-lg text-sm font-semibold transition-colors"
                      style={form.grade===g ? { background:"#f97316", color:"white" } : { background:"#f3f4f6", color:"#6b7280" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Тодорхойлолт</label>
                <textarea placeholder="Даалгаврын дэлгэрэнгүй тайлбар..." rows={3} value={form.description}
                  onChange={e => setForm(f=>({...f, description:e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background:"#f3f4f6" }}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Зураг (заавал биш)</label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-full rounded-xl object-cover" style={{ maxHeight:180 }}/>
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                      style={{ background:"rgba(0,0,0,0.5)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 w-full rounded-xl cursor-pointer"
                    style={{ background:"#f3f4f6", border:"2px dashed #d1d5db", minHeight:80 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#9ca3af"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    <span className="text-xs text-gray-400">Зураг сонгох</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setImageFile(f);
                        setImagePreview(URL.createObjectURL(f));
                      }}/>
                  </label>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Хугацаа</label>
                  <input type="datetime-local" required value={form.deadline}
                    onChange={e => setForm(f=>({...f, deadline:e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"#f3f4f6", color:"#111827" }}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Оноо</label>
                  <input type="number" min="1" max="1000" value={form.points}
                    onChange={e => setForm(f=>({...f, points:e.target.value}))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"#f3f4f6", color:"#111827" }}/>
                </div>
              </div>
              {createError && <p className="text-sm text-red-500">{createError}</p>}
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={creating || !form.grade}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                  style={{ background:"#f97316" }}>
                  {creating ? "Үүсгэж байна..." : "Үүсгэх"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-3 rounded-xl font-semibold text-sm text-gray-600 border border-gray-200">
                  Болих
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== GRADE MODAL ===== */}
      {gradeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background:"rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Үнэлгээ өгөх</h3>
            <p className="text-sm text-gray-400 mb-6">
              {students.find(s=>s.gmail===gradeTarget.studentGmail) ? displayName(students.find(s=>s.gmail===gradeTarget.studentGmail)) : gradeTarget.studentGmail}
            </p>
            <form onSubmit={handleGrade} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Хувь оноо (0–100)</label>
                <div className="flex items-center gap-3">
                  <input type="number" min="0" max="100" required autoFocus value={gradeInput}
                    onChange={e => setGradeInput(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl text-2xl font-black text-center outline-none"
                    style={{ background:"#f3f4f6", color:"#f97316" }}/>
                  <span className="text-2xl font-black text-gray-300">%</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={grading}
                  className="flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50"
                  style={{ background:"#f97316" }}>
                  {grading ? "Хадгалж байна..." : "Хадгалах"}
                </button>
                <button type="button" onClick={() => { setGradeTarget(null); setGradeInput(""); }}
                  className="px-5 py-3 rounded-xl font-semibold text-gray-600 border border-gray-200">
                  Болих
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== STEAM-STYLE NOTIFICATIONS ===== */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 items-end">
        {notifications.map(n => (
          <NotifCard key={n.nid} n={n} onClose={() => setNotifications(prev => prev.filter(x => x.nid !== n.nid))} />
        ))}
        {chatNotifications.map(n => (
          <ChatNotifCard key={n.nid} n={n} onClose={() => setChatNotifications(prev => prev.filter(x => x.nid !== n.nid))} />
        ))}
      </div>
    </div>
  );
}
