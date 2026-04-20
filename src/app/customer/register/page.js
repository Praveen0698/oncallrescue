"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  User,
  Phone,
  ArrowRight,
  ArrowLeft,
  Check,
  Activity,
  Lock,
  QrCode,
  Mail,
  Star,
  Download,
  Play,
  X,
  BookOpen,
  Smartphone,
  Shield,
  ChevronRight,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/layouts";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Checkbox,
  ProgressSteps,
  SectionHeader,
  Badge,
} from "@/components/ui";
import toast from "react-hot-toast";

const GoogleAdBanner = dynamic(
  () => import("@/components/ads/GoogleAdBanner"),
  { ssr: false },
);

const BLOOD_TYPES = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
];
const VEHICLE_TYPES = ["Bike", "Car", "Bus", "Cycle", "Auto", "Truck", "Other"];

// Video URL — update if URL changes
const TUTORIAL_VIDEO_URL =
  "https://res.cloudinary.com/dlodlzv3m/video/upload/v1776059547/1775839446880373_ng8tix.mov";

function TutorialModal({ onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(TUTORIAL_VIDEO_URL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "OnCallRescue-Registration-Guide.mov";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch {
      // Fallback: open in new tab if blob download fails (e.g. CORS)
      window.open(TUTORIAL_VIDEO_URL, "_blank");
      toast.success("Video opened — save it from your browser");
    }
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-up-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <BookOpen size={16} className="text-brand-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-ink-900">
                Registration Guide
              </p>
              <p className="text-[10px] text-ink-400">Watch before you start</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-ink-400 hover:bg-surface-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Video thumbnail area */}
        <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 mx-5 mt-5 rounded-xl overflow-hidden h-40 flex items-center justify-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="text-center relative z-10">
            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2 border-2 border-white/40">
              <Play size={24} className="text-white ml-1" fill="white" />
            </div>
            <p className="text-white text-xs font-semibold">
              Registration Tutorial
            </p>
            <p className="text-white/60 text-[10px]">
              Step-by-step video guide
            </p>
          </div>
          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/50 rounded-md px-2 py-0.5">
            <span className="text-white text-[10px] font-medium">Tutorial</span>
          </div>
        </div>

        {/* What's in the video */}
        <div className="px-5 pt-4 pb-2">
          <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-3">
            What you'll learn
          </p>
          <div className="space-y-2">
            {[
              { icon: <QrCode size={13} />, text: "How your QR sticker works" },
              {
                icon: <User size={13} />,
                text: "Filling your emergency profile",
              },
              {
                icon: <Smartphone size={13} />,
                text: "Logging into your dashboard",
              },
              {
                icon: <Shield size={13} />,
                text: "How family gets notified in emergency",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs text-ink-700">{item.text}</span>
                <ChevronRight size={11} className="text-ink-300 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="mx-5 mt-3 p-3 rounded-xl bg-warning-50 border border-warning-100">
          <p className="text-[11px] text-warning-700 leading-relaxed">
            <strong>Downloading:</strong> OnCallRescue-Registration-Guide.mov —
            a short tutorial video (~2–5 MB) showing the complete registration
            and login process.
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 space-y-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            <Download size={16} />
            {downloading ? "Downloading..." : "Download Tutorial Video"}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold text-ink-500 hover:bg-surface-100 transition-colors"
          >
            Skip — I'll register directly
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerRegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQrId = searchParams.get("qrId") || "";
  const urlPhone = searchParams.get("phone") || "";
  const isEdit = searchParams.get("edit") === "true";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(isEdit);
  const [showTutorial, setShowTutorial] = useState(false);
  const [data, setData] = useState({
    fullName: "",
    phone: urlPhone,
    dob: "",
    gender: "",
    bloodType: "",
    vehicleNumber: "",
    vehicleType: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    organDonor: false,
    primaryContact: { name: "", relation: "", phone: "", email: "" },
    secondaryContact: { name: "", relation: "", phone: "", email: "" },
    notificationEmails: ["", "", ""],
    password: "",
    confirmPassword: "",
  });

  const steps = isEdit
    ? ["Personal", "Medical", "Contacts", "Emails"]
    : ["Personal", "Medical", "Contacts", "Emails", "Password"];

  // Show tutorial modal on first visit (not on edit)
  useEffect(() => {
    if (isEdit) return;
    const seen = sessionStorage.getItem("tutorial_shown");
    if (!seen) {
      setShowTutorial(true);
      sessionStorage.setItem("tutorial_shown", "true");
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) {
      setPrefilling(false);
      return;
    }
    const token = document.cookie.match(/oncallrescue_token=([^;]+)/)?.[1];
    if (!token) {
      setPrefilling(false);
      return;
    }

    fetch("/api/customers/me", {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data.customer) {
          const c = result.data.customer;
          const contacts = c.emergencyContacts || [];
          const primary =
            contacts.find((x) => x.isPrimary) || contacts[0] || {};
          const secondary =
            contacts.find((x) => !x.isPrimary) || contacts[1] || {};
          setData({
            fullName: c.fullName || "",
            phone: c.phone || "",
            dob: c.dob ? new Date(c.dob).toISOString().split("T")[0] : "",
            gender: c.gender || "",
            bloodType: c.bloodType || "",
            vehicleNumber: c.vehicleNumber || "",
            vehicleType: c.vehicleType || "",
            allergies: c.allergies || "",
            medicalConditions: c.medicalConditions || "",
            medications: c.medications || "",
            organDonor: c.organDonor || false,
            primaryContact: {
              name: primary.name || "",
              relation: primary.relation || "",
              phone: primary.phone || "",
              email: primary.email || "",
            },
            secondaryContact: {
              name: secondary.name || "",
              relation: secondary.relation || "",
              phone: secondary.phone || "",
              email: secondary.email || "",
            },
            notificationEmails:
              c.notificationEmails?.length > 0
                ? [...c.notificationEmails, "", "", ""].slice(0, 3)
                : ["", "", ""],
            password: "",
            confirmPassword: "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setPrefilling(false));
  }, [isEdit]);

  const u = (k) => (e) => setData((p) => ({ ...p, [k]: e.target.value }));
  const uContact = (type, field) => (e) =>
    setData((p) => ({ ...p, [type]: { ...p[type], [field]: e.target.value } }));
  const uContactPhone = (type) => (e) =>
    setData((p) => ({
      ...p,
      [type]: {
        ...p[type],
        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
      },
    }));

  const lastStep = steps.length - 1;

  const canNext = () => {
    if (step === 0) return data.fullName.trim() && data.phone.length === 10;
    if (step === 1) return true;
    if (step === 2) {
      const p = data.primaryContact;
      const s = data.secondaryContact;
      return (
        p.name &&
        p.phone.length === 10 &&
        p.email.includes("@") &&
        s.name &&
        s.phone.length === 10 &&
        s.email.includes("@")
      );
    }
    if (step === 3) return true;
    if (step === 4 && !isEdit)
      return (
        data.password.length >= 6 && data.password === data.confirmPassword
      );
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const emergencyContacts = [
        { ...data.primaryContact, isPrimary: true },
        { ...data.secondaryContact, isPrimary: false },
      ];
      const body = {
        fullName: data.fullName.trim(),
        phone: data.phone,
        dob: data.dob || undefined,
        gender: data.gender || undefined,
        bloodType: data.bloodType || undefined,
        vehicleNumber: data.vehicleNumber || undefined,
        vehicleType: data.vehicleType || undefined,
        allergies: data.allergies || undefined,
        medicalConditions: data.medicalConditions || undefined,
        medications: data.medications || undefined,
        organDonor: data.organDonor,
        emergencyContacts,
        notificationEmails: data.notificationEmails.filter((e) => e.trim()),
        qrId: urlQrId || undefined,
        password: isEdit ? "existing-no-change" : data.password,
      };
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(
          isEdit ? "Profile updated!" : "Profile created! Please login.",
        );
        router.push(isEdit ? "/customer/dashboard" : "/customer/login");
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  if (prefilling) {
    return (
      <PageShell>
        <div className="flex items-center justify-center pt-32">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full loader-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Tutorial modal — auto-shows on first visit */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      <PageHeader
        title={isEdit ? "Edit Profile" : "Emergency Profile"}
        subtitle={isEdit ? "Update your details" : "Complete registration"}
        backHref={isEdit ? "/customer/dashboard" : "/"}
        action={
          !isEdit && (
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1 text-xs text-brand-600 font-semibold hover:underline"
            >
              <Play size={12} /> Guide
            </button>
          )
        }
      />

      {urlQrId && !isEdit && (
        <Card className="!bg-success-50 !border-success-500 mb-4 !p-3.5">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-success-500" />
            <div>
              <p className="text-xs font-bold text-success-600">
                Sticker: <span className="font-mono">{urlQrId}</span>
              </p>
              <p className="text-[10px] text-success-500">
                Your profile will link to this QR sticker
              </p>
            </div>
          </div>
        </Card>
      )}

      <ProgressSteps steps={steps} current={step} />

      {/* oncallrescue-customer-reg-banner */}
      <GoogleAdBanner adSlot="6661515410" className="mb-3" />

      <Card>
        {step === 0 && (
          <div className="animate-fade-up-in">
            <SectionHeader
              icon={<User size={18} />}
              title="Personal Information"
            />
            <Input
              label="Full Name"
              placeholder="Your full name"
              value={data.fullName}
              onChange={u("fullName")}
              required
            />
            <Input
              label="Phone Number"
              placeholder="10-digit mobile"
              type="tel"
              value={data.phone}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              required
              maxLength={10}
              icon={<Phone size={14} />}
              disabled={!!urlPhone || isEdit}
              helper={
                urlPhone
                  ? "From registration link"
                  : isEdit
                    ? "Cannot change phone"
                    : ""
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={data.dob}
                onChange={u("dob")}
              />
              <Select
                label="Gender"
                value={data.gender}
                onChange={u("gender")}
                options={["Male", "Female", "Other"]}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Blood Type"
                value={data.bloodType}
                onChange={u("bloodType")}
                options={BLOOD_TYPES}
              />
              <Select
                label="Vehicle Type"
                value={data.vehicleType}
                onChange={u("vehicleType")}
                options={VEHICLE_TYPES}
              />
            </div>
            <Input
              label="Vehicle Number"
              placeholder="e.g., MH02AB1234"
              value={data.vehicleNumber}
              onChange={(e) =>
                setData((p) => ({
                  ...p,
                  vehicleNumber: e.target.value.toUpperCase(),
                }))
              }
            />
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-up-in">
            <SectionHeader
              icon={<Activity size={18} />}
              title="Medical Details"
              subtitle="Critical for first responders"
            />
            <Textarea
              label="Known Allergies"
              placeholder="e.g., Penicillin, Peanuts..."
              value={data.allergies}
              onChange={u("allergies")}
            />
            <Textarea
              label="Medical Conditions"
              placeholder="e.g., Diabetes, Asthma..."
              value={data.medicalConditions}
              onChange={u("medicalConditions")}
            />
            <Textarea
              label="Medications"
              placeholder="e.g., Metformin 500mg..."
              value={data.medications}
              onChange={u("medications")}
            />
            <Checkbox
              label="Organ Donor"
              description="Visible to emergency responders"
              checked={data.organDonor}
              onChange={(v) => setData((p) => ({ ...p, organDonor: v }))}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-up-in">
            <SectionHeader
              icon={<Phone size={18} />}
              title="Emergency Contacts"
              subtitle="Both contacts are mandatory"
            />
            <div className="p-3.5 rounded-xl mb-4 border bg-brand-50/50 border-brand-200">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="brand">
                  <Star size={9} /> Primary
                </Badge>
                <span className="text-[10px] text-ink-400">
                  Gets call + SMS + email on emergency
                </span>
              </div>
              <Input
                placeholder="Name *"
                value={data.primaryContact.name}
                onChange={uContact("primaryContact", "name")}
                className="!mb-2"
              />
              <Input
                placeholder="Relation (e.g., Wife, Brother)"
                value={data.primaryContact.relation}
                onChange={uContact("primaryContact", "relation")}
                className="!mb-2"
              />
              <div className="grid grid-cols-2 gap-2 responsive-grid-2">
                <Input
                  placeholder="Phone *"
                  type="tel"
                  value={data.primaryContact.phone}
                  onChange={uContactPhone("primaryContact")}
                  className="!mb-0"
                  maxLength={10}
                  icon={<Phone size={12} />}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={data.primaryContact.email}
                  onChange={uContact("primaryContact", "email")}
                  className="!mb-0"
                  icon={<Mail size={12} />}
                />
              </div>
              {data.primaryContact.phone &&
                data.primaryContact.phone.length < 10 && (
                  <p className="text-[10px] text-warning-500 mt-1">
                    Enter 10 digits
                  </p>
                )}
            </div>
            <div className="p-3.5 rounded-xl mb-3 border bg-surface-50 border-surface-300">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="neutral">Secondary</Badge>
                <span className="text-[10px] text-ink-400">
                  Gets email — admin calls manually
                </span>
              </div>
              <Input
                placeholder="Name *"
                value={data.secondaryContact.name}
                onChange={uContact("secondaryContact", "name")}
                className="!mb-2"
              />
              <Input
                placeholder="Relation"
                value={data.secondaryContact.relation}
                onChange={uContact("secondaryContact", "relation")}
                className="!mb-2"
              />
              <div className="grid grid-cols-2 gap-2 responsive-grid-2">
                <Input
                  placeholder="Phone *"
                  type="tel"
                  value={data.secondaryContact.phone}
                  onChange={uContactPhone("secondaryContact")}
                  className="!mb-0"
                  maxLength={10}
                  icon={<Phone size={12} />}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={data.secondaryContact.email}
                  onChange={uContact("secondaryContact", "email")}
                  className="!mb-0"
                  icon={<Mail size={12} />}
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-brand-50 border border-brand-200">
              <p className="text-xs text-brand-700 leading-relaxed">
                <strong>How it works:</strong> Primary contact gets an automated
                call + SMS + email. Secondary contact gets an email, and our
                admin will call them directly.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-up-in">
            <SectionHeader
              icon={<Mail size={18} />}
              title="Notification Emails"
              subtitle="Optional — up to 3 additional emails"
            />
            <p className="text-xs text-ink-400 mb-4 leading-relaxed">
              These emails receive instant alerts with location and Google Maps
              link during emergencies.
            </p>
            {data.notificationEmails.map((em, i) => (
              <Input
                key={i}
                label={`Email ${i + 1}${i === 0 ? "" : " (optional)"}`}
                placeholder={`notification${i + 1}@email.com`}
                type="email"
                value={em}
                onChange={(e) => {
                  const emails = [...data.notificationEmails];
                  emails[i] = e.target.value;
                  setData((p) => ({ ...p, notificationEmails: emails }));
                }}
              />
            ))}
          </div>
        )}

        {step === 4 && !isEdit && (
          <div className="animate-fade-up-in">
            <SectionHeader
              icon={<Lock size={18} />}
              title="Set Password"
              subtitle="For login to your dashboard"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={data.password}
              onChange={u("password")}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter"
              value={data.confirmPassword}
              onChange={u("confirmPassword")}
              required
              error={
                data.confirmPassword && data.password !== data.confirmPassword
                  ? "Passwords don't match"
                  : ""
              }
            />
          </div>
        )}

        <div className="flex justify-between mt-6 gap-3">
          {step > 0 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={15} /> Back
            </Button>
          ) : (
            <div />
          )}
          {step < lastStep ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={!canNext() || loading}
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Check size={15} />{" "}
                  {isEdit ? "Save Changes" : "Create Profile"}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* oncallrescue-customer-reg-banner — bottom */}
      <GoogleAdBanner adSlot="6661515410" className="mt-4" />
    </PageShell>
  );
}

export default function CustomerRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CustomerRegisterPageContent />
    </Suspense>
  );
}
