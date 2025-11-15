"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Logo from "../logo4.png";
import "./CustomerPage.css";

export default function CustomerPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddAndProceed = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("/api/customers", { name, email, phone, address });
      const data = res.data;

      // ✅ Message will say whether it existed or was added
      alert(data.message);

      // ✅ Proceed to next page either way
      router.push(`/proceed?customerId=${data.customerId}`);
    } catch (err) {
      console.error("❌ Error:", err.response?.data || err.message);
      
      alert("Error adding customer!");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="customer-layout">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <Image src={Logo} alt="QuickBill Logo" />
        </div>


        <button className="back-btn" onClick={() => router.push("/userDashboard")}>
          ← <span>Back to Dashboard</span>
        </button>

        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{session?.user?.name || "User"}</span>
            <span className="user-role">{session?.user?.email || "user@gmail.com"}</span>
          </div>
          <img
            src={session?.user?.image || "/user.png"}
            alt="User"
            className="user-avatar"
          />
        </div>
      </header>


      {/* Main */}
      <main className="customer-main">
        <div className="customer-card">
          <div className="image-section">
            <img
              // src="\customer.png"
              src="https://img.freepik.com/free-vector/hand-drawn-flat-design-sales-representative-illustration_23-2149347412.jpg?semt=ais_hybrid&w=740&q=80"
              alt="Customer Illustration"
              className="customer-image"
            />
          </div>
          <div className="form-section">
            <h1>Add New <span>Customer</span></h1>
            <p>Save your customer details to generate bills easily.</p>

            <div className="input-group">
              <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            <button className="customer-submit-btn" onClick={handleAddAndProceed}>
              ➕ Add Customer & Proceed
            </button>
          </div>


        </div>
      </main>

      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
}
