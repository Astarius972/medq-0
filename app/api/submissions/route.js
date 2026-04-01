import { readDB, writeDB } from "@/lib/db";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  const studentGmail = searchParams.get("studentGmail");

  const db = readDB();
  const submissions = db.submissions || [];

  if (assignmentId) {
    return Response.json({ submissions: submissions.filter((s) => s.assignmentId === assignmentId) });
  }
  if (studentGmail) {
    return Response.json({ submissions: submissions.filter((s) => s.studentGmail === studentGmail) });
  }
  const teacherGmail = searchParams.get("teacherGmail");
  if (teacherGmail) {
    const assignmentIds = new Set(
      (db.assignments || []).filter((a) => a.teacherGmail === teacherGmail).map((a) => a.id)
    );
    const result = submissions
      .filter((s) => assignmentIds.has(s.assignmentId))
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    return Response.json({ submissions: result });
  }
  return Response.json({ submissions: [] });
}

export async function POST(request) {
  const formData = await request.formData();
  const assignmentId = formData.get("assignmentId");
  const studentGmail = formData.get("studentGmail");
  const text = formData.get("text") || "";
  const file = formData.get("file");

  if (!assignmentId || !studentGmail) {
    return Response.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
  }

  const db = readDB();
  if (!db.submissions) db.submissions = [];
  if (!db.assignments) db.assignments = [];

  const assignment = db.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return Response.json({ error: "Даалгавар олдсонгүй" }, { status: 404 });
  }

  if (new Date() > new Date(assignment.deadline)) {
    return Response.json({ error: "Даалгаварын хугацаа дууссан байна" }, { status: 400 });
  }

  let filePath = null;
  if (file && file.size > 0) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const ext = (file.name || "file").split(".").pop();
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);
    filePath = `/uploads/${filename}`;
  }

  const existing = db.submissions.find(
    (s) => s.assignmentId === assignmentId && s.studentGmail === studentGmail
  );

  if (existing) {
    existing.text = text;
    if (filePath) existing.filePath = filePath;
    existing.submittedAt = new Date().toISOString();
    existing.score = null;
    existing.gradedAt = null;
    writeDB(db);
    return Response.json({ submission: existing });
  }

  const submission = {
    id: randomUUID(),
    assignmentId,
    studentGmail,
    text,
    filePath,
    submittedAt: new Date().toISOString(),
    score: null,
    gradedAt: null,
  };

  db.submissions.push(submission);
  writeDB(db);
  return Response.json({ submission });
}
