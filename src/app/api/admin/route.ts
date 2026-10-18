import { bridge,checkOrigin,readBody,failure,success,ServiceError,requireAdmin } from "@/lib/server/bridge";
import { z } from "zod";
export const runtime="nodejs";
export async function POST(req:Request){try{checkOrigin(req);requireAdmin(req);const p=z.discriminatedUnion("action",[z.object({action:z.literal("dashboard")}).strict(),z.object({action:z.enum(["ack","retry"]),id:z.string().uuid()}).strict()]).safeParse(await readBody(req));if(!p.success)throw new ServiceError("VALIDATION",400);return success(await bridge(p.data.action,p.data));}catch(e){return failure(e);}}
