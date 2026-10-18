"use client";
import { useEffect, useRef, useState } from "react";
import {useForm,useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {agentFormSchema,type AgentFormInput} from "@/lib/agent-form";
import {Send,CheckCircle2,Info} from "lucide-react";
import {receiptSchema,type OrderInput,type Receipt} from "@/lib/submission";
import {units,services} from "@/lib/catalog";
import {jakartaDate} from "@/lib/utils";
import {Challenge} from "@/components/challenge";
const storageKey="smart-messenger-pending-v3";
const initial:AgentFormInput={email:"",nameCode:"",unit:"",date:"",address:"",maps:"",task:"",other:"",owner:"",consent:false};
type Attempt={receipt:Receipt;order:OrderInput};
export function Brand(){return <div className="brand-row"><div className="brand">BRIGHT<span>O</span>N<small>HUB CIBUBUR</small></div><span className="tag">Smart Messenger</span></div>}
export function SimpleForm({ready}:{ready:boolean}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[sent,setSent]=useState(false);
 const [challenge,setChallenge]=useState(""),[challengeKey,setChallengeKey]=useState(0);
 const attempt=useRef<Attempt|null>(null),inFlight=useRef(false);
 const {register,handleSubmit,control,reset,formState:{errors}}=useForm<AgentFormInput,unknown,OrderInput>({resolver:zodResolver(agentFormSchema),defaultValues:initial,mode:"onSubmit"});
 const task=useWatch({control,name:"task"});const owner=useWatch({control,name:"owner"});
 useEffect(()=>{try{const raw=sessionStorage.getItem(storageKey);if(!raw)return;const saved=JSON.parse(raw);if(!receiptSchema.safeParse(saved.receipt).success)return;
 const {name,code,...rest}=saved.order;const ui={...rest,nameCode:code?name+" "+code:name};
 if(!agentFormSchema.safeParse(ui).success)return;attempt.current=saved;reset(ui);
 }catch{}},[reset]);
 async function request(path:string,body:unknown){const res=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(35000)});return res.json();}
 function complete(){attempt.current=null;try{sessionStorage.removeItem(storageKey);sessionStorage.removeItem("smart-messenger-receipt-v2");}catch{}reset(initial);setSent(true);setMessage("");}
 async function submit(order:OrderInput){
 if(inFlight.current)return;if(!challenge){setMessage("Selesaikan verifikasi keamanan terlebih dahulu.");return;}
 inFlight.current=true;setBusy(true);setSent(false);setMessage("");
 // Retain the exact request and payload across retries and refreshes.
 let current=attempt.current;
 if(current&&JSON.stringify(current.order)!==JSON.stringify(order)){
   // An explicitly changed order is a new request; keep the previous receipt for support.
   try{const history=JSON.parse(sessionStorage.getItem("smart-messenger-previous-attempts")||"[]");sessionStorage.setItem("smart-messenger-previous-attempts",JSON.stringify([...history,current.receipt].slice(-10)));}catch{}
   current=null;
 }
 if(!current){current={receipt:{id:crypto.randomUUID(),token:Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,"0")).join("")},order};attempt.current=current;}
 try{sessionStorage.setItem(storageKey,JSON.stringify(current));}catch{}
 try{
 const data=await request("/api/orders",{...current.receipt,order:current.order,challenge,website:""});
 if(data.ok&&data.data?.state==="synced"&&data.data?.responseId){complete();return;}
 if(!data.ok){
 const messages:Record<string,string>={CHALLENGE:"Verifikasi kedaluwarsa. Silakan verifikasi kembali.",VALIDATION:"Periksa kembali kolom yang wajib diisi.",RATE_LIMIT:"Terlalu banyak permintaan. Silakan coba lagi dalam 15 menit.",NOT_CONFIGURED:"Pengiriman belum tersedia. Silakan hubungi staf kantor.",ORIGIN:"Alamat website belum sesuai konfigurasi. Silakan hubungi staf kantor.",UNAUTHORIZED:"Koneksi pengiriman belum siap. Silakan hubungi staf kantor.",CONFLICT:"Pesanan sebelumnya perlu diperiksa staf kantor."};
 // These failures occur before a new submission is stored; allow corrections.
 if(["CHALLENGE","VALIDATION","RATE_LIMIT","NOT_CONFIGURED","ORIGIN","UNAUTHORIZED"].includes(data.code)){attempt.current=null;try{sessionStorage.removeItem(storageKey);}catch{}}
 if(messages[data.code]){setMessage(messages[data.code]);return;}
 }
 for(let i=0;i<4;i++){
 await new Promise(resolve=>setTimeout(resolve,2000));
 const status=await request("/api/status",current.receipt);
 if(status.ok&&status.data?.state==="synced"&&status.data?.responseId){complete();return;}
 if(status.ok&&["needs_review","failed"].includes(status.data?.state))break;
 }
 setMessage("Pengiriman belum terkonfirmasi. Isian Anda tetap tersimpan. Silakan hubungi staf kantor jika belum berhasil.");
 }catch{setMessage("Koneksi pengiriman terganggu. Isian Anda tetap tersimpan dan dapat dicoba kembali.");}
 finally{setBusy(false);inFlight.current=false;setChallenge("");setChallengeKey(k=>k+1);}
 }
 function err(field:keyof AgentFormInput){return errors[field]?<span className="error" id={field+"-error"} role="alert">{errors[field]?.message}</span>:null;}
 function a11y(field:keyof AgentFormInput){return {"aria-invalid":!!errors[field],"aria-describedby":errors[field]?field+"-error":undefined};}
 return <div className="shell"><header className="card intro"><Brand/><h1>Form Order Smart Messenger</h1><p>Lengkapi formulir berikut untuk mengajukan layanan Smart Messenger.</p><h2>Tarif & ketentuan layanan</h2><div className="terms"><p><b>Perjalanan:</b> total jarak pulang-pergi × Rp900.</p><p><b>Pasang banner:</b> biaya perjalanan + Rp5.000 per banner.</p><ul><li>Jarak pemasangan banner maksimal 25 km. Konfirmasikan lokasi dengan staf kantor.</li><li>Tinggi pemasangan maksimal 4 meter.</li><li>Pembayaran di awal sebelum pekerjaan dimulai. Hubungi staf cabang untuk instruksi pembayaran.</li><li>Cantumkan alamat lengkap. Foto properti yang jelas dapat disampaikan kepada staf kantor.</li></ul><p>Jadwal dan biaya akan dikonfirmasi oleh staf kantor.</p></div></header>
 {!ready&&<div className="notice"><Info size={19}/><p>Pengiriman belum tersedia. Silakan hubungi staf kantor untuk pemesanan.</p></div>}
 {sent&&<section className="card receipt" role="status"><h2><CheckCircle2 size={22}/> Pesanan berhasil dikirim</h2></section>}
 <form noValidate onSubmit={event=>{void handleSubmit(submit)(event);}}><fieldset disabled={busy} className="form-fields"><section className="card"><h2>Data pemesan</h2><p className="help">Tanda <span className="required">*</span> wajib diisi.</p><label htmlFor="email">Email pemesan <span className="required">*</span><input id="email" type="email" autoComplete="email" {...register("email")} {...a11y("email")}/>{err("email")}</label><label htmlFor="nameCode">Nama dan Kode Agent <span className="required">*</span><input id="nameCode" {...register("nameCode")} {...a11y("nameCode")}/>{err("nameCode")}</label><label htmlFor="unit">Unit Brighton <span className="required">*</span><select id="unit" {...register("unit")} {...a11y("unit")}><option value="">Pilih unit</option>{units.map(u=><option key={u}>{u}</option>)}</select>{err("unit")}</label></section>
 <section className="card"><h2>Detail penugasan</h2><label htmlFor="date">Estimasi tanggal pengerjaan <span className="required">*</span><input id="date" type="date" min={jakartaDate()} {...register("date")} {...a11y("date")}/>{err("date")}</label><label htmlFor="address">Alamat lengkap <span className="required">*</span><textarea id="address" rows={3} placeholder="Jalan / perumahan, blok, nomor rumah, kecamatan, kota" {...register("address")} {...a11y("address")}/>{err("address")}</label><label htmlFor="maps">Share location / Google Maps <small>Opsional</small><input id="maps" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder="Tempel tautan Google Maps jika ada" {...register("maps")} {...a11y("maps")}/>{err("maps")}<small>Boleh dikosongkan atau diisi tanda strip (-).</small></label><label htmlFor="task">Tugas messenger <span className="required">*</span><select id="task" {...register("task")} {...a11y("task")}><option value="">Pilih tugas</option>{services.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}</select>{err("task")}</label><label htmlFor="other">Tugas lainnya / penjelasan tambahan {task==="other"?<span className="required">*</span>:<small>Opsional</small>}<textarea id="other" rows={2} placeholder="Jelaskan jika tugas tidak tersedia di daftar" {...register("other")} {...a11y("other")}/>{err("other")}</label><fieldset className="owner"><legend>Sudah konfirmasi pemilik/owner? <span className="required">*</span></legend><label><input type="radio" value="YA" {...register("owner")}/> Ya</label><label><input type="radio" value="TIDAK" {...register("owner")}/> Tidak</label>{err("owner")}{owner==="TIDAK"&&<p className="help">Mohon konfirmasikan izin owner sebelum pekerjaan dilaksanakan.</p>}</fieldset></section>
 <section className="card"><label className="consent"><input type="checkbox" {...register("consent")} {...a11y("consent")}/><span>Saya menyetujui penggunaan data untuk pemrosesan layanan Smart Messenger.</span></label>{err("consent")}<p className="help">Pastikan data yang diisi sudah benar.</p></section></fieldset>
 {ready&&<div className="card"><Challenge key={challengeKey} onToken={setChallenge}/></div>}
 {message&&<div className="notice" role="alert"><Info size={20}/><p>{message}</p></div>}
 <div className="submit-row"><button className="primary" disabled={!ready||busy||!challenge} type="submit"><Send size={18}/>{busy?"Mengirim…":"Kirim pesanan"}</button><button type="button" className="text-button" disabled={busy} onClick={()=>{reset(initial);setMessage("");setSent(false);}}>Kosongkan formulir</button></div>
 </form></div>;
}
