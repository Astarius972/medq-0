import supabase from "@/lib/supabase";
import { generateCode } from "@/lib/db";

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function isExpired(ts) {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > THREE_MONTHS_MS;
}

export async function POST(request) {
  const body = await request.json();
  const { gmail, personalCode, code, grade, lastName, firstName } = body;

  // ── LOGIN mode ──
  if (personalCode && !code) {
    if (!gmail) return Response.json({ error: "И-мэйл оруулна уу" }, { status: 400 });
    const normalized = gmail.toLowerCase().trim();
    const { data: student } = await supabase
      .from("students")
      .select("*")
      .eq("gmail", normalized)
      .eq("personal_code", personalCode.toUpperCase().trim())
      .maybeSingle();

    if (!student) {
      return Response.json({ error: "И-мэйл эсвэл хувийн код буруу байна" }, { status: 404 });
    }
    if (isExpired(student.joined_at)) {
      return Response.json(
        { error: "Таны 3 сарын хугацаа дууссан байна. Багшаасаа шинэ ангийн код авч дахин бүртгүүлнэ үү" },
        { status: 403 }
      );
    }

    const { data: teacher } = await supabase
      .from("teachers")
      .select("gmail, name")
      .eq("gmail", student.teacher_gmail)
      .maybeSingle();

    return Response.json({
      mode: "login",
      student: toStudentJS(student),
      teacher: { name: teacher?.name || student.teacher_gmail, gmail: student.teacher_gmail },
    });
  }

  // ── REGISTER mode ──
  if (!gmail || !code || !grade || !lastName || !firstName) {
    return Response.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
  }

  const upperCode = code.toUpperCase().trim();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("*")
    .eq("code", upperCode)
    .maybeSingle();

  if (!teacher) return Response.json({ error: "Ангийн код буруу байна" }, { status: 404 });
  if (isExpired(teacher.code_created_at)) {
    return Response.json(
      { error: "Ангийн кодын хугацаа дууссан байна. Багшаасаа шинэ код авна уу" },
      { status: 403 }
    );
  }

  const normalizedGmail = gmail.toLowerCase().trim();
  const { data: existing } = await supabase
    .from("students")
    .select("*")
    .eq("gmail", normalizedGmail)
    .eq("code", upperCode)
    .maybeSingle();

  let student;
  if (!existing) {
    const newPersonalCode = generateCode();
    const { data } = await supabase
      .from("students")
      .insert({
        gmail: normalizedGmail,
        last_name: lastName.trim(),
        first_name: firstName.trim(),
        code: upperCode,
        personal_code: newPersonalCode,
        grade: Number(grade),
        teacher_gmail: teacher.gmail,
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();
    student = data;
  } else {
    const updates = {
      grade: Number(grade),
      last_name: lastName.trim(),
      first_name: firstName.trim(),
    };
    if (isExpired(existing.joined_at)) {
      updates.joined_at = new Date().toISOString();
      updates.personal_code = generateCode();
    }
    if (!existing.personal_code) updates.personal_code = generateCode();

    const { data } = await supabase
      .from("students")
      .update(updates)
      .eq("gmail", normalizedGmail)
      .eq("code", upperCode)
      .select()
      .single();
    student = data;
  }

  return Response.json({
    mode: "registered",
    student: toStudentJS(student),
    teacher: { name: teacher.name, gmail: teacher.gmail },
    personalCode: student.personal_code,
  });
}

function toStudentJS(s) {
  return {
    gmail: s.gmail,
    lastName: s.last_name,
    firstName: s.first_name,
    code: s.code,
    personalCode: s.personal_code,
    grade: s.grade,
    teacherGmail: s.teacher_gmail,
    joinedAt: s.joined_at,
  };
}
