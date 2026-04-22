"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import apiClient, { setClerkToken } from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { ArrowLeft, AlertCircle, PlusCircle, Info, Copy, Check } from "lucide-react";

interface Tunnel {
  id: string;
  name: string;
  relay_region: string;
}

export default function RegisterExitAgentPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { setError, error } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [tunnels, setTunnels] = useState<Tunnel[]>([]);
  const [tunnelsLoading, setTunnelsLoading] = useState(true);
  const [agentToken, setAgentToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tunnel_id: "",
  });

  // CRITICAL: Clear errors and fetch tunnels when navigating to this page
  useEffect(() => {
    setError(null);
    fetchTunnels();
  }, [setError]);

  const fetchTunnels = async () => {
    try {
      setTunnelsLoading(true);
      const token = await getToken();
      if (token) {
        setClerkToken(token);
      }

      const response = await apiClient.get("/tunnels");
      let tunnelData: Tunnel[] = [];
      if (response.data?.tunnels && Array.isArray(response.data.tunnels)) {
        tunnelData = response.data.tunnels;
      } else if (Array.isArray(response.data)) {
        tunnelData = response.data;
      }
      setTunnels(tunnelData);

      // Auto-select first tunnel if available
      if (tunnelData.length > 0 && !formData.tunnel_id) {
        setFormData((prev) => ({ ...prev, tunnel_id: tunnelData[0].id }));
      }
    } catch (err: any) {
      let errorMessage = "Failed to fetch tunnels";
      if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setTunnelsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Exit agent name is required");
      return;
    }
    if (!formData.tunnel_id) {
      setError("Please select a tunnel");
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

      const response = await apiClient.post("/exit-agents", {
        name: formData.name,
        tunnel_id: formData.tunnel_id,
      });
      setAgentToken(response.data.token || response.data.id);
    } catch (err: any) {
      let errorMessage = "Failed to register exit agent";

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

  const handleCopyToken = () => {
    if (agentToken) {
      navigator.clipboard.writeText(agentToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadScript = () => {
    if (agentToken) {
      const scriptContent = `#!/bin/bash
# Exit Agent Setup Script
# Generated for: ${formData.name}

AGENT_TOKEN="${agentToken}"
RELAY_API="http://localhost:8000"

echo "Setting up exit agent: ${formData.name}"
echo "Token: $AGENT_TOKEN"

# TODO: Implement exit agent setup
# This script will:
# 1. Install WireGuard
# 2. Generate keypair
# 3. Register with relay API
# 4. Create reverse tunnel
# 5. Start keep-alive process
`;

      const blob = new Blob([scriptContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exit-agent-${formData.name.toLowerCase().replace(/\s+/g, "-")}.sh`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  if (agentToken) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <Link
            href="/dashboard/exit-agents"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Exit Agents
          </Link>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Context */}
          <div className="md:col-span-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-3">Agent Registered</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Your exit agent has been registered successfully. Use the token below to set up the agent on your home/office PC.
            </p>
          </div>

          {/* Right Column: Token Display */}
          <div className="md:col-span-2 space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-900">Exit agent registered</p>
                <p className="text-sm text-green-800 mt-1">
                  Agent name: <span className="font-mono font-semibold">{formData.name}</span>
                </p>
              </div>
            </div>

            {/* Token Box */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Agent Token
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-3 font-mono text-sm break-all text-slate-700">
                    {agentToken}
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-normal">
                  <span className="font-bold">Important:</span> Keep this token safe. You'll need it to set up the exit agent script on your home/office PC.
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Next Steps</h3>
              <ol className="space-y-3 text-sm text-slate-700">
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold shrink-0">1</span>
                  <span>Download the exit agent setup script below</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold shrink-0">2</span>
                  <span>Run the script on your home/office PC with the token</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold shrink-0">3</span>
                  <span>The agent will establish a reverse tunnel to the relay VM</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-semibold shrink-0">4</span>
                  <span>Your remote devices can now route traffic through this agent</span>
                </li>
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/dashboard/exit-agents"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Back to Agents
              </Link>
              <div className="flex gap-3">
                <button
                  onClick={handleDownloadScript}
                  className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-200 transition-all font-semibold text-sm"
                >
                  Download Script
                </button>
                <button
                  onClick={() => router.push("/dashboard/exit-agents")}
                  className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-all font-semibold shadow-md shadow-primary/20"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-fade-in">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8">
        <Link
          href="/dashboard/exit-agents"
          className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Exit Agents
        </Link>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Context */}
        <div className="md:col-span-1">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Register Exit Agent</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Register a new exit agent running on your home or office PC. This agent will create a reverse tunnel to the relay VM.
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
                {/* Tunnel Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Select Tunnel
                  </label>
                  {tunnelsLoading ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-500">
                      Loading tunnels...
                    </div>
                  ) : tunnels.length === 0 ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-500">
                      No tunnels available. Create a tunnel first.
                    </div>
                  ) : (
                    <select
                      value={formData.tunnel_id}
                      onChange={(e) => setFormData({ ...formData, tunnel_id: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none appearance-none disabled:opacity-50"
                      disabled={loading || tunnelsLoading}
                    >
                      <option value="">-- Select a tunnel --</option>
                      {tunnels.map((tunnel) => (
                        <option key={tunnel.id} value={tunnel.id}>
                          {tunnel.name} ({tunnel.relay_region})
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    The tunnel this exit agent will be associated with
                  </p>
                </div>

                {/* Agent Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Home-Office-PC"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none disabled:opacity-50"
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    A friendly name to identify this exit agent
                  </p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-800 leading-normal">
                  <span className="font-bold">What happens next:</span> After registration, you'll receive a token to set up the exit agent script on your PC.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Link
                  href="/dashboard/exit-agents"
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
                    "Registering..."
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Register Agent
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
