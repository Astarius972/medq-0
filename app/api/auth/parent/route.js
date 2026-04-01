import supabase from "@/lib/supabase";

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function isExpired(ts) {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > THREE_MONTHS_MS;
}

export async function POST(request) {
  const { gmail, studentPersonalCode } = await request.json();

  if (!gmail || !studentPersonalCode) {
    return Response.json(
      { error: "Gmail болон сурагчийн хувийн кодыг бөглөнө үү" },
      { status: 400 }
    );
  }

  const upperCode = studentPersonalCode.toUpperCase().trim();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("personal_code", upperCode)
    .maybeSingle();

  if (!student) {
    return Response.json({ error: "Сурагчийн хувийн код буруу байна" }, { status: 404 });
  }
  if (isExpired(student.joined_at)) {
    return Response.json({ error: "Сурагчийн хандалтын хугацаа дууссан байна" }, { status: 403 });
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("gmail, name")
    .eq("gmail", student.teacher_gmail)
    .maybeSingle();

  const normalizedGmail = gmail.toLowerCase().trim();

  const { data: existing } = await supabase
    .from("parents")
    .select("*")
    .eq("gmail", normalizedGmail)
    .eq("student_personal_code", upperCode)
    .maybeSingle();

  if (!existing) {
    await supabase.from("parents").insert({
      gmail: normalizedGmail,
      student_personal_code: upperCode,
      student_gmail: student.gmail,
      teacher_gmail: student.teacher_gmail,
      teacher_name: teacher?.name || student.teacher_gmail,
      joined_at: new Date().toISOString(),
    });
  }

  return Response.json({
    parent: {
      gmail: normalizedGmail,
      studentPersonalCode: upperCode,
      studentGmail: student.gmail,
      teacherGmail: student.teacher_gmail,
      teacherName: teacher?.name || student.teacher_gmail,
    },
    student: toStudentJS(student),
    teacher: { name: teacher?.name || student.teacher_gmail, gmail: student.teacher_gmail },
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
