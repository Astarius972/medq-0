import { readDB, writeDB } from "@/lib/db";

export async function POST(request) {
  const { gmail, code, grade } = await request.json();

  if (!gmail || !code || !grade) {
    return Response.json(
      { error: "Gmail, ангийн код болон ангиа сонгоно уу" },
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
      grade: Number(grade),
      teacherGmail: teacher.gmail,
      joinedAt: new Date().toISOString(),
    };
    db.students.push(student);
    writeDB(db);
  } else {
    student.grade = Number(grade);
    writeDB(db);
  }

  return Response.json({ student, teacher: { name: teacher.name, gmail: teacher.gmail } });
}
