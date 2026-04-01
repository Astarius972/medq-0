import { readDB } from "@/lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("gmail");

  if (!teacherGmail) {
    return Response.json({ error: "Gmail шаардлагатай" }, { status: 400 });
  }

  const db = readDB();
  const teacher = db.teachers.find((t) => t.gmail === teacherGmail);
  if (!teacher) {
    return Response.json({ error: "Багш олдсонгүй" }, { status: 404 });
  }

  const students = db.students.filter((s) => s.teacherGmail === teacherGmail);

  return Response.json({ code: teacher.code, students });
}
