"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { Plus, Trash2, Eye } from "lucide-react";

export default function TunnelsPage() {
  const { user } = useUser();
  const { tunnels, setTunnels, isLoading, setIsLoading, error, setError } = useAppStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchTunnels = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get("/tunnels");
        setTunnels(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch tunnels");
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
      setTunnels(tunnels.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete tunnel");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tunnels</h1>
          <p className="text-slate-600 mt-2">Manage your VPN tunnels</p>
        </div>
        <Link
          href="/tunnels/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Tunnel
        </Link>
      </div>

      {/* Tunnels Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-600">Loading tunnels...</div>
      ) : tunnels.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 mb-4">No tunnels created yet</p>
          <Link
            href="/tunnels/new"
            className="text-primary hover:underline font-medium"
          >
            Create your first tunnel →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tunnels.map((tunnel) => (
            <div
              key={tunnel.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{tunnel.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{tunnel.relay_region}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tunnel.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-slate-100 text-slate-800"
                  }`}>
                    {tunnel.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">IP Range:</span> {tunnel.tunnel_ip_range}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(tunnel.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/tunnels/${tunnel.id}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(tunnel.id)}
                    disabled={deleting === tunnel.id}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
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
