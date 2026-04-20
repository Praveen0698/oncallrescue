"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User, MapPin, Building, FileText, ArrowRight, ArrowLeft, Check, Shield,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import { Button, Card, Input, Select, ProgressSteps, SectionHeader } from "@/components/ui";
import toast from "react-hot-toast";

// Dynamic import prevents SSR — fixes "Cannot read properties of undefined" AdSense error
const GoogleAdBanner = dynamic(() => import("@/components/ads/GoogleAdBanner"), { ssr: false });

export default function AgentRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    fullName: "", phone: "", email: "", dob: "", gender: "",
    aadhar: "", pan: "", street: "", city: "", state: "", pincode: "",
    accountName: "", accountNumber: "", ifsc: "", bankName: "",
    password: "", confirmPassword: "",
  });

  const u = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));
  const steps = ["Personal", "KYC", "Address", "Bank", "Password"];

  const canNext = () => {
    switch (step) {
      case 0: return data.fullName.trim() && data.phone.length === 10 && data.email.includes("@");
      case 1: return data.aadhar.length === 12 && data.pan.length === 10;
      case 2: return data.city.trim() && data.state.trim() && data.pincode.length === 6;
      case 3: return true;
      case 4: return data.password.length >= 6 && data.password === data.confirmPassword;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          phone: data.phone,
          email: data.email.trim(),
          dob: data.dob || undefined,
          gender: data.gender || undefined,
          aadhar: data.aadhar,
          pan: data.pan.toUpperCase(),
          address: { street: data.street.trim(), city: data.city.trim(), state: data.state.trim(), pincode: data.pincode },
          bankDetails: data.accountNumber ? {
            accountName: data.accountName.trim(), accountNumber: data.accountNumber.trim(),
            ifsc: data.ifsc.trim().toUpperCase(), bankName: data.bankName.trim(),
          } : undefined,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Registration submitted! You can login once verified by admin.");
        router.push("/agent/login");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <PageShell>
      <PageHeader title="Become an Agent" subtitle="Join OnCallRescue's field force" backHref="/" />
      <ProgressSteps steps={steps} current={step} />

      {/* oncallrescue-agent-reg-banner */}
      <GoogleAdBanner adSlot="5160731487" className="mb-3" />

      <Card>
        {step === 0 && (
          <div className="animate-fade-up-in">
            <SectionHeader icon={<User size={18} />} title="Personal Details" subtitle="Basic identity information" />
            <Input label="Full Name" placeholder="Your full name" value={data.fullName} onChange={u("fullName")} required />
            <Input label="Email" placeholder="your@email.com" type="email" value={data.email} onChange={u("email")} required />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone" placeholder="10-digit mobile" type="tel" value={data.phone}
                onChange={(e) => setData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                required maxLength={10}
              />
              <Select label="Gender" value={data.gender} onChange={u("gender")} options={["Male", "Female", "Other"]} />
            </div>
            <Input label="Date of Birth" type="date" value={data.dob} onChange={u("dob")} />
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up-in">
            <SectionHeader icon={<FileText size={18} />} title="KYC Documents" subtitle="Identity verification" />
            <Input
              label="Aadhar Number" placeholder="XXXX XXXX XXXX" value={data.aadhar}
              onChange={(e) => setData((p) => ({ ...p, aadhar: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
              required maxLength={12} helper="12-digit Aadhar number"
            />
            <Input
              label="PAN Number" placeholder="ABCDE1234F" value={data.pan}
              onChange={(e) => setData((p) => ({ ...p, pan: e.target.value.toUpperCase().slice(0, 10) }))}
              required maxLength={10} helper="10-character PAN card number"
            />
            <div className="p-3.5 rounded-xl bg-warning-50 border border-warning-100 mt-2">
              <p className="text-xs text-warning-600 leading-relaxed">
                Your documents will be verified by admin. You'll be able to login once verified.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up-in">
            <SectionHeader icon={<MapPin size={18} />} title="Address" subtitle="Your current address" />
            <Input label="Street / Area" placeholder="Street address, area" value={data.street} onChange={u("street")} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" placeholder="City" value={data.city} onChange={u("city")} required />
              <Input label="State" placeholder="State" value={data.state} onChange={u("state")} required />
            </div>
            <Input
              label="Pincode" placeholder="6-digit pincode" value={data.pincode}
              onChange={(e) => setData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
              required maxLength={6}
            />
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up-in">
            <SectionHeader icon={<Building size={18} />} title="Bank Details" subtitle="For commission payouts (optional)" />
            <Input label="Account Holder Name" placeholder="Name as per bank" value={data.accountName} onChange={u("accountName")} />
            <Input label="Account Number" placeholder="Account number" value={data.accountNumber} onChange={u("accountNumber")} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="IFSC Code" placeholder="IFSC code" value={data.ifsc}
                onChange={(e) => setData((p) => ({ ...p, ifsc: e.target.value.toUpperCase() }))} />
              <Input label="Bank Name" placeholder="Bank name" value={data.bankName} onChange={u("bankName")} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-up-in">
            <SectionHeader icon={<Shield size={18} />} title="Set Password" subtitle="Secure your agent portal login" />
            <Input label="Password" type="password" placeholder="Minimum 6 characters" value={data.password} onChange={u("password")} required />
            <Input
              label="Confirm Password" type="password" placeholder="Re-enter password"
              value={data.confirmPassword} onChange={u("confirmPassword")} required
              error={data.confirmPassword && data.password !== data.confirmPassword ? "Passwords don't match" : ""}
            />
          </div>
        )}

        <div className="flex justify-between mt-6 gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</Button>
          ) : (
            <div />
          )}
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>Continue <ArrowRight size={15} /></Button>
          ) : (
            <Button variant="success" onClick={handleSubmit} disabled={!canNext() || loading}>
              {loading ? "Submitting..." : <><Check size={15} /> Submit Registration</>}
            </Button>
          )}
        </div>
      </Card>

      <div className="text-center mt-4">
        <p className="text-xs text-ink-400">
          Already a partner?{" "}
          <Link href="/agent/login" className="text-brand-600 font-semibold hover:underline">Login here</Link>
        </p>
      </div>

      {/* oncallrescue-agent-reg-banner — bottom */}
      <GoogleAdBanner adSlot="5160731487" className="mt-4" />

    </PageShell>
  );
}