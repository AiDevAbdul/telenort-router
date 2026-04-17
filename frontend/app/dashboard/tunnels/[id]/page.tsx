"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { ArrowLeft, Copy, Download, AlertCircle } from "lucide-react";

interface TunnelDetail {
  id: string;
  name: string;
  relay_region: string;
  tunnel_ip_range: string;
  is_active: boolean;
  created_at: string;
}

interface ClientConfig {
  client_name: string;
  public_key: string;
  private_key: string;
  allowed_ip: string;
  config: string;
  status: string;
}

export default function TunnelDetailPage() {
  const params = useParams();
  const tunnelId = params.id as string;
  const [tunnel, setTunnel] = useState<TunnelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [clientName, setClientName] = useState("");
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<ClientConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTunnel = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/tunnels/${tunnelId}`);
        setTunnel(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tunnel");
      } finally {
        setLoading(false);
      }
    };

    fetchTunnel();
  }, [tunnelId]);

  const handleGenerateConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }

    try {
      setGeneratingConfig(true);
      const response = await apiClient.post("/generate-client-config", {
        tunnel_id: tunnelId,
        client_name: clientName,
      });
      setGeneratedConfig(response.data);
      setClientName("");
      setShowConfigForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to generate config");
    } finally {
      setGeneratingConfig(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadConfig = () => {
    if (!generatedConfig) return;

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(generatedConfig.config)
    );
    element.setAttribute("download", `${generatedConfig.client_name}.conf`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading tunnel...</div>;
  }

  if (!tunnel) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-4">Tunnel not found</p>
        <Link href="/tunnels" className="text-primary hover:underline">
          Back to Tunnels
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tunnel Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tunnel.name}</h1>
            <p className="text-slate-600 mt-2">{tunnel.relay_region}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            tunnel.is_active
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
          }`}>
            {tunnel.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">IP Range</p>
            <p className="text-lg font-semibold text-slate-900">{tunnel.tunnel_ip_range}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Created</p>
            <p className="text-lg font-semibold text-slate-900">
              {new Date(tunnel.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Generate Client Config */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Client Configuration</h2>

        {!showConfigForm ? (
          <button
            onClick={() => setShowConfigForm(true)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Generate New Config
          </button>
        ) : (
          <form onSubmit={handleGenerateConfig} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g., my-laptop, mobile-device"
                className="w-full"
                disabled={generatingConfig}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={generatingConfig}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {generatingConfig ? "Generating..." : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfigForm(false)}
                className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {generatedConfig && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-6">
            <div>
              <p className="text-sm font-medium text-slate-900 mb-2">Configuration File</p>
              <div className="bg-slate-50 rounded p-4 font-mono text-xs overflow-x-auto max-h-64 overflow-y-auto">
                <pre>{generatedConfig.config}</pre>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generatedConfig.config)}
                className="flex items-center gap-2 bg-slate-100 text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={downloadConfig}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">📋 Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download or copy the configuration</li>
                <li>Add it to your WireGuard client</li>
                <li>Connect to activate the tunnel</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
