export async function GET() {
  return Response.json({ code: process.env.SCHOOL_CODE || "OLULA" });
}
