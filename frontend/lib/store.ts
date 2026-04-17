import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  created_at: string;
}

export interface Tunnel {
  id: string;
  name: string;
  relay_region: string;
  tunnel_ip_range: string;
  is_active: boolean;
  created_at: string;
}

export interface ExitAgent {
  id: string;
  name: string;
  public_ip: string;
  status: "online" | "offline" | "error";
  tunnel_ip: string;
}

interface AppStore {
  user: User | null;
  tunnels: Tunnel[];
  selectedTunnel: Tunnel | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setTunnels: (tunnels: Tunnel[]) => void;
  setSelectedTunnel: (tunnel: Tunnel | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addTunnel: (tunnel: Tunnel) => void;
  removeTunnel: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  tunnels: [],
  selectedTunnel: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setTunnels: (tunnels) => set({ tunnels }),
  setSelectedTunnel: (tunnel) => set({ selectedTunnel: tunnel }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  addTunnel: (tunnel) =>
    set((state) => ({ tunnels: [...state.tunnels, tunnel] })),
  removeTunnel: (id) =>
    set((state) => ({
      tunnels: state.tunnels.filter((t) => t.id !== id),
    })),
}));
