import { z } from "zod";
import { orderSchema } from "./submission";

// A single visible field; retain the existing gateway payload contract.
const identity = /^(.*?)\s*\(([a-zA-Z0-9-]{1,30})\)$/;
export const agentFormSchema = z.object(orderSchema.shape).omit({name:true,code:true}).extend({
  nameCode:z.string().trim().max(153).refine(value=>{
    const match=identity.exec(value);
    return !!match && match[1].trim().length>=2 && match[1].trim().length<=120;
  },"Isi nama dan kode agent, contoh: Rahmat Hidayat (ABCD).")
}).transform(({nameCode,...rest})=>{
  const match=identity.exec(nameCode)!;
  return {...rest,name:match[1].trim(),code:match[2]};
}).pipe(orderSchema);
export type AgentFormInput=z.input<typeof agentFormSchema>;
