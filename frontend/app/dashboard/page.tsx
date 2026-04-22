"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import apiClient, { setClerkToken } from "@/lib/api-client";
import { useAppStore, Tunnel } from "@/lib/store";
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
  const { getToken } = useAuth();
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
        setError(""); // Clear previous errors

        // Get and set the Clerk token
        const token = await getToken();
        if (token) {
          setClerkToken(token);
        } else {
          setError("Failed to get authentication token");
          setIsLoading(false);
          return;
        }

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

        // Calculate stats
        setStats({
          totalTunnels: tunnelData.length,
          activeTunnels: tunnelData.filter((t) => t.is_active).length,
          totalExitAgents: 0, // Will be calculated from exit agents
          onlineAgents: 0,
        });
      } catch (err: any) {
        // Don't redirect on 401, just show error
        if (err.response?.status === 401) {
          setError("Authentication failed. Please sign in again.");
        } else if (err.code === "ECONNREFUSED") {
          setError("Backend API is not running. Please start the backend server.");
        } else {
          let errorMessage = "Failed to fetch data";

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
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, setTunnels, setIsLoading, setError]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back, {user?.firstName}!</p>
        </div>
        <Link
          href="/dashboard/tunnels/new"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          New Tunnel
        </Link>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Tunnels"
          value={stats.totalTunnels}
          icon="🌐"
          color="blue"
        />
        <StatCard
          title="Active Tunnels"
          value={stats.activeTunnels}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Exit Agents"
          value={stats.totalExitAgents}
          icon="🔌"
          color="purple"
        />
        <StatCard
          title="Online Agents"
          value={stats.onlineAgents}
          icon="🟢"
          color="cyan"
        />
      </div>

      {/* Recent Tunnels */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Recent Tunnels</h2>
        </div>

        {isLoading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-slate-600">Loading tunnels...</p>
          </div>
        ) : !Array.isArray(tunnels) || tunnels.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className="text-slate-600 mb-4">No tunnels yet. Create one to get started!</p>
            <Link
              href="/dashboard/tunnels/new"
              className="text-primary hover:text-primary-dark font-medium transition-colors"
            >
              Create Tunnel →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Name</th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-sm font-semibold text-slate-900">Region</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-sm font-semibold text-slate-900">Created</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(Array.isArray(tunnels) ? tunnels : []).slice(0, 5).map((tunnel) => (
                  <tr key={tunnel.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-900 truncate">{tunnel.name}</td>
                    <td className="hidden sm:table-cell px-6 py-4 text-sm text-slate-600">{tunnel.relay_region}</td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                        tunnel.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {tunnel.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-slate-600">
                      {new Date(tunnel.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                      <Link
                        href={`/dashboard/tunnels/${tunnel.id}`}
                        className="text-primary hover:text-primary-dark font-medium transition-colors"
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

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "cyan";
}

const colorMap = {
  blue: "bg-blue-50 border-blue-200",
  green: "bg-green-50 border-green-200",
  purple: "bg-purple-50 border-purple-200",
  cyan: "bg-cyan-50 border-cyan-200",
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className={`${colorMap[color]} border rounded-lg p-6 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <span className="text-4xl opacity-80">{icon}</span>
      </div>
    </div>
  );
}
