"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, LogIn, Shield } from "lucide-react";
import { PageShell, Logo } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import toast from "react-hot-toast";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length !== 10 || !password) {
      toast.error("Enter valid phone and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (data.success) {
        document.cookie = `oncallrescue_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `oncallrescue_role=customer; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        toast.success("Login successful!");
        router.push("/customer/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <PageShell>
      <div className="pt-10 pb-6">
        <Logo size="md" />
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            <Shield size={16} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-ink-900">Customer Login</h2>
            <p className="text-[11px] text-ink-400">Access your emergency profile</p>
          </div>
        </div>

        <Input
          label="Phone Number"
          placeholder="10-digit registered mobile"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          maxLength={10}
          icon={<Phone size={15} />}
          required
        />

        <div onKeyDown={handleKeyDown}>
          <Input
            label="Password"
            placeholder="Password you set during registration"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={15} />}
            required
          />
        </div>

        <Button full onClick={handleLogin} disabled={phone.length !== 10 || !password || loading} className="mt-2">
          {loading ? "Logging in..." : <><LogIn size={15} /> Login</>}
        </Button>
      </Card>

      <p className="text-center text-xs text-ink-400">
        Don't have an account? Get a OnCallRescue sticker from our agents.
      </p>
      <Link href="/" className="block text-center text-xs text-ink-400 hover:text-ink-600 mt-2">
        ← Back to Home
      </Link>
    </PageShell>
  );
}
