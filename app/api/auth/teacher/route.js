import { readDB, writeDB, generateCode } from "@/lib/db";

export async function POST(request) {
  const { gmail } = await request.json();

  if (!gmail) {
    return Response.json({ error: "Gmail хаяг оруулна уу" }, { status: 400 });
  }

  const db = readDB();
  const teacher = db.teachers.find(
    (t) => t.gmail === gmail.toLowerCase().trim()
  );

  if (!teacher) {
    return Response.json(
      { error: "Таны gmail зөвшөөрөгдөөгүй байна. Админтай холбогдоно уу." },
      { status: 403 }
    );
  }

  if (!teacher.code) {
    teacher.code = generateCode();
    writeDB(db);
  }

  return Response.json({ teacher });
}
