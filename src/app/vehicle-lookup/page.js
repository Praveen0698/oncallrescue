"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Car, AlertTriangle, ArrowRight, Shield } from "lucide-react";
import { PageShell, PageHeader, Logo } from "@/components/layouts";
import { Button, Card, Input } from "@/components/ui";
import toast from "react-hot-toast";

export default function VehicleLookupPage() {
  const router = useRouter();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!vehicleNumber.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);

    try {
      const res = await fetch(
        `/api/vehicle-lookup?vehicleNumber=${encodeURIComponent(vehicleNumber)}`,
      );
      const data = await res.json();

      if (data.success && data.data.found) {
        setResult(data.data);
      } else {
        setNotFound(true);
      }
    } catch {
      toast.error("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <PageShell>
      <PageHeader
        title="Vehicle Lookup"
        subtitle="Find emergency profile by vehicle number"
        backHref="/"
      />

      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4 text-ink-400">
          <Car size={28} />
        </div>
        <p className="text-sm text-ink-500 max-w-xs mx-auto leading-relaxed">
          If you can't find the QR sticker on the vehicle, enter the vehicle
          number below to access emergency contacts.
        </p>
      </div>

      <Card className="mb-6">
        <Input
          label="Vehicle Number"
          placeholder="e.g., MH02AB1234"
          value={vehicleNumber}
          onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
          icon={<Search size={15} />}
        />
        <Button
          full
          onClick={handleSearch}
          disabled={!vehicleNumber.trim() || loading}
        >
          {loading ? (
            "Searching..."
          ) : (
            <>
              <Search size={15} /> Search Vehicle
            </>
          )}
        </Button>
      </Card>

      {/* Found */}
      {result && (
        <Card className="animate-fade-up-in !border-success-500 !bg-success-50">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={18} className="text-success-500" />
            <div>
              <p className="text-sm font-bold text-success-600">
                OnCallRescue Profile Found
              </p>
              <p className="text-xs text-success-600/70">
                This vehicle has an emergency profile
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            full
            onClick={() => router.push(`/emergency/scan?id=${result.qrId}`)}
          >
            <AlertTriangle size={15} /> Proceed to Emergency Contact{" "}
            <ArrowRight size={14} />
          </Button>
        </Card>
      )}

      {/* Not Found */}
      {notFound && (
        <Card className="animate-fade-up-in !border-surface-400 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-200 flex items-center justify-center mx-auto mb-3 text-ink-400">
            <Car size={22} />
          </div>
          <p className="text-sm font-bold text-ink-900 mb-1">
            No Profile Found
          </p>
          <p className="text-xs text-ink-400">
            This vehicle number is not registered with OnCallRescue. Try
            checking the vehicle for a QR sticker.
          </p>
        </Card>
      )}

      {/* Info */}
      <Card className="mt-6 !bg-surface-50">
        <div className="flex gap-3 items-start">
          <AlertTriangle
            size={16}
            className="text-warning-500 flex-shrink-0 mt-0.5"
          />
          <p className="text-xs text-ink-500 leading-relaxed">
            <strong>This lookup follows the same privacy protections.</strong>{" "}
            Emergency contacts are masked, calls are relayed, and every search
            is logged with your device info and location.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
