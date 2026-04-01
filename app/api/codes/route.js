import supabase from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("gmail");

  if (!teacherGmail) {
    return Response.json({ error: "Gmail шаардлагатай" }, { status: 400 });
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("code")
    .eq("gmail", teacherGmail)
    .maybeSingle();

  if (!teacher) {
    return Response.json({ error: "Багш олдсонгүй" }, { status: 404 });
  }

  const { data: students } = await supabase
    .from("students")
    .select("*")
    .eq("teacher_gmail", teacherGmail);

  return Response.json({
    code: teacher.code,
    students: (students || []).map(s => ({
      gmail: s.gmail,
      lastName: s.last_name,
      firstName: s.first_name,
      code: s.code,
      personalCode: s.personal_code,
      grade: s.grade,
      teacherGmail: s.teacher_gmail,
      joinedAt: s.joined_at,
    })),
  });
}
