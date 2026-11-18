"use client";
import { usePathname } from "next/navigation";
import NewsletterPopup from "./NewsletterPopup";
import NewsletterBar from "./NewsletterBar";

export default function PublicOnlyWidgets() {
  const pathname = usePathname();
  if (pathname?.startsWith("/administracion-general")) return null;
  return (
    <>
      <NewsletterPopup />
      <NewsletterBar />
    </>
  );
}
