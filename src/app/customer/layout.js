"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Logo from "../logo.png"; // adjust path if logo is elsewhere
import "../globals.css";

export default function CustomerLayout({ children }) {
  
  return (
    <div>
      <main>{children}</main>
    </div>
  );
}
