"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import apiClient, { setClerkToken } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { ArrowLeft, AlertCircle, PlusCircle, Info } from "lucide-react";

const REGIONS = [
  { value: "us-central1", label: "US Central (Iowa)" },
  { value: "europe-west1", label: "Europe West (Belgium)" },
  { value: "asia-southeast1", label: "Asia Southeast (Singapore)" },
];

export default function CreateTunnelPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { addTunnel, setError, error } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    relay_region: "us-central1",
  });

  // CRITICAL: Clear errors when navigating to this page
  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Tunnel name is required");
      return;
    }

    try {
      setLoading(true);

      // Get and set the Clerk token
      const token = await getToken();
      if (token) {
        setClerkToken(token);
      } else {
        setError("Failed to get authentication token");
        setLoading(false);
        return;
      }

      const response = await apiClient.post("/tunnels", {
        name: formData.name,
        relay_region: formData.relay_region
      });
      addTunnel(response.data);
      router.push("/dashboard/tunnels");
    } catch (err: any) {
      let errorMessage = "Failed to create tunnel";

      if (err.response?.data) {
        const data = err.response.data;
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(data)) {
          errorMessage = data.map((e: any) => e.msg || e.detail).join(", ");
        }
        // Handle standard error response with detail field
        else if (data.detail) {
          errorMessage = typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8">
        <Link
          href="/dashboard/tunnels"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Tunnels
        </Link>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Context */}
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Create Tunnel</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Tunnels allow you to bridge networks securely. Name your tunnel and pick a region closest to your physical location for the lowest latency.
          </p>
        </div>

        {/* Right Column: The Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Tunnel Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Tunnel Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Home-Office-Link"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none disabled:opacity-50"
                    disabled={loading}
                  />
                </div>

                {/* Relay Region */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Relay Region
                  </label>
                  <select
                    value={formData.relay_region}
                    onChange={(e) => setFormData({ ...formData, relay_region: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none disabled:opacity-50"
                    disabled={loading}
                  >
                    {REGIONS.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-normal">
                  <span className="font-bold">Pro Tip:</span> Performance is best when the relay region matches the geographical location of your exit agent.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/tunnels"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    "Creating..."
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Create Tunnel
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}