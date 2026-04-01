import supabase from "@/lib/supabase";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const { score } = await request.json();

  if (score === undefined || score === null || Number(score) < 0 || Number(score) > 100) {
    return Response.json({ error: "0-100 хооронд оноо оруулна уу" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .update({ score: Number(score), graded_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: "Илгээлт олдсонгүй" }, { status: 404 });
  }

  return Response.json({
    submission: {
      id: data.id,
      assignmentId: data.assignment_id,
      studentGmail: data.student_gmail,
      text: data.text,
      filePath: data.file_path,
      submittedAt: data.submitted_at,
      score: data.score,
      gradedAt: data.graded_at,
    },
  });
}
