"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

const REGIONS = [
  { value: "us-central1", label: "US Central (Iowa)" },
  { value: "europe-west1", label: "Europe West (Belgium)" },
  { value: "asia-southeast1", label: "Asia Southeast (Singapore)" },
];

export default function CreateTunnelPage() {
  const router = useRouter();
  const { addTunnel, setError, error } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relay_region: "us-central1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Tunnel name is required");
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post("/tunnels", formData);
      addTunnel(response.data);
      router.push("/tunnels");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create tunnel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/tunnels"
          className="flex items-center gap-2 text-primary hover:text-primary/80"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tunnels
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Create New Tunnel</h1>
        <p className="text-slate-600 mb-8">Set up a new VPN tunnel for your devices</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tunnel Name */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Tunnel Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Office, Remote Lab"
              className="w-full"
              disabled={loading}
            />
            <p className="text-sm text-slate-600 mt-1">
              A friendly name to identify this tunnel
            </p>
          </div>

          {/* Relay Region */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Relay Region
            </label>
            <select
              value={formData.relay_region}
              onChange={(e) =>
                setFormData({ ...formData, relay_region: e.target.value })
              }
              className="w-full"
              disabled={loading}
            >
              {REGIONS.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-slate-600 mt-1">
              Choose the region closest to your exit agent for best performance
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 Tip:</span> After creating the tunnel, you'll be able to register exit agents and generate client configurations.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Tunnel"}
            </button>
            <Link
              href="/tunnels"
              className="flex-1 bg-slate-100 text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
