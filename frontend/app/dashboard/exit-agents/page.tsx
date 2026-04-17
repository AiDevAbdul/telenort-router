"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { Plus, Trash2, Eye, AlertCircle } from "lucide-react";

interface ExitAgent {
  id: string;
  name: string;
  public_ip: string;
  status: "online" | "offline" | "error";
  tunnel_ip: string;
  created_at: string;
}

export default function ExitAgentsPage() {
  const { user } = useUser();
  const [agents, setAgents] = useState<ExitAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        // In a real app, this would fetch from /exit-agents endpoint
        setAgents([]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch exit agents";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAgents();
    }
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exit agent?")) return;

    try {
      setDeleting(id);
      await apiClient.delete(`/exit-agents/${id}`);
      setAgents(Array.isArray(agents) ? agents.filter((a) => a.id !== id) : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete exit agent";
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Exit Agents</h1>
          <p className="text-slate-600 mt-2">Manage your exit agents (home/office PCs)</p>
        </div>
        <Link
          href="/dashboard/exit-agents/new"
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Register Agent</span>
          <span className="sm:hidden">Register</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 What's an Exit Agent?</span> An exit agent is a script running on your home or office PC that creates a reverse tunnel to the relay VM. Your remote devices will route traffic through this agent's public IP.
        </p>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-600">Loading exit agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-16 text-center">
          <p className="text-slate-600 mb-4 text-lg">No exit agents registered yet</p>
          <p className="text-sm text-slate-500 mb-6">
            Run the exit agent script on your home/office PC to get started
          </p>
          <Link
            href="/dashboard/exit-agents/new"
            className="text-primary hover:text-primary-dark font-medium transition-colors"
          >
            Register your first exit agent →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {(Array.isArray(agents) ? agents : []).map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-slate-100"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-slate-900 truncate">{agent.name}</h3>
                    <p className="text-sm text-slate-600 mt-1 font-mono break-all">{agent.public_ip}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    agent.status === "online"
                      ? "bg-green-100 text-green-800"
                      : agent.status === "offline"
                      ? "bg-slate-100 text-slate-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-slate-600 bg-slate-50 rounded p-3">
                  <p>
                    <span className="font-medium text-slate-900">Tunnel IP:</span> <span className="font-mono break-all">{agent.tunnel_ip}</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === agent.id ? "Deleting..." : "Delete"}
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
