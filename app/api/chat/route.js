import { readDB, writeDB } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("teacherGmail");
  const studentGmail = searchParams.get("studentGmail");

  const db = readDB();
  const messages = db.messages || [];

  if (teacherGmail && studentGmail) {
    const convo = messages.filter(
      (m) =>
        (m.fromGmail === teacherGmail && m.toGmail === studentGmail) ||
        (m.fromGmail === studentGmail && m.toGmail === teacherGmail)
    );
    return Response.json({ messages: convo });
  }

  if (teacherGmail) {
    const mine = messages.filter(
      (m) => m.fromGmail === teacherGmail || m.toGmail === teacherGmail
    );
    return Response.json({ messages: mine });
  }

  return Response.json({ messages: [] });
}

export async function POST(request) {
  const { fromGmail, toGmail, text } = await request.json();

  if (!fromGmail || !toGmail || !text?.trim()) {
    return Response.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
  }

  const db = readDB();
  if (!db.messages) db.messages = [];

  const message = {
    id: randomUUID(),
    fromGmail,
    toGmail,
    text: text.trim(),
    sentAt: new Date().toISOString(),
  };

  db.messages.push(message);
  writeDB(db);
  return Response.json({ message });
}
