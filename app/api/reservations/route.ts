import { getRawDb } from "@/db/raw";
import { siteContent } from "@/lib/site-content";
export async function POST(request: Request) {
  try {
    if (request.headers.get("origin") && new URL(request.headers.get("origin")!).origin !== new URL(request.url).origin) return Response.json({error:"请求来源无效。"},{status:403});
    const raw = await request.text();
    if (raw.length > 6000) return Response.json({error:"提交内容过长。"},{status:413});
    let payload;
    try { payload = JSON.parse(raw); } catch { return Response.json({error:"提交内容格式错误。"},{status:400}); }
    if (!payload || typeof payload !== "object") return Response.json({error:"提交内容无效。"},{status:400});
    const { id, name, contact, stage, question = "", consent } = payload;
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || typeof name !== "string" || !name.trim() || name.length > 40 || typeof contact !== "string" || contact.trim().length < 5 || contact.length > 80 || typeof stage !== "string" || !siteContent.stages.includes(stage) || typeof question !== "string" || question.length > 500 || consent !== true) return Response.json({error:"请填写有效的称呼、联系方式与当前阶段，并同意信息使用说明。"},{status:400});
    await getRawDb().prepare("INSERT INTO reservations (id, name, contact, stage, question, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING").bind(id,name.trim(),contact.trim(),stage,question.trim(),"pending_contact",Date.now()).run();
    return Response.json({id},{status:201,headers:{"Cache-Control":"no-store"}});
  } catch (error) {
    console.error("Reservation save failed", error instanceof Error ? error.message : "Unknown storage failure");
    return Response.json({error:"预约暂时无法保存，请稍后重试。你填写的内容会保留在当前表单中。"},{status:503});
  }
}
