"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, LogIn, ArrowRight } from "lucide-react";
import { PageShell, Logo } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import toast from "react-hot-toast";

export default function AgentLoginPage() {
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
      const res = await fetch("/api/agents/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();

      if (data.success) {
        // Store token in cookie
        document.cookie = `oncallrescue_token=${data.data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `oncallrescue_role=agent; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        toast.success("Login successful!");
        router.push("/agent/portal");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <PageShell>
      <div className="pt-10 pb-6">
        <Logo size="md" />
      </div>

      <Card className="mb-6">
        <h2 className="text-lg font-extrabold text-ink-900 mb-1">Agent Login</h2>
        <p className="text-xs text-ink-400 mb-6">Access your portal to onboard customers</p>

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

        <Input
          label="Password"
          placeholder="Enter your password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={15} />}
          required
        />

        <Button
          full
          onClick={handleLogin}
          disabled={phone.length !== 10 || !password || loading}
          className="mt-2"
        >
          {loading ? "Logging in..." : <><LogIn size={15} /> Login</>}
        </Button>
      </Card>

      <div className="text-center space-y-3">
        <p className="text-sm text-ink-500">
          Not a partner yet?{" "}
          <Link href="/agent/register" className="text-brand-600 font-semibold hover:underline">
            Become an Agent <ArrowRight size={12} className="inline" />
          </Link>
        </p>
        <Link href="/" className="text-xs text-ink-400 hover:text-ink-600 block">
          ← Back to Home
        </Link>
      </div>
    </PageShell>
  );
}
