"use client";

import { useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

export default function ChangePassword() {
  const { data: session } = useSession();
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (!newPass || !confirmPass) return alert("Enter both fields");
    if (newPass !== confirmPass) return alert("Passwords do not match");

    setLoading(true);
    try {
      const payload = {
        email: session?.user?.email || localStorage.getItem("loggedInUserEmail"),
        newPassword: newPass,
      };
      const res = await axios.post("/api/users/changePassword", payload);
      if (res.data?.success) {
        alert("Password updated ✅");
        setNewPass("");
        setConfirmPass("");
      } else {
        alert("Update failed: " + (res.data?.message || "unknown"));
      }
    } catch (err) {
      console.error(err);
      alert("Error updating password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>🔐 Change Password</h3>
      <form onSubmit={handleChange} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <input type="password" placeholder="New Password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
        <input type="password" placeholder="Confirm Password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Password"}</button>
      </form>
    </div>
  );
}
