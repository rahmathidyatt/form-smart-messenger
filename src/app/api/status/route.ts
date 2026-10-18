import { bridge,checkOrigin,readBody,failure,success,ServiceError } from "@/lib/server/bridge";
import { receiptSchema } from "@/lib/submission";
export const runtime="nodejs";
export async function POST(req:Request){try{checkOrigin(req);const p=receiptSchema.safeParse(await readBody(req));if(!p.success)throw new ServiceError("VALIDATION",400);return success(await bridge("status",p.data));}catch(e){return failure(e);}}
