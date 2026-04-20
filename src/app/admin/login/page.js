"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Lock, LogIn } from "lucide-react";
import { PageShell, Logo } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      toast.error("Enter username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (data.success) {
        document.cookie = `oncallrescue_token=${data.data.token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        document.cookie = `oncallrescue_role=admin; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
        toast.success("Admin login successful!");
        router.push("/admin/dashboard");
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

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
            <h2 className="text-lg font-extrabold text-ink-900">Admin Panel</h2>
            <p className="text-[11px] text-ink-400">Authorized personnel only</p>
          </div>
        </div>

        <Input
          label="Username"
          placeholder="Enter admin username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          icon={<User size={15} />}
          required
        />

        <div onKeyDown={handleKeyDown}>
          <Input
            label="Password"
            placeholder="Enter admin password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={15} />}
            required
          />
        </div>

        <Button
          full
          onClick={handleLogin}
          disabled={!username.trim() || !password || loading}
          className="mt-2"
        >
          {loading ? "Authenticating..." : <><LogIn size={15} /> Login</>}
        </Button>
      </Card>

      <a href="/" className="block text-center text-xs text-ink-400 hover:text-ink-600">
        ← Back to Home
      </a>
    </PageShell>
  );
}
