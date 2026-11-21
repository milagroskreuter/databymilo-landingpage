import { Suspense } from "react";
import ChatApp from "./ChatApp";

export const metadata = { title: "Chat IA · Hub" };

export default function Page() {
  return (
    <>
      <div className="adm-header">
        <h1>Chat IA</h1>
      </div>
      <Suspense fallback={<div className="adm-content"><p className="adm-empty">Cargando…</p></div>}>
        <ChatApp />
      </Suspense>
    </>
  );
}
