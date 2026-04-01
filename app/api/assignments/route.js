import { readDB, writeDB } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("teacherGmail");
  const studentTeacherGmail = searchParams.get("studentTeacherGmail");
  const grade = searchParams.get("grade");

  const db = readDB();
  const assignments = db.assignments || [];
  const submissions = db.submissions || [];

  if (teacherGmail) {
    const subCounts = submissions.reduce((m, s) => {
      m[s.assignmentId] = (m[s.assignmentId] || 0) + 1;
      return m;
    }, {});
    const result = assignments
      .filter((a) => a.teacherGmail === teacherGmail)
      .map((a) => ({ ...a, submissionCount: subCounts[a.id] || 0 }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return Response.json({ assignments: result });
  }

  if (studentTeacherGmail && grade) {
    const result = assignments.filter(
      (a) => a.teacherGmail === studentTeacherGmail && a.grade === Number(grade)
    );
    return Response.json({ assignments: result });
  }

  return Response.json({ assignments: [] });
}

export async function POST(request) {
  const { teacherGmail, grade, title, description, deadline, points } =
    await request.json();

  if (!teacherGmail || !grade || !title || !deadline) {
    return Response.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
  }

  const db = readDB();
  if (!db.assignments) db.assignments = [];

  const assignment = {
    id: randomUUID(),
    teacherGmail,
    grade: Number(grade),
    title: title.trim(),
    description: (description || "").trim(),
    deadline,
    points: Number(points) || 100,
    createdAt: new Date().toISOString(),
  };

  db.assignments.push(assignment);
  writeDB(db);

  return Response.json({ assignment });
}
