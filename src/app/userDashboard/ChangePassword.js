"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function ChangePassword() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  // ✅ Wait for session or localStorage to load
  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      setEmail(session.user.email);
    } else {
      const local = localStorage.getItem("loggedInUser");
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed?.email) setEmail(parsed.email);
        } catch {
          setEmail(local); // if plain string
        }
      }
    }
  }, [session, status]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!currentPass) return alert("Enter your current password");
    if (!email) return alert("Email not found — please re-login");

    setLoading(true);
    try {
      const res = await axios.post("/api/users/verifyPassword", { email, pass: currentPass });
      if (res.data?.success) {
        alert("Password verified ✅");
        setVerified(true);
      } else {
        alert(res.data?.message || "Incorrect password ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying password");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (!newPass || !confirmPass) return alert("Enter both fields");
    if (newPass !== confirmPass) return alert("Passwords do not match");

    setLoading(true);
    try {
      const res = await axios.post("/api/users/changePassword", { email, newPassword: newPass });
      if (res.data?.success) {
        alert("Password updated ✅");
        setNewPass("");
        setConfirmPass("");
        setCurrentPass("");
        setVerified(false);
      } else {
        alert(res.data?.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating password");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p>Loading user session...</p>;

  return (
    <div className="change-password-container">
      <h3>🔐 Change Password</h3>

      {!verified ? (
        <form className="change-password-form" onSubmit={handleVerify}>
          <input
            type="password"
            placeholder="Enter Current Password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            required
          />
          <button type="submit" disabled={loading || !email}>
            {loading ? "Verifying..." : "Verify Password"}
          </button>
        </form>
      ) : (
        <form className="change-password-form" onSubmit={handleChange}>
          <input
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}
    </div>
  );
}
