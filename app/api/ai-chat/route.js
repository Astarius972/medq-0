import OpenAI from "openai";

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function POST(request) {
  const { message, history = [] } = await request.json();

  if (!message?.trim()) {
    return Response.json({ error: "Асуулт хоосон байна" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "AI тохиргоо алдаатай байна" }, { status: 500 });
  }

  const messages = [
    {
      role: "system",
      content: `Та Монгол сургуулийн сурагчдад хичээл заах AI туслах юм.
Сурагчдын асуултад монгол хэлээр хариулна уу.
Математик, физик, хими, биологи, түүх, монгол хэл болон бусад хичээлүүдэд тусалж чадна.
Тайлбарыг энгийн, ойлгомжтой үгээр хий.
Хэрэв тооцооллын бодлого байвал алхам алхмаар тайлбарла.

ЧУХАЛ ДҮРЭМ: LaTeX томъёо ОГТХОН хэрэглэж болохгүй. \\( \\), \\[ \\], $ $ тэмдэгт ашиглахгүй.
Математик тэмдэгтийг энгийн текстээр бич:
- Зэрэг: x² гэж бич (x^2 биш)
- Үржвэр: 2×3 гэж бич
- Хуваалт: (a+b)/2c гэж бич
- Язгуур: √64 гэж бич
- Хасах: −b гэж бич
- Тэгшитгэл: x = (−b ± √(b²−4ac)) / 2a гэж бич
Тоо бодолтыг алхам алхмаар, тодорхой, энгийн хэлбэрээр бич.`,
    },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  try {
    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages,
    });
    const reply = response.choices[0]?.message?.content || "Хариулт олдсонгүй";
    return Response.json({ reply });
  } catch (err) {
    return Response.json({ error: "AI алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}
