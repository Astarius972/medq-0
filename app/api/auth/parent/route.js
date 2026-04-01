import { readDB, writeDB } from "@/lib/db";

export async function POST(request) {
  const { gmail, code } = await request.json();

  if (!gmail || !code) {
    return Response.json(
      { error: "Gmail болон сурагчийн кодыг бөглөнө үү" },
      { status: 400 }
    );
  }

  const db = readDB();
  const teacher = db.teachers.find((t) => t.code === code.toUpperCase().trim());

  if (!teacher) {
    return Response.json({ error: "Сурагчийн код буруу байна" }, { status: 404 });
  }

  const normalizedGmail = gmail.toLowerCase().trim();

  if (!db.parents) db.parents = [];

  let parent = db.parents.find(
    (p) => p.gmail === normalizedGmail && p.code === code.toUpperCase().trim()
  );

  if (!parent) {
    parent = {
      gmail: normalizedGmail,
      code: code.toUpperCase().trim(),
      teacherGmail: teacher.gmail,
      teacherName: teacher.name,
      joinedAt: new Date().toISOString(),
    };
    db.parents.push(parent);
    writeDB(db);
  }

  const children = db.students.filter(
    (s) => s.code === code.toUpperCase().trim()
  );

  return Response.json({ parent, teacher, children });
}
