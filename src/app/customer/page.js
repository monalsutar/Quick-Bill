"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../logo.png";
import "./CustomerPage.css";

export default function CustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAddAndProceed = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }
    setLoading(true); // start loader
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
    } finally {
      setLoading(false); // stop loader
    }
  };

  const handleLogout = () => {
    // setLoading(true); // start loader
    localStorage.removeItem("loggedInUser");
    router.push("/");

    // setLoading(false); // stop loader

  };

  return (
    <>
      {loading && (
        <div className="loader-backdrop">
          <div className="loader"></div>
        </div>
      )}
      <div className="customer-container">
        {/* Left Panel - Info + Logo + Logout */}
        <div className="left-panel">
          {/* Logo at Top Right */}
          <div className="logo">
            <Image src={Logo} alt="Logo" width={160} height={40} />
          </div>

          {/* Text Content */}
          <div>
            <h1 >
              Manage Your <span style={{ color: "#0070f3" }}>Customers</span> and{" "}
              <span style={{ color: "green" }}>Bills</span> Effortlessly
            </h1>
            <p>
              Simplify your billing process by adding customer details quickly,
              Generate accurate invoices in just a few clicks!
            </p>
          </div>


        </div>

        {/* Right Panel - Form */}

        {/* Right Panel - Form */}
        <div className="right-panel">
          <button
            onClick={handleLogout}
            className="logout-btn"
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#e04343")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#ff4d4d")}
          >
            Logout
          </button>
          {/* Logout Button */}

          {/* Form Card */}
          <div className="form-card">
            <h2>
              Fill Customer Details
            </h2>

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="text"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <button
              onClick={handleAddAndProceed}
              className="add-btn"
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0057c2")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#0070f3")}
            >
              Add Customer & Proceed
            </button>
          </div>



        </div>


      </div>
    </>
  );
}
