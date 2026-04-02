import supabase from "@/lib/supabase";

export async function GET() {
  try {
    const { data } = await supabase.from("teachers").select("gmail, name");
    const teachers = (data || []).filter(t => t.gmail.endsWith("@olula.edu.mn"));
    return Response.json({ teachers });
  } catch (err) {
    return Response.json({ error: "Серверийн алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}
