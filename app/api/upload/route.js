import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file) return Response.json({ error: "Файл байхгүй" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `assignments/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("uploads").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return Response.json({ url: data.publicUrl });
}
