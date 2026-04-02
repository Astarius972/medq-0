import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherGmail = searchParams.get("teacherGmail");
    const studentGmail = searchParams.get("studentGmail");

    if (teacherGmail && studentGmail) {
      const tg = teacherGmail.toLowerCase().trim();
      const sg = studentGmail.toLowerCase().trim();

      // Fetch by each sender separately — single .eq() is most reliable
      const [fromTeacher, fromStudent] = await Promise.all([
        supabase.from("messages").select("*").eq("from_gmail", tg),
        supabase.from("messages").select("*").eq("from_gmail", sg),
      ]);

      const data = [
        ...(fromTeacher.data || []).filter(m => m.to_gmail?.toLowerCase().trim() === sg),
        ...(fromStudent.data || []).filter(m => m.to_gmail?.toLowerCase().trim() === tg),
      ].sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

      return Response.json({ messages: data.map(toMsgJS) });
    }

    if (teacherGmail) {
      const tg = teacherGmail.toLowerCase().trim();
      const [sent, received] = await Promise.all([
        supabase.from("messages").select("*").eq("from_gmail", tg),
        supabase.from("messages").select("*").eq("to_gmail", tg),
      ]);
      const seen = new Set();
      const data = [...(sent.data || []), ...(received.data || [])]
        .filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; })
        .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
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
      id: randomUUID(),
      from_gmail: fromGmail.toLowerCase().trim(),
      to_gmail: toGmail.toLowerCase().trim(),
      text: text.trim(),
      sent_at: new Date().toISOString(),
    }).select().single();

    if (error || !data)
      return Response.json({ error: "Мессеж хадгалахад алдаа гарлаа: " + (error?.message || "unknown") }, { status: 500 });

    // Broadcast to recipient's realtime channel for instant delivery
    try {
      const ch = supabase.channel(`chat:${data.to_gmail}`);
      await ch.send({ type: "broadcast", event: "new_message", payload: toMsgJS(data) });
      await supabase.removeChannel(ch);
    } catch (_) { /* broadcast failure is non-critical */ }

    return Response.json({ message: toMsgJS(data) });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}

function toMsgJS(m) {
  return { id: m.id, fromGmail: m.from_gmail, toGmail: m.to_gmail, text: m.text, sentAt: m.sent_at };
}
