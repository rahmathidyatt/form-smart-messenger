"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
export function Navigation(){const path=usePathname();return <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Brighton HUB Cibubur, beranda">BRIGHT<span>O</span>N<small>HUB CIBUBUR</small></Link><nav aria-label="Navigasi utama">{[["/","Beranda"],["/pemesanan","Buat pesanan"],["/riwayat","Riwayat"]].map(([href,label])=><Link key={href} href={href} aria-current={path===href?"page":undefined}>{label}</Link>)}</nav><Button asChild variant="outline"><Link href="/masuk">Masuk <ArrowUpRight size={16}/></Link></Button></div></header>}
