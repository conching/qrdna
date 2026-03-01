import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileNavVisible: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  mobileNavVisible: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setMobileNavVisible: (visible: boolean) =>
    set({ mobileNavVisible: visible }),
}));
