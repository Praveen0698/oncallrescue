"use client";

import Link from "next/link";
import { HelpCircle, LogIn } from "lucide-react";
import { PageShell, Logo } from "@/components/layouts";
import { Button, Card } from "@/components/ui";

export default function HelpPage() {
  return (
    <PageShell>
      <div className="pt-10 pb-6"><Logo size="md" /></div>
      <Card className="text-center mb-6">
        <HelpCircle size={28} className="text-brand-600 mx-auto mb-3" />
        <h2 className="text-lg font-extrabold text-ink-900 mb-1">Help & Support</h2>
        <p className="text-sm text-ink-500 mb-4">
          FAQs, raise queries, and get support — all available inside your Customer Dashboard.
        </p>
        <Link href="/customer/login">
          <Button full><LogIn size={15} /> Login to Access Support</Button>
        </Link>
      </Card>
      <div className="text-center">
        <Link href="/" className="text-xs text-ink-400 hover:text-ink-600">← Back to Home</Link>
      </div>
    </PageShell>
  );
}
