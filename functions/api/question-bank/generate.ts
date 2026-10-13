import { verifyIdToken, fetchJwks } from '../../_lib/verifyIdToken';

// Cloudflare Pages Function: POST /api/question-bank/generate
// Тохиргоо (Pages → Settings → Variables and Secrets):
//   GEMINI_API_KEY   (Secret)  — серверийн түлхүүр, зөвхөн админд ашиглуулна
//   FIREBASE_PROJECT_ID        — жишээ: map-edu-orkhon
//   GEMINI_MODEL (заавал биш)  — анхдагч нь хуучин серверт ашиглаж байсан загвар
interface Env { GEMINI_API_KEY?: string; FIREBASE_PROJECT_ID: string; GEMINI_MODEL?: string }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

const SYSTEM = `Та бол Монгол Улсын ерөнхий боловсролын газарзүйн улсын олимпиад, уралдааны шалгалтын тестийн комиссын тэргүүн мэргэжилтэн.
Шалгалтын тестийн материалыг багш шууд хэвлэн авах (Docx, PDF татах) боломжтой цэвэр, чанартай HTML форматаар (<h1>, <h2>, <h3>, <table>, <ol>, <ul>, <li>, <div class="box">, <span class="badge"> ашиглан) буцаана уу.
\`\`\`html эсвэл бусад markdown хашилт БҮҮ ХЭРЭГЛЭ.
Материалд:
1. Тестийн гарчиг, заавар, анги, бүлэг сэдэв
2. Асуултууд: Сонгох даалгавар, Зураг-таавар / Аль нь буруу вэ / Код тайлах солбицол / Силуэт / Логик байршил / Маршрут төлөвлөх даалгаврууд
3. Багшид зориулсан хариултын түлхүүр ба дэлгэрэнгүй тайлбар (Зөв хариу, бодолт, онооны хуваарилалт)
бүгд бүрэн тусгагдсан байна.`;

async function isAdmin(projectId: string, uid: string, idToken: string): Promise<boolean> {
  // Хэрэглэгч өөрийн admins/{uid} баримтыг уншиж чадна (rules). Олдвол админ.
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/admins/${uid}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  return r.status === 200;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const idToken = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!idToken) return json({ success: false, error: 'Нэвтэрнэ үү.' }, 401);

    let who;
    try { who = await verifyIdToken(idToken, env.FIREBASE_PROJECT_ID, await fetchJwks()); }
    catch { return json({ success: false, error: 'Нэвтрэлт хүчингүй байна. Дахин нэвтэрнэ үү.' }, 401); }

    const userKey = request.headers.get('x-gemini-api-key')?.trim();
    let apiKey = userKey || '';
    if (!apiKey) {
      // Серверийн түлхүүрийг зөвхөн админ ашиглана (бусдын хуурч ашиглахаас хамгаалах)
      if (!(await isAdmin(env.FIREBASE_PROJECT_ID, who.uid, idToken)))
        return json({ success: false, error: 'Өөрийн Gemini API түлхүүрээ оруулна уу.' }, 403);
      apiKey = env.GEMINI_API_KEY || '';
    }
    if (!apiKey) return json({ success: false, error: 'Gemini API түлхүүр тохируулаагүй байна.' }, 500);

    const raw = await request.text();
    if (raw.length > 200_000) return json({ success: false, error: 'Хүсэлт хэт том байна.' }, 413);
    const { grade, chapterTitle, count, questionTypes, difficulty, contextData } = JSON.parse(raw);
    const n = Math.min(Math.max(Number(count) || 10, 1), 30);

    const prompt = `Газарзүйн даалгаврын сан үүсгэх хүсэлт:
Анги: ${grade}-р анги
Бүлэг сэдэв: ${chapterTitle || 'Сонгосон бүлэг'}
Даалгаврын тоо: ${n}
Даалгаврын төрлүүд: ${JSON.stringify(questionTypes || ['сонгох', 'зураг-таавар', 'аль нь буруу вэ', 'солбицол'])}
Түвшин: ${difficulty || 'дунд ба ахисан'}
Ашиглах сурах бичиг, эх сурвалжийн өгөгдөл:
${JSON.stringify(contextData, null, 2)}

Багш сурагчдад тарааж өгөхөд бэлэн даалгаврууд ба хариултын хуудсыг маш тодорхой, сайхан загвартай HTML хүснэгт, жагсаалт болгон боловсруулна уу.`;

    const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
    const g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      }),
    });
    const data: any = await g.json();
    if (!g.ok) return json({ success: false, error: data?.error?.message || 'Gemini алдаа буцаалаа.' }, 502);

    let html: string = (data?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('');
    html = html.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    return json({ success: true, contentHtml: html });
  } catch (err: any) {
    return json({ success: false, error: err?.message || 'Алдаа гарлаа' }, 500);
  }
};
