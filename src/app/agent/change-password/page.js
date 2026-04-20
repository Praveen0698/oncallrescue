"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Check } from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Input, SectionHeader } from "@/components/ui";
import toast from "react-hot-toast";

export default function AgentChangePasswordPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = document.cookie.match(/oncallrescue_role=([^;]+)/);
    if (!role || role[1] !== "agent") router.push("/agent/login");
  }, [router]);

  const getToken = () => document.cookie.match(/oncallrescue_token=([^;]+)/)?.[1];

  const handleSubmit = async () => {
    if (newPass !== confirm) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/agents/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const data = await res.json();
      if (data.success) { toast.success(data.message); router.push("/agent/portal"); }
      else toast.error(data.message);
    } catch { toast.error("Failed"); }
    setLoading(false);
  };

  return (
    <PageShell>
      <PageHeader title="Change Password" backHref="/agent/portal" />
      <Card>
        <SectionHeader icon={<Lock size={18} />} title="Update Password" subtitle="Enter current and new password" />
        <Input label="Current Password" type="password" placeholder="Your current password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <Input label="New Password" type="password" placeholder="Min 6 characters" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
        <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
          error={confirm && newPass !== confirm ? "Passwords don't match" : ""} />
        <Button full onClick={handleSubmit} disabled={!current || newPass.length < 6 || newPass !== confirm || loading} className="mt-2">
          {loading ? "Changing..." : <><Check size={14} /> Change Password</>}
        </Button>
      </Card>
    </PageShell>
  );
}
