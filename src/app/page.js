"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  QrCode,
  Phone,
  Lock,
  Car,
  Bike,
  Bus,
  Eye,
  ArrowRight,
  Check,
  Zap,
  Heart,
  Bell,
  Scan,
  Search,
  User,
} from "lucide-react";
import { PageShell, Logo } from "@/components/layouts";
import { Button, Card } from "@/components/ui";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <PageShell>
      <motion.div initial="hidden" animate="show" variants={stagger}>
        {/* Hero */}
        <motion.div variants={fadeUp} className="text-center pt-10 pb-8">
          <Logo size="lg" />
          <p className="text-sm text-ink-500 mt-3 max-w-[300px] mx-auto leading-relaxed">
            Your encrypted emergency identity — accessible when it matters most.
          </p>
        </motion.div>

        {/* Price */}
        <motion.div
          variants={fadeUp}
          className="text-center mb-7 px-5 py-4 rounded-xl bg-brand-50 border-2 border-dashed border-brand-200"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-brand-600">₹199</span>
            <span className="text-sm text-ink-500">one-time • lifetime</span>
          </div>
          <p className="text-xs text-ink-400 mt-1">
            5 emergency calls included • ₹49 recharge packs
          </p>
        </motion.div>

        {/* How it Works */}
        <motion.div variants={fadeUp} className="mb-7">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-4">
            How it works
          </h3>
          {[
            {
              step: "01",
              icon: <QrCode size={18} />,
              title: "Get Your Sticker",
              desc: "Agent hands you a premium QR sticker for your vehicle",
            },
            {
              step: "02",
              icon: <Phone size={18} />,
              title: "Fill Your Profile",
              desc: "Add medical info & emergency contacts via secure link",
            },
            {
              step: "03",
              icon: <Shield size={18} />,
              title: "Stay Protected",
              desc: "Anyone can scan in emergency — your family gets notified instantly",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex gap-3.5 py-3.5"
              style={{ borderBottom: i < 2 ? "1px solid #E2E0D8" : "none" }}
            >
              <div className="w-11 h-11 rounded-xl bg-white border border-surface-300 flex items-center justify-center text-brand-600 flex-shrink-0 relative shadow-soft">
                {item.icon}
                <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold font-mono text-white bg-ink-900 rounded-md px-1.5 py-0.5">
                  {item.step}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-ink-900">
                  {item.title}
                </div>
                <div className="text-xs text-ink-400 mt-0.5 leading-relaxed">
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Privacy */}
        <motion.div variants={fadeUp}>
          <Card className="mb-7 !bg-surface-50">
            <div className="flex items-center gap-2 mb-3.5">
              <Lock size={15} className="text-brand-600" />
              <span className="text-[13px] font-bold text-ink-900">
                Privacy First
              </span>
            </div>
            {[
              "No personal details shown to scanner",
              "Masked calling — real numbers never exposed",
              "Owner notified on every scan with cancel option",
              "Full scan audit trail with location logging",
              "10-minute cooldown blocks repeated scans",
            ].map((t, i) => (
              <div key={i} className="flex gap-2 items-start mb-1.5 last:mb-0">
                <Check
                  size={13}
                  className="text-success-500 flex-shrink-0 mt-0.5"
                />
                <span className="text-[13px] text-ink-600 leading-relaxed">
                  {t}
                </span>
              </div>
            ))}
          </Card>
        </motion.div>

        {/* Emergency Flow */}
        <motion.div variants={fadeUp}>
          <Card className="mb-7 border-brand-200 !bg-brand-50/50">
            <div className="flex items-center gap-2 mb-3.5">
              <Bell size={15} className="text-brand-600" />
              <span className="text-[13px] font-bold text-ink-900">
                During Emergency
              </span>
            </div>
            <div className="space-y-2">
              {[
                "Helper scans QR → taps 'Emergency'",
                "5-second countdown — owner notified instantly",
                "Owner can tap 'I'm Safe' to cancel",
                "If not cancelled → masked call to primary contact",
                "No answer? Auto-cascades to next contact",
                "WhatsApp + Email blast to ALL family members",
              ].map((t, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <span className="text-[10px] font-bold font-mono text-brand-600 bg-brand-100 rounded-md px-1.5 py-0.5 mt-0.5 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[13px] text-ink-700 leading-relaxed">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Vehicle Types */}
        <motion.div
          variants={fadeUp}
          className="flex justify-center gap-2 mb-7 flex-wrap"
        >
          {["🏍️ Bikes", "🚗 Cars", "🚌 Buses", "🚲 Cycles", "🛺 Autos"].map(
            (v) => (
              <span
                key={v}
                className="px-3.5 py-2 rounded-full text-xs font-medium bg-white border border-surface-300 text-ink-600"
              >
                {v}
              </span>
            ),
          )}
        </motion.div>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="space-y-2.5 mb-6">
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/emergency/scan">
              <Button full size="lg">
                <Scan size={16} /> Scan QR
              </Button>
            </Link>
            <Link href="/vehicle-lookup">
              <Button variant="secondary" full size="lg">
                <Search size={16} /> Vehicle Lookup
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer Links */}
        <motion.div variants={fadeUp} className="text-center space-y-3 pb-8">
          <Link href="/customer/login" className="block">
            <Button variant="outline" full size="md">
              <User size={15} /> Customer Login
            </Button>
          </Link>
          <div className="flex justify-center gap-4">
            <Link
              href="/help"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Help & FAQ
            </Link>
            <Link
              href="/agent/login"
              className="text-xs font-semibold text-ink-500 hover:text-brand-600"
            >
              Agent Login
            </Link>
          </div>
          <p className="text-[10px] font-mono text-ink-300 tracking-wider uppercase">
            Built to save lives
          </p>
        </motion.div>
      </motion.div>
    </PageShell>
  );
}
