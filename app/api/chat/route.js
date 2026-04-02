import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherGmail = searchParams.get("teacherGmail");
    const studentGmail = searchParams.get("studentGmail");

    if (teacherGmail && studentGmail) {
      const [r1, r2] = await Promise.all([
        supabase.from("messages").select("*").eq("from_gmail", teacherGmail).eq("to_gmail", studentGmail),
        supabase.from("messages").select("*").eq("from_gmail", studentGmail).eq("to_gmail", teacherGmail),
      ]);
      const data = [...(r1.data || []), ...(r2.data || [])].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      return Response.json({ messages: data.map(toMsgJS) });
    }

    if (teacherGmail) {
      const [r1, r2] = await Promise.all([
        supabase.from("messages").select("*").eq("from_gmail", teacherGmail),
        supabase.from("messages").select("*").eq("to_gmail", teacherGmail),
      ]);
      const data = [...(r1.data || []), ...(r2.data || [])].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      return Response.json({ messages: data.map(toMsgJS) });
    }

    return Response.json({ messages: [] });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { fromGmail, toGmail, text } = await request.json();

    if (!fromGmail || !toGmail || !text?.trim())
      return Response.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });

    const { data, error } = await supabase.from("messages").insert({
      id: randomUUID(), from_gmail: fromGmail, to_gmail: toGmail,
      text: text.trim(), sent_at: new Date().toISOString(),
    }).select().single();

    if (error || !data)
      return Response.json({ error: "Мессеж хадгалахад алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });

    return Response.json({ message: toMsgJS(data) });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}

function toMsgJS(m) {
  return { id: m.id, fromGmail: m.from_gmail, toGmail: m.to_gmail, text: m.text, sentAt: m.sent_at };
}
