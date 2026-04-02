import OpenAI from "openai";

let _client = null;
function getClient() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function POST(request) {
  try {
    const { topic } = await request.json();

    if (!topic?.trim())
      return Response.json({ error: "Сэдэв оруулна уу" }, { status: 400 });

    if (!process.env.OPENAI_API_KEY)
      return Response.json({ error: "AI тохиргоо алдаатай байна" }, { status: 500 });

    const prompt = `Та Монгол сургуулийн багш нарт зориулсан хичээлийн материал боловсруулдаг AI туслах юм.

Сэдэв: "${topic}"

Дараах бүтэцтэйгээр монгол хэлээр дэлгэрэнгүй тайлбарла:

## Тодорхойлолт
(Хэдэн өгүүлбэрээр энгийн тайлбар)

## Гол ойлголтууд
(3-5 гол цэг, товч тайлбартай)

## Дэлгэрэнгүй тайлбар
(Алхам алхмаар, ойлгомжтойгоор)

## Жишээ
(2-3 бодит жишээ)

## Сурагчдад тавих асуултууд
(3-5 шалгах асуулт)

ЧУХАЛ: LaTeX томъёо огт хэрэглэхгүй. Математик тэмдэгтийг x², √, ±, × гэх мэт Unicode-оор бич.`;

    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "Та Монгол сургуулийн хичээлийн материал боловсруулдаг мэргэжилтэн AI юм. Бүх хариултаа монгол хэлээр, тодорхой бүтэцтэйгээр бич. LaTeX хэрэглэж болохгүй.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || "Хариулт олдсонгүй";
    return Response.json({ content, topic });
  } catch (err) {
    return Response.json({ error: "AI алдаа: " + (err?.message || "unknown") }, { status: 500 });
  }
}
