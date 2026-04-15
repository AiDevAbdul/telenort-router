"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import apiClient from "@/lib/api-client";
import { AlertCircle } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  created_at: string;
}

export default function SettingsPage() {
  const { user } = useUser();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/users/me");
        setUserInfo(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user info");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-slate-600">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Account Information</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Full Name
            </label>
            <p className="text-lg text-slate-900">{userInfo?.full_name || "Not set"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email Address
            </label>
            <p className="text-lg text-slate-900">{userInfo?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Subscription Tier
            </label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-primary capitalize">
                {userInfo?.subscription_tier}
              </span>
              <span className="text-sm text-slate-600">
                {userInfo?.subscription_tier === "free"
                  ? "1 tunnel, 1 exit agent"
                  : "Unlimited tunnels and agents"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Member Since
            </label>
            <p className="text-lg text-slate-900">
              {userInfo?.created_at
                ? new Date(userInfo.created_at).toLocaleDateString()
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Subscription</h2>

        <div className="space-y-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">
                  {userInfo?.subscription_tier === "free" ? "Free Plan" : "Pro Plan"}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {userInfo?.subscription_tier === "free"
                    ? "1 tunnel, 1 exit agent, 1 region"
                    : "Unlimited tunnels, exit agents, all regions"}
                </p>
              </div>
              {userInfo?.subscription_tier === "free" && (
                <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-semibold mb-2">💡 Pro Plan Benefits:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Unlimited tunnels and exit agents</li>
              <li>Access to all relay regions</li>
              <li>Priority support</li>
              <li>Advanced analytics</li>
              <li>Custom domain support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6">API Keys</h2>

        <p className="text-slate-600 mb-4">
          API keys allow you to programmatically manage your tunnels and exit agents.
        </p>

        <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          Generate API Key
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
            <p className="text-sm text-red-800 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
