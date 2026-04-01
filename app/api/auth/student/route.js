import supabase from "@/lib/supabase";
import { generateCode } from "@/lib/db";

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;
function isExpired(ts) {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > THREE_MONTHS_MS;
}

export async function POST(request) {
  const body = await request.json();
  const { gmail, password, schoolCode, grade, classSection, teacherGmail, lastName, firstName } = body;

  // ── LOGIN mode: email + password ──
  if (!schoolCode) {
    if (!gmail || !password)
      return Response.json({ error: "И-мэйл болон нууц үгээ оруулна уу" }, { status: 400 });

    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("gmail", gmail.toLowerCase().trim())
      .maybeSingle();

    if (!student) return Response.json({ error: "И-мэйл бүртгэлгүй байна" }, { status: 404 });
    if (student.password && student.password !== password)
      return Response.json({ error: "Нууц үг буруу байна" }, { status: 401 });
    if (isExpired(student.joined_at))
      return Response.json({ error: "Хандалтын хугацаа дууссан. Дахин бүртгүүлнэ үү" }, { status: 403 });

    const { data: teacher } = await supabase
      .from("teachers").select("gmail, name, subject")
      .eq("gmail", student.teacher_gmail).maybeSingle();

    return Response.json({ mode: "login", student: toJS(student), teacher: { name: teacher?.name || student.teacher_gmail, gmail: student.teacher_gmail } });
  }

  // ── REGISTER mode: school code + info + password ──
  if (!gmail || !password || !schoolCode || !grade || !lastName || !firstName || !teacherGmail)
    return Response.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });

  if (schoolCode.toUpperCase().trim() !== (process.env.SCHOOL_CODE || "OLULA"))
    return Response.json({ error: "Сургуулийн код буруу байна" }, { status: 403 });

  const normalizedGmail = gmail.toLowerCase().trim();
  const { data: existing } = await supabase
    .from("students").select("*").eq("gmail", normalizedGmail).maybeSingle();

  let student;
  if (!existing) {
    const { data, error } = await supabase.from("students").insert({
      gmail: normalizedGmail,
      password,
      last_name: lastName.trim(),
      first_name: firstName.trim(),
      code: schoolCode.toUpperCase().trim(),
      personal_code: generateCode(),
      grade: Number(grade),
      class_section: classSection || "А",
      teacher_gmail: teacherGmail,
      joined_at: new Date().toISOString(),
    }).select().single();
    if (error || !data) return Response.json({ error: "Бүртгэл хадгалахад алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });
    student = data;
  } else {
    const updates = {
      password,
      grade: Number(grade),
      class_section: classSection || "А",
      last_name: lastName.trim(),
      first_name: firstName.trim(),
      teacher_gmail: teacherGmail,
    };
    if (isExpired(existing.joined_at)) {
      updates.joined_at = new Date().toISOString();
      updates.personal_code = generateCode();
    }
    if (!existing.personal_code) updates.personal_code = generateCode();
    const { data, error } = await supabase.from("students").update(updates)
      .eq("gmail", normalizedGmail).select().single();
    if (error || !data) return Response.json({ error: "Бүртгэл шинэчлэхэд алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });
    student = data;
  }

  const { data: teacher } = await supabase
    .from("teachers").select("gmail, name").eq("gmail", teacherGmail).maybeSingle();

  return Response.json({
    mode: "registered",
    student: toJS(student),
    teacher: { name: teacher?.name || teacherGmail, gmail: teacherGmail },
    personalCode: student.personal_code,
  });
}

function toJS(s) {
  return {
    gmail: s.gmail,
    lastName: s.last_name,
    firstName: s.first_name,
    code: s.code,
    personalCode: s.personal_code,
    grade: s.grade,
    classSection: s.class_section,
    teacherGmail: s.teacher_gmail,
    joinedAt: s.joined_at,
  };
}
