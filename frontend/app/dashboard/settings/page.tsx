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
        const userData: UserInfo = response.data;
        setUserInfo(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch user info";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserInfo();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account and preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Account Information</h2>

        <div className="space-y-6">
          <div className="pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Full Name
            </label>
            <p className="text-lg text-slate-900 font-medium">{userInfo?.full_name || "Not set"}</p>
          </div>

          <div className="pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Email Address
            </label>
            <p className="text-lg text-slate-900 font-medium font-mono">{userInfo?.email}</p>
          </div>

          <div className="pb-6 border-b border-slate-200 last:border-b-0 last:pb-0">
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Subscription Tier
            </label>
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-primary capitalize">
                {userInfo?.subscription_tier}
              </span>
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
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
            <p className="text-lg text-slate-900 font-medium">
              {userInfo?.created_at
                ? new Date(userInfo.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Subscription</h2>

        <div className="space-y-4">
          <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">
                  {userInfo?.subscription_tier === "free" ? "Free Plan" : "Pro Plan"}
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  {userInfo?.subscription_tier === "free"
                    ? "1 tunnel, 1 exit agent, 1 region"
                    : "Unlimited tunnels, exit agents, all regions"}
                </p>
              </div>
              {userInfo?.subscription_tier === "free" && (
                <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap ml-4">
                  Upgrade to Pro
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-semibold mb-3">💡 Pro Plan Benefits:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span>Unlimited tunnels and exit agents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span>Access to all relay regions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                <span>Custom domain support</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">API Keys</h2>

        <p className="text-slate-600 mb-6">
          API keys allow you to programmatically manage your tunnels and exit agents.
        </p>

        <button className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-all duration-200 font-medium">
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
            <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-200 text-sm font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
