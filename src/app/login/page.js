"use client";

import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";
import { signIn, signOut, useSession } from "next-auth/react";
import { ToastContainer, toast } from 'react-toastify';


// import Logo from "./logo.png";
// import axios from "axios";
import localforage from "localforage";
import Head from "next/head";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [isLogin, setIsLogin] = useState(true); // true = login, false = signup
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");  // 🆕
  const [adminPass, setAdminPass] = useState("");    // 🆕

  // const login_sucess_toast = () => toast("Login Sucessful ! 😀");


  //offline
  async function handleSubmit(e) {
    e.preventDefault();
    const data = { username, password }; // or bill details

    try {
      await axios.post("/api/login", data);
      toast.success("User Login Successful ✅");

    } catch (error) {
      if (!navigator.onLine) {
        // Save the request data offline
        const pendingRequests = (await localforage.getItem("pendingLogins")) || [];
        pendingRequests.push(data);
        await localforage.setItem("pendingLogins", pendingRequests);

        toast.error("You're offline! We'll sync once you're back online.");
      } else {
        toast.error("Error: " + error.message);
      }
    }
  }

  // worker login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      name,
      email,
      password: pass,  // use the same field name defined in authOptions
      callbackUrl: "/userDashboard",
    });

    setLoading(false);

    if (result?.error) {
      alert(result.error);
    } else {
      
      toast.success("User Login Successful ✅");
      setTimeout(() => {
        router.push("/userDashboard");
      }, 1200);   // 1.2 seconds
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); // start loader
    try {
      const res = await axios.post("/api/users", { name, phone, email, pass });
      if (res.status === 200) {
       
        toast.success("Account created successfully! Now you can login.");

        setIsLogin(true);
      }
    } catch (err) {
      
      toast.error("Invalid admin credentials ❌");

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
        
        toast.success("Admin login successful ✅");
        setTimeout(() => {
          router.push("/admin");
        }, 1200);   // 1.2 seconds
        // router.push("/admin");
      }
    } catch (err) {
     
      toast.error("Invalid admin credentials ❌");

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

    <div className="split-screen-login">
      <ToastContainer />
      <div className="left-panel-login">
        <img src="./logo4.png" alt="Logo" className="logo-login" /><br></br>

        <h1 className="promo-text-login">
          Simplify Your <span className="highlight">Billing</span>, Boost Your Business with <span className="highlight">QuickBill</span>.
        </h1>

        <br></br><br></br>

        {/* 🆕 Admin icon/button */}
        <button
          onClick={() => setShowAdminLogin(!showAdminLogin)}
          className="admin-login-button"

        >
          {showAdminLogin ? "User Login 👤" : "Admin Login 🤵"}
        </button>


      </div>

      <div className="right-panel-login">
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
              onClick={() => {
                toast.success("User Login Successful!🎉");
                setTimeout(() => {

                  signIn("google", { callbackUrl: "/userDashboard" });
                }, 1200);
              }}
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

              <input
                type="text"
                placeholder="Enter your Name"
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                type="tel"
                placeholder="Enter your Phone Number"
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <button type="submit">Sign Up</button>
            </form>

            <br></br>

            <button
              onClick={() => {
                signIn("google", { callbackUrl: "/userDashboard" })
              }}
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
