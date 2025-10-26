"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "../logo4.png";
import "./CustomerPage.css";

export default function CustomerPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { data: session } = useSession();
  const [showPopup, setShowPopup] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  const handleAddAndProceed = async () => {
    if (!name || !email || !phone || !address) {
      alert("Please fill all fields!");
      return;
    }

    setLoading(true); // start loader

    const customerData = { name, email, phone, address };

    try {
      if (!navigator.onLine) {
        // Offline: save to localforage queue
        const pendingCustomers = (await localforage.getItem("pendingCustomers")) || [];
        pendingCustomers.push(customerData);
        await localforage.setItem("pendingCustomers", pendingCustomers);
        alert("You're offline! Customer will sync when you're back online.");

        // Optionally redirect immediately using a temp ID
        const tempId = Date.now();
        router.push(`/proceed?customerId=${tempId}`);
      } else {
        // Online: normal API call
        const res = await axios.post("/api/customers", customerData);
        alert(res.data.message);
        router.push(`/proceed?customerId=${res.data.customerId}`);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        // If customer exists, proceed with existing
        const existingRes = await axios.get("/api/customers");
        const existingCustomer = existingRes.data.find(
          (c) => c.email === email || c.phone === phone
        );
        if (existingCustomer) {
          alert("Customer already present! Proceeding with next page...");
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
        <div className="cus-left-panel">
          {/* Logo at Top Right */}
          <div className="logo">
            <Image src={Logo} alt="Logo" className="logo-img" />
          </div>

          {/* Text Content */}
          <div className="customer-text-left">
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
        <div className="cus-right-panel">


          {/* Show "Hi, Merchant" or logged-in name */}
          <div className="merchant-info">
            <button
              className="merchant-name"
              onClick={() => setShowLogout(!showLogout)}
            >
              {session?.user?.name ? `Hi, ${session.user.name}👋` : "Hi, Merchant👋"}
            </button>

            {showLogout && (
              <div className="logout-popup">
                <button
                  className="logout-btn"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logout
                </button>
              </div>
            )}
          </div>


          {/* Form Card */}
          <div className="cus-form-card">
            <h2>
              Fill Customer Details
            </h2>

            <input
              type="text"
              placeholder="Customer Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="email"
              placeholder="Customer Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="text"
              placeholder="Customer Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <input
              type="text"
              placeholder="Customer Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}

              onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
              onBlur={(e) => (e.target.style.borderColor = "#ccc")}
            />

            <button
              onClick={handleAddAndProceed}
              className="cus-add-btn"
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#0057c2")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#0070f3")}
            >
              Add Customer & Proceed
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#555" }}>
            © 2025 QuickBill. All rights reserved.
          </p>

        </div>


      </div>
    </>
  );
}
