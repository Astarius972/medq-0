import supabase from "@/lib/supabase";
import { generateCode } from "@/lib/db";

const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

function isCodeExpired(ts) {
  if (!ts) return true;
  return Date.now() - new Date(ts).getTime() > THREE_MONTHS_MS;
}

export async function POST(request) {
  try {
    const { gmail, password } = await request.json();

    if (!gmail || !password)
      return Response.json({ error: "И-мэйл болон нууц үг оруулна уу" }, { status: 400 });

    const normalized = gmail.toLowerCase().trim();

    if (!normalized.endsWith("@olula.edu.mn"))
      return Response.json({ error: "Зөвхөн @olula.edu.mn хаягтай багш нэвтрэх боломжтой" }, { status: 403 });

    const { data: teacher } = await supabase
      .from("teachers").select("*").eq("gmail", normalized).maybeSingle();

    if (!teacher) {
      const name = normalized.split("@")[0];
      const { data: created, error } = await supabase.from("teachers").insert({
        gmail: normalized, name,
        password: password.trim(),
        code: generateCode(),
        code_created_at: new Date().toISOString(),
      }).select().single();
      if (error || !created)
        return Response.json({ error: "Бүртгэл хадгалахад алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });
      return Response.json({ teacher: { gmail: created.gmail, name: created.name, code: created.code } });
    }

    if (teacher.password && teacher.password !== password.trim())
      return Response.json({ error: "Нууц үг буруу байна" }, { status: 401 });

    const updates = {};
    if (!teacher.password) updates.password = password.trim();
    if (isCodeExpired(teacher.code_created_at)) {
      updates.code = generateCode();
      updates.code_created_at = new Date().toISOString();
    }
    if (Object.keys(updates).length > 0)
      await supabase.from("teachers").update(updates).eq("gmail", normalized);

    return Response.json({ teacher: { gmail: teacher.gmail, name: teacher.name, code: updates.code || teacher.code } });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}
