"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Logo from "../logo.png"; // adjust path if logo is elsewhere
import "../globals.css";

export default function CustomerLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/"); // redirect to login
  };

  return (
    <div>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          borderBottom: "1px solid #ccc",
          margin: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image src={Logo} alt="Logo" width={150} height={40} />
          
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "6px 12px",
            backgroundColor: "#ff5555",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </header>

      <main>{children}</main>
    </div>
  );
}
