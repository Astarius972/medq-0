import supabase from "@/lib/supabase";
import bcrypt from "bcryptjs";

function isLegacyPlain(hash) { return hash && !hash.startsWith("$2"); }

export async function POST(request) {
  try {
    const { gmail, password, studentPersonalCode } = await request.json();

    if (!gmail || !password)
      return Response.json({ error: "И-мэйл болон нууц үгээ оруулна уу" }, { status: 400 });

    const normalizedGmail = gmail.toLowerCase().trim();

    // ── LOGIN ──
    if (!studentPersonalCode) {
      const { data: parent } = await supabase
        .from("parents").select("*").eq("gmail", normalizedGmail).maybeSingle();

      if (!parent) return Response.json({ error: "И-мэйл бүртгэлгүй байна. Эхлээд бүртгүүлнэ үү" }, { status: 404 });

      if (parent.password) {
        const ok = isLegacyPlain(parent.password)
          ? parent.password === password
          : await bcrypt.compare(password, parent.password);
        if (!ok) return Response.json({ error: "Нууц үг буруу байна" }, { status: 401 });
        if (isLegacyPlain(parent.password)) {
          const hashed = await bcrypt.hash(password, 10);
          await supabase.from("parents").update({ password: hashed }).eq("gmail", normalizedGmail);
        }
      }

      const { data: student } = await supabase
        .from("students").select("*").eq("gmail", parent.student_gmail).maybeSingle();
      const { data: teacher } = await supabase
        .from("teachers").select("gmail, name").eq("gmail", parent.teacher_gmail).maybeSingle();

      return Response.json({
        parent: toParentJS(parent),
        student: student ? toStudentJS(student) : null,
        teacher: { name: teacher?.name || parent.teacher_gmail, gmail: parent.teacher_gmail },
      });
    }

    // ── REGISTER ──
    const upperCode = studentPersonalCode.toUpperCase().trim();
    const { data: student } = await supabase
      .from("students").select("*").eq("personal_code", upperCode).maybeSingle();

    if (!student) return Response.json({ error: "Сурагчийн хувийн код буруу байна" }, { status: 404 });

    const { data: teacher } = await supabase
      .from("teachers").select("gmail, name").eq("gmail", student.teacher_gmail).maybeSingle();

    const { data: existing } = await supabase
      .from("parents").select("*").eq("gmail", normalizedGmail).maybeSingle();

    const hashed = await bcrypt.hash(password, 10);

    let parent;
    if (!existing) {
      const { data, error } = await supabase.from("parents").insert({
        gmail: normalizedGmail, password: hashed,
        student_personal_code: upperCode,
        student_gmail: student.gmail,
        teacher_gmail: student.teacher_gmail,
        teacher_name: teacher?.name || student.teacher_gmail,
        joined_at: new Date().toISOString(),
      }).select().single();
      if (error || !data)
        return Response.json({ error: "Бүртгэл хадгалахад алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });
      parent = data;
    } else {
      const { data, error } = await supabase.from("parents")
        .update({ password: hashed, student_personal_code: upperCode, student_gmail: student.gmail, teacher_gmail: student.teacher_gmail })
        .eq("gmail", normalizedGmail).select().single();
      if (error || !data)
        return Response.json({ error: "Бүртгэл шинэчлэхэд алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });
      parent = data;
    }

    return Response.json({
      parent: toParentJS(parent),
      student: toStudentJS(student),
      teacher: { name: teacher?.name || student.teacher_gmail, gmail: student.teacher_gmail },
    });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}

function toParentJS(p) {
  return { gmail: p.gmail, studentPersonalCode: p.student_personal_code, studentGmail: p.student_gmail, teacherGmail: p.teacher_gmail, teacherName: p.teacher_name };
}
function toStudentJS(s) {
  return { gmail: s.gmail, lastName: s.last_name, firstName: s.first_name, personalCode: s.personal_code, grade: s.grade, classSection: s.class_section, teacherGmail: s.teacher_gmail, joinedAt: s.joined_at };
}
