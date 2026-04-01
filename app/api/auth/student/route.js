import { readDB, writeDB } from "@/lib/db";

export async function POST(request) {
  const { gmail, code, grade, lastName, firstName } = await request.json();

  if (!gmail || !code || !grade || !lastName || !firstName) {
    return Response.json(
      { error: "Бүх талбарыг бөглөнө үү" },
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
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      code: code.toUpperCase().trim(),
      grade: Number(grade),
      teacherGmail: teacher.gmail,
      joinedAt: new Date().toISOString(),
    };
    db.students.push(student);
    writeDB(db);
  } else {
    student.grade = Number(grade);
    student.lastName = lastName.trim();
    student.firstName = firstName.trim();
    writeDB(db);
  }

  return Response.json({ student, teacher: { name: teacher.name, gmail: teacher.gmail } });
}
