import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Form Order Smart Messenger | Brighton HUB Cibubur",description:"Formulir pemesanan Smart Messenger Brighton HUB Cibubur.",robots:{index:false,follow:false},referrer:"no-referrer"};
export default function Layout({children}:Readonly<{children:React.ReactNode}>){return <html lang="id"><body><a className="skip-link" href="#main">Lewati ke formulir</a><main id="main">{children}</main><footer>BRIGHTON HUB CIBUBUR · Smart Messenger</footer></body></html>}
