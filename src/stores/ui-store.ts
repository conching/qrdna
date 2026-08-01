import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  mobileNavVisible: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  /**
   * The **mobile** navigation sheet, and nothing else — the desktop sidebar is
   * pure CSS (`hidden md:block`) and never reads this.
   *
   * It used to default to `true`, so the sheet was open on first render of
   * every signed-in page at every viewport. Radix sheets are modal: an open one
   * puts `aria-hidden="true"` on the rest of the document and traps focus. On a
   * desktop the sheet itself is inside a `md:hidden` wrapper, so nothing was
   * visible and nobody noticed — but the whole app was missing from the
   * accessibility tree, and tab went nowhere. Closed is the only correct
   * starting state for a menu you open with a button.
   */
  sidebarOpen: false,
  mobileNavVisible: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  setMobileNavVisible: (visible: boolean) =>
    set({ mobileNavVisible: visible }),
}));
