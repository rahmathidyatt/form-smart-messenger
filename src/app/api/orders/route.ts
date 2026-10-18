import { bridge,checkOrigin,readBody,verifyChallenge,failure,success,ServiceError,configured } from "@/lib/server/bridge";
import { envelopeSchema } from "@/lib/submission";
export const runtime="nodejs";
export async function POST(req:Request){try{checkOrigin(req);if(!configured())throw new ServiceError("NOT_CONFIGURED");const p=envelopeSchema.safeParse(await readBody(req));if(!p.success)throw new ServiceError("VALIDATION",400);await verifyChallenge(p.data.challenge);const {id,token,order}=p.data;return success(await bridge("submit",{id,token,order}),202);}catch(e){return failure(e);}}
