import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const teacherGmail = searchParams.get("teacherGmail");
  const studentTeacherGmail = searchParams.get("studentTeacherGmail");
  const grade = searchParams.get("grade");

  if (teacherGmail) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .eq("teacher_gmail", teacherGmail)
      .order("created_at", { ascending: false });

    const { data: submissions } = await supabase.from("submissions").select("assignment_id");
    const subCounts = (submissions || []).reduce((m, s) => {
      m[s.assignment_id] = (m[s.assignment_id] || 0) + 1;
      return m;
    }, {});

    return Response.json({
      assignments: (assignments || []).map(a => ({
        ...toAssignmentJS(a),
        submissionCount: subCounts[a.id] || 0,
      })),
    });
  }

  if (studentTeacherGmail && grade) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .eq("teacher_gmail", studentTeacherGmail)
      .eq("grade", Number(grade));
    return Response.json({ assignments: (assignments || []).map(toAssignmentJS) });
  }

  if (grade) {
    // All @olula.edu.mn teachers' assignments for this grade
    const { data: teachers } = await supabase
      .from("teachers")
      .select("gmail");
    const teacherGmails = (teachers || [])
      .map(t => t.gmail)
      .filter(g => g.endsWith("@olula.edu.mn"));

    const { data: assignments } = await supabase
      .from("assignments")
      .select("*")
      .in("teacher_gmail", teacherGmails)
      .eq("grade", Number(grade));
    return Response.json({ assignments: (assignments || []).map(toAssignmentJS) });
  }

  return Response.json({ assignments: [] });
}

export async function POST(request) {
  const { teacherGmail, grade, title, description, deadline, points } = await request.json();

  if (!teacherGmail || !grade || !title || !deadline) {
    return Response.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .insert({
      id: randomUUID(),
      teacher_gmail: teacherGmail,
      grade: Number(grade),
      title: title.trim(),
      description: (description || "").trim(),
      deadline,
      points: Number(points) || 100,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  return Response.json({ assignment: toAssignmentJS(assignment) });
}

function toAssignmentJS(a) {
  return {
    id: a.id,
    teacherGmail: a.teacher_gmail,
    grade: a.grade,
    title: a.title,
    description: a.description,
    deadline: a.deadline,
    points: a.points,
    createdAt: a.created_at,
  };
}
