"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { Plus, AlertCircle } from "lucide-react";

interface DashboardStats {
  totalTunnels: number;
  activeTunnels: number;
  totalExitAgents: number;
  onlineAgents: number;
}

export default function DashboardPage() {
  const { user } = useUser();
  const { tunnels, setTunnels, isLoading, setIsLoading, error, setError } = useAppStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalTunnels: 0,
    activeTunnels: 0,
    totalExitAgents: 0,
    onlineAgents: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get("/tunnels");
        setTunnels(response.data);

        // Calculate stats
        setStats({
          totalTunnels: response.data.length,
          activeTunnels: response.data.filter((t: any) => t.is_active).length,
          totalExitAgents: 0, // Will be calculated from exit agents
          onlineAgents: 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, setTunnels, setIsLoading, setError]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back, {user?.firstName}!</p>
        </div>
        <Link
          href="/tunnels/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Tunnel
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tunnels"
          value={stats.totalTunnels}
          icon="🌐"
        />
        <StatCard
          title="Active Tunnels"
          value={stats.activeTunnels}
          icon="✅"
        />
        <StatCard
          title="Exit Agents"
          value={stats.totalExitAgents}
          icon="🔌"
        />
        <StatCard
          title="Online Agents"
          value={stats.onlineAgents}
          icon="🟢"
        />
      </div>

      {/* Recent Tunnels */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Recent Tunnels</h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-slate-600">Loading...</div>
        ) : tunnels.length === 0 ? (
          <div className="p-6 text-center text-slate-600">
            <p>No tunnels yet. Create one to get started!</p>
            <Link
              href="/tunnels/new"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Create Tunnel →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Region</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Created</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tunnels.slice(0, 5).map((tunnel) => (
                  <tr key={tunnel.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{tunnel.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{tunnel.relay_region}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        tunnel.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {tunnel.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(tunnel.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/tunnels/${tunnel.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  );
}
