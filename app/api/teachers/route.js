import supabase from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("teachers")
    .select("gmail, name");

  const teachers = (data || []).filter(t => t.gmail.endsWith("@olula.edu.mn"));
  return Response.json({ teachers });
}
