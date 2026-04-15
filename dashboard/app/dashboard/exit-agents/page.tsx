"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import Link from "next/link";
import { Plus, Trash2, Eye } from "lucide-react";

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
      } catch (err: any) {
        setError(err.message || "Failed to fetch exit agents");
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
      setAgents(agents.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message || "Failed to delete exit agent");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Exit Agents</h1>
          <p className="text-slate-600 mt-2">Manage your exit agents (home/office PCs)</p>
        </div>
        <Link
          href="/exit-agents/new"
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Register Agent
        </Link>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 What's an Exit Agent?</span> An exit agent is a script running on your home or office PC that creates a reverse tunnel to the relay VM. Your remote devices will route traffic through this agent's public IP.
        </p>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-600">Loading exit agents...</div>
      ) : agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-slate-600 mb-4">No exit agents registered yet</p>
          <p className="text-sm text-slate-500 mb-6">
            Run the exit agent script on your home/office PC to get started
          </p>
          <Link
            href="/exit-agents/new"
            className="text-primary hover:underline font-medium"
          >
            Register your first exit agent →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{agent.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{agent.public_ip}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    agent.status === "online"
                      ? "bg-green-100 text-green-800"
                      : agent.status === "offline"
                      ? "bg-slate-100 text-slate-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">Tunnel IP:</span> {agent.tunnel_ip}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded hover:bg-primary/90 transition-colors text-sm font-medium">
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition-colors text-sm font-medium disabled:opacity-50"
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
