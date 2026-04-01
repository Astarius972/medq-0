import { readDB, writeDB } from "@/lib/db";

export async function POST(request) {
  const { gmail, code } = await request.json();

  if (!gmail || !code) {
    return Response.json(
      { error: "Gmail болон ангийн кодыг бөглөнө үү" },
      { status: 400 }
    );
  }

  const db = readDB();
  const teacher = db.teachers.find(
    (t) => t.code === code.toUpperCase().trim()
  );

  if (!teacher) {
    return Response.json(
      { error: "Ангийн код буруу байна" },
      { status: 404 }
    );
  }

  const normalizedGmail = gmail.toLowerCase().trim();
  let student = db.students.find((s) => s.gmail === normalizedGmail && s.code === code.toUpperCase().trim());

  if (!student) {
    student = {
      gmail: normalizedGmail,
      code: code.toUpperCase().trim(),
      teacherGmail: teacher.gmail,
      joinedAt: new Date().toISOString(),
    };
    db.students.push(student);
    writeDB(db);
  }

  return Response.json({ student, teacher: { name: teacher.name, gmail: teacher.gmail } });
}
