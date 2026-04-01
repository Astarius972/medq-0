import { readDB, writeDB, generateCode } from "@/lib/db";

export async function POST(request) {
  const { gmail } = await request.json();

  if (!gmail) {
    return Response.json({ error: "Gmail хаяг оруулна уу" }, { status: 400 });
  }

  const db = readDB();
  let teacher = db.teachers.find(
    (t) => t.gmail === gmail.toLowerCase().trim()
  );

  if (!teacher) {
    const name = gmail.split("@")[0];
    const newTeacher = { gmail: gmail.toLowerCase().trim(), name, code: null };
    db.teachers.push(newTeacher);
    writeDB(db);
    teacher = newTeacher;
  }

  if (!teacher.code) {
    teacher.code = generateCode();
    writeDB(db);
  }

  return Response.json({ teacher });
}
