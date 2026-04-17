"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import { useAppStore, Tunnel } from "@/lib/store";
import Link from "next/link";
import { Plus, Trash2, Eye, AlertCircle } from "lucide-react";

export default function TunnelsPage() {
  const { user } = useUser();
  const { tunnels, setTunnels, isLoading, setIsLoading, error, setError } = useAppStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchTunnels = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get("/tunnels");

        // Handle both array and object responses
        let tunnelData: Tunnel[] = [];
        if (Array.isArray(response.data)) {
          tunnelData = response.data;
        } else if (response.data && Array.isArray(response.data.tunnels)) {
          tunnelData = response.data.tunnels;
        } else if (response.data && Array.isArray(response.data.data)) {
          tunnelData = response.data.data;
        }

        setTunnels(tunnelData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch tunnels";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTunnels();
    }
  }, [user, setTunnels, setIsLoading, setError]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tunnel?")) return;

    try {
      setDeleting(id);
      await apiClient.delete(`/tunnels/${id}`);
      const updatedTunnels = Array.isArray(tunnels) ? tunnels.filter((t) => t.id !== id) : [];
      setTunnels(updatedTunnels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete tunnel";
      setError(errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Tunnels</h1>
          <p className="text-slate-600 mt-2">Manage your VPN tunnels</p>
        </div>
        <Link
          href="/dashboard/tunnels/new"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Create Tunnel
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-800 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Tunnels Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-600">Loading tunnels...</p>
        </div>
      ) : !Array.isArray(tunnels) || tunnels.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-16 text-center">
          <p className="text-slate-600 mb-4 text-lg">No tunnels created yet</p>
          <Link
            href="/dashboard/tunnels/new"
            className="text-primary hover:text-primary-dark font-medium transition-colors"
          >
            Create your first tunnel →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {(Array.isArray(tunnels) ? tunnels : []).map((tunnel) => (
            <div
              key={tunnel.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-100"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{tunnel.name}</h3>
                    <p className="text-sm text-slate-600 mt-1 truncate">{tunnel.relay_region}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    tunnel.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    {tunnel.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-slate-600 bg-slate-50 rounded p-3">
                  <p>
                    <span className="font-medium text-slate-900">IP Range:</span> <span className="break-all">{tunnel.tunnel_ip_range}</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Created:</span>{" "}
                    {new Date(tunnel.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/dashboard/tunnels/${tunnel.id}`}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(tunnel.id)}
                    disabled={deleting === tunnel.id}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === tunnel.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
