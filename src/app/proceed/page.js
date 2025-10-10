"use client";

import { useRouter } from "next/navigation";

export default function ProceedPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/customer");
  };

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "100px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>✅ Customer Data Saved Successfully!</h1>
      <p style={{ marginTop: "10px" }}>
        You can now proceed with further actions or add another customer.
      </p>

      <button
        onClick={handleBack}
        style={{
          marginTop: "30px",
          padding: "10px 20px",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Back to Customer Page
      </button>
    </div>
  );
}
