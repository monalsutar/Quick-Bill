"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";
import { signIn, signOut, useSession } from "next-auth/react";

// import Logo from "./logo.png";
// import axios from "axios";
import localforage from "localforage";
import Head from "next/head";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");  // 🆕
  const [adminPass, setAdminPass] = useState("");    // 🆕


  //offline
  async function handleSubmit(e) {
    e.preventDefault();
    const data = { username, password }; // or bill details

    try {
      await axios.post("/api/login", data);
      alert("Login successful!");
    } catch (error) {
      if (!navigator.onLine) {
        // Save the request data offline
        const pendingRequests = (await localforage.getItem("pendingLogins")) || [];
        pendingRequests.push(data);
        await localforage.setItem("pendingLogins", pendingRequests);
        alert("You're offline! We'll sync once you're back online.");
      } else {
        alert("Error: " + error.message);
      }
    }
  }

  // worker login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // start loader
    try {
      const res = await axios.post("/api/login", { email, pass });
      if (res.status === 200) {
        alert("Login Successful ✅");
        router.push("/customer");
      }
    } catch (err) {
      if (err.response?.status === 404) {
        alert("User not found! Please create an account first.");
      } else if (err.response?.status === 401) {
        alert("Incorrect password ❌");
      } else {
        alert("Something went wrong!");
      }
    } finally {
      setLoading(false); // stop loader
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); // start loader
    try {
      const res = await axios.post("/api/users", { email, pass });
      if (res.status === 200) {
        alert("Account created successfully! Now you can login.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Signup failed or user already exists.");
      console.error(err);
    } finally {
      setLoading(false); // stop loader
    }
  };


  //Admin login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/api/admin/login", {
        email: adminEmail,
        pass: adminPass,
      });
      if (res.status === 200) {
        alert("Admin login successful 👑");
        router.push("/admin");
      }
    } catch (err) {
      alert("Invalid admin credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (<>

    {loading && (
      <div className="loader-backdrop">
        <div className="loader"></div>
      </div>
    )}


    <div className="split-screen">
      <div className="left-panel">
        <img src="./logo4.png" alt="Logo" className="logo" />
        <h1 className="promo-text">
          Simplify Your <span className="highlight">Billing</span>, Boost Your Business with <span className="highlight">QuickBill</span>.
        </h1>



        {/* 🆕 Admin icon/button */}
        <button
          onClick={() => setShowAdminLogin(!showAdminLogin)}
          style={{
            marginTop: "25px",
            background: "#0084ffea",
            color: "white",
            padding: "8px 8px",
            // borderRadius: "8px",
            cursor: "pointer",
            width: "30%",
          }}
        >
          Admin Login 🤵
        </button>


      </div>

      <div className="right-panel">
        {showAdminLogin ? ( // 🆕 condition to show admin form
          <>
            <h2>🔒 Admin Login 🔒</h2>
            <form onSubmit={handleAdminLogin} className="login-form">
              <input
                type="email"
                placeholder="Enter Admin Email "
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter Admin Password"
                onChange={(e) => setAdminPass(e.target.value)}
                required
              />
              <button type="submit" style={{ backgroundColor: "green" }}>Login as Admin</button>

            </form>

            <p className="switch">
              <span
                onClick={() => setShowAdminLogin(false)}
                style={{ cursor: "pointer", color: "#0070f3" }}
              >
                ← Back to User Login
              </span>
            </p>
          </>
        ) : isLogin ? ( // your existing user login form
          <>
            <h2>Welcome to Quick Bill</h2>
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="email"
                placeholder="Enter Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter Password"
                onChange={(e) => setPass(e.target.value)}
                required
              />
              <button type="submit">Login</button>
            </form>

            <br></br>
            <button
              onClick={() => signIn("google", { callbackUrl: "/customer" })}
              className="google-btn"
            >
              <img src="/goog.png" alt="Google logo" />
              Sign in with Google
            </button>

            <p className="switch">
              Don’t have an account?{" "}
              <span onClick={() => setIsLogin(false)}>Create account</span>
            </p>
          </>
        ) : ( // your signup form
          <>
            <h2>Create a New Account</h2>
            <form onSubmit={handleSignup} className="login-form">
              <input
                type="email"
                placeholder="Enter your Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Enter your Password"
                onChange={(e) => setPass(e.target.value)}
                required
              />
              <button type="submit">Sign Up</button>
            </form>

            <br></br>

            <button
              onClick={() => signIn("google", { callbackUrl: "/customer" })}
              className="google-btn">

              <img src="/goog.png" alt="Google logo" />
              Sign in with Google
            </button>

            <p className="switch">
              Already have an account?{" "}
              <span onClick={() => setIsLogin(true)}>Login here</span>
            </p>
          </>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "12px", color: "#555" }}>
          © 2025 QuickBill. All rights reserved.
        </p>


      </div>

    </div>
  </>
  );
}
