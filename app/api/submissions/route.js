import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");
  const studentGmail = searchParams.get("studentGmail");
  const teacherGmail = searchParams.get("teacherGmail");

  if (assignmentId) {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("assignment_id", assignmentId);
    return Response.json({ submissions: (data || []).map(toSubJS) });
  }

  if (studentGmail) {
    const { data } = await supabase
      .from("submissions")
      .select("*")
      .eq("student_gmail", studentGmail);
    return Response.json({ submissions: (data || []).map(toSubJS) });
  }

  if (teacherGmail) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id")
      .eq("teacher_gmail", teacherGmail);
    const ids = (assignments || []).map(a => a.id);
    if (ids.length === 0) return Response.json({ submissions: [] });

    const { data } = await supabase
      .from("submissions")
      .select("*")
      .in("assignment_id", ids)
      .order("submitted_at", { ascending: false });
    return Response.json({ submissions: (data || []).map(toSubJS) });
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

  const { data: assignment } = await supabase
    .from("assignments")
    .select("deadline")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment) return Response.json({ error: "Даалгавар олдсонгүй" }, { status: 404 });
  if (new Date() > new Date(assignment.deadline)) {
    return Response.json({ error: "Даалгаварын хугацаа дууссан байна" }, { status: 400 });
  }

  let filePath = null;
  if (file && file.size > 0) {
    const ext = (file.name || "file").split(".").pop();
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(filename, buffer, { contentType: file.type || "application/octet-stream" });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(filename);
      filePath = urlData.publicUrl;
    }
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("assignment_id", assignmentId)
    .eq("student_gmail", studentGmail)
    .maybeSingle();

  if (existing) {
    const updates = {
      text,
      submitted_at: new Date().toISOString(),
      score: null,
      graded_at: null,
    };
    if (filePath) updates.file_path = filePath;
    const { data } = await supabase
      .from("submissions")
      .update(updates)
      .eq("id", existing.id)
      .select()
      .single();
    return Response.json({ submission: toSubJS(data) });
  }

  const { data } = await supabase
    .from("submissions")
    .insert({
      id: randomUUID(),
      assignment_id: assignmentId,
      student_gmail: studentGmail,
      text,
      file_path: filePath,
      submitted_at: new Date().toISOString(),
      score: null,
      graded_at: null,
    })
    .select()
    .single();

  return Response.json({ submission: toSubJS(data) });
}

function toSubJS(s) {
  return {
    id: s.id,
    assignmentId: s.assignment_id,
    studentGmail: s.student_gmail,
    text: s.text,
    filePath: s.file_path,
    submittedAt: s.submitted_at,
    score: s.score,
    gradedAt: s.graded_at,
  };
}
