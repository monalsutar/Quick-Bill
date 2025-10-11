"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../logo.png";

export default function CustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();

  const handleAddAndProceed = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await axios.post("/api/customers", { name, email, phone, address });
      alert(res.data.message);
      router.push(`/proceed?customerId=${res.data.customerId}`);
    } catch (err) {
      if (err.response?.status === 400) {
        const existingRes = await axios.get("/api/customers");
        const existingCustomer = existingRes.data.find(
          (c) => c.email === email || c.phone === phone
        );
        if (existingCustomer) {
          alert("Customer already exists! Proceeding...");
          router.push(`/proceed?customerId=${existingCustomer._id}`);
        }
      } else {
        alert("Error adding customer");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    router.push("/");
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Left Panel - Info + Logo + Logout */}
      <div
        style={{
          flex: 4,
          backgroundColor: "#f3f6ff",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "40px",
        }}
      >
        {/* Logo at Top Right */}
        <div style={{ position: "absolute", top: "30px", left: "30px" }}>
          <Image src={Logo} alt="Logo" width={160} height={40} />
        </div>

        {/* Text Content */}
        <div style={{ maxWidth: "650px" }}>
          <h1 style={{ fontSize: "56px", color: "#222", textAlign: "center" }}>
            Manage Your <span style={{ color: "#0070f3" }}>Customers</span> and{" "}
            <span style={{ color: "green" }}>Bills</span> Effortlessly
          </h1>
          <p
            style={{
              fontSize: "18px",
              color: "#555",
              marginTop: "15px",
              lineHeight: "1.8",
            }}
          >
            Simplify your billing process by adding customer details quickly,
            Generate accurate invoices in just a few clicks!
          </p>
        </div>


      </div>

      {/* Right Panel - Form */}

      {/* Right Panel - Form */}
      <div
        style={{
          flex: 4,
          background: "#80bbffc8",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "30px",
            right: "30px",
            backgroundColor: "#ff4d4d",
            color: "white",
            padding: "10px 18px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "15px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#e04343")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff4d4d")}
        >
          Logout
        </button>

        {/* Form Card */}
        <div
          style={{
            width: "450px",
            backgroundColor: "#fff",
            padding: "40px 35px",
            borderRadius: "15px",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            transition: "transform 0.2s ease",
            
          }}
        >
          <h2
            style={{
              fontSize: "30px",
              marginBottom: "25px",
              color: "#1a1a1a",
              fontWeight: "700",
              letterSpacing: "0.5px",
            }}
          >
            Fill Customer Details
          </h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              marginBottom: "15px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />

          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{
              marginBottom: "25px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              fontSize: "16px",
              width: "90%",
              outline: "none",
              transition: "border-color 0.2s ease",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />

          <button
            onClick={handleAddAndProceed}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#0070f3",
              color: "#fff",
              fontSize: "17px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(0, 112, 243, 0.3)",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#0057c2")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#0070f3")}
          >
            Add Customer & Proceed
          </button>
        </div>
      
      </div>


    </div>
  );
}
