import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("teacherGmail");
  const studentGmail = searchParams.get("studentGmail");

  if (teacherGmail && studentGmail) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(from_gmail.eq.${teacherGmail},to_gmail.eq.${studentGmail}),and(from_gmail.eq.${studentGmail},to_gmail.eq.${teacherGmail})`
      )
      .order("sent_at", { ascending: true });
    return Response.json({ messages: (data || []).map(toMsgJS) });
  }

  if (teacherGmail) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`from_gmail.eq.${teacherGmail},to_gmail.eq.${teacherGmail}`)
      .order("sent_at", { ascending: true });
    return Response.json({ messages: (data || []).map(toMsgJS) });
  }

  return Response.json({ messages: [] });
}

export async function POST(request) {
  const { fromGmail, toGmail, text } = await request.json();

  if (!fromGmail || !toGmail || !text?.trim()) {
    return Response.json({ error: "Мэдээлэл дутуу байна" }, { status: 400 });
  }

  const { data } = await supabase
    .from("messages")
    .insert({
      id: randomUUID(),
      from_gmail: fromGmail,
      to_gmail: toGmail,
      text: text.trim(),
      sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  return Response.json({ message: toMsgJS(data) });
}

function toMsgJS(m) {
  return {
    id: m.id,
    fromGmail: m.from_gmail,
    toGmail: m.to_gmail,
    text: m.text,
    sentAt: m.sent_at,
  };
}
