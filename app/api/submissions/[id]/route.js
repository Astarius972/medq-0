import { readDB, writeDB } from "@/lib/db";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { score } = await request.json();

  if (score === undefined || score === null || Number(score) < 0 || Number(score) > 100) {
    return Response.json({ error: "0-100 хооронд оноо оруулна уу" }, { status: 400 });
  }

  const db = readDB();
  if (!db.submissions) db.submissions = [];

  const submission = db.submissions.find((s) => s.id === id);
  if (!submission) {
    return Response.json({ error: "Илгээлт олдсонгүй" }, { status: 404 });
  }

  submission.score = Number(score);
  submission.gradedAt = new Date().toISOString();
  writeDB(db);
  return Response.json({ submission });
}
