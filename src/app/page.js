"use client";
import { useRouter } from "next/navigation";
import { CheckCircle, Zap, Shield, BarChart3,Boxes, ShieldCheck, Send, Users, MonitorSmartphone, FileSpreadsheet } from "lucide-react"; // Icons for features
import "./page.css";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="app-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <img src="/logo4.png" alt="QuickBill Logo" className="hero-logo" />
          <h1 className="hero-title">Welcome to Quick Bill</h1>
          <p className="hero-subtitle">
            Simplify your billing, empower your business. Create invoices, track payments, and grow revenue effortlessly.
          </p>
          <button
            className="cta-button"
            onClick={() => router.push("/login")}
            aria-label="Get started with QuickBill"
          >
            Get Started →
          </button>
        </div>
        <div className="hero-background"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="features-title">Why Choose Quick Bill?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <Zap className="feature-icon" />
            <h3>Instant Invoicing</h3>
            <p>Generate and send professional invoices in seconds with customizable templates.</p>
          </div>
          <div className="feature-card">
            <Shield className="feature-icon" />
            <h3>Secure Payments</h3>
            <p>Accept payments securely with integrated gateways and fraud protection.</p>
          </div>
          
          <div className="feature-card">
            <Boxes className="feature-icon" />
            <h3>Smart Stock Management</h3>
            <p>Track your product quantity and prices; stock updates automatically after each sale.</p>
          </div>
          <div className="feature-card">
            <ShieldCheck className="feature-icon" />
            <h3>Admin Panel</h3>
            <p>Manage all merchants, view reports, and monitor transactions in one place.</p>
          </div>
          <div className="feature-card">
            <Send className="feature-icon" />
            <h3>Email Invoice Sharing</h3>
            <p>Send invoices to customers directly via email in one click.</p>
          </div>
          <div className="feature-card">
            <Users className="feature-icon" />
            <h3>Customer Management</h3>
            <p>Store and manage customer information with billing history.</p>
          </div>
          <div className="feature-card">
            <MonitorSmartphone className="feature-icon" />
            <h3>Cross-Platform Access</h3>
            <p>Use QuickBill on desktop or mobile anytime, anywhere.</p>
          </div>
          <div className="feature-card">
            <FileSpreadsheet className="feature-icon" />
            <h3>GST & Tax Handling</h3>
            <p>Auto-calculate GST and include it seamlessly in every bill.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 QuickBill. All rights reserved. | <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a></p>
      </footer>
    </div>
  );
}