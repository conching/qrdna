import { create } from "zustand";
import {
  type QRContentType,
  type QRStyleConfig,
  DEFAULT_STYLE,
} from "@/lib/qr/types";

interface QREditorState {
  contentType: QRContentType;
  inputData: Record<string, string | boolean | number>;
  style: QRStyleConfig;
  logoFile: File | null;
  name: string;

  setContentType: (type: QRContentType) => void;
  setInputData: (
    data: Partial<Record<string, string | boolean | number>>,
  ) => void;
  setStyle: (partial: Partial<QRStyleConfig>) => void;
  setLogoFile: (file: File | null) => void;
  setName: (name: string) => void;
  reset: () => void;
  applyTemplate: (style: QRStyleConfig) => void;
}

const initialState = {
  contentType: "url" as QRContentType,
  inputData: {} as Record<string, string | boolean | number>,
  style: { ...DEFAULT_STYLE },
  logoFile: null as File | null,
  name: "",
};

export const useQREditorStore = create<QREditorState>()((set, get) => ({
  ...initialState,

  setContentType: (type: QRContentType) =>
    set({
      contentType: type,
      inputData: {},
    }),

  setInputData: (data: Partial<Record<string, string | boolean | number>>) =>
    set((state) => {
      const merged: Record<string, string | boolean | number> = { ...state.inputData };
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          merged[key] = value;
        }
      }
      return { inputData: merged };
    }),

  setStyle: (partial: Partial<QRStyleConfig>) =>
    set((state) => {
      const nextStyle = { ...state.style, ...partial };

      // Auto-set error correction to "H" when a logo is present
      // (high EC is needed so the logo doesn't break scanning)
      if (state.logoFile || nextStyle.logoUrl) {
        nextStyle.errorCorrection = "H";
      }

      return { style: nextStyle };
    }),

  setLogoFile: (file: File | null) =>
    set((state) => {
      // When adding a logo, ensure error correction is high enough
      if (file) {
        return {
          logoFile: file,
          style: { ...state.style, errorCorrection: "H" },
        };
      }
      return { logoFile: file };
    }),

  setName: (name: string) => set({ name }),

  reset: () =>
    set({
      ...initialState,
      style: { ...DEFAULT_STYLE },
    }),

  applyTemplate: (style: QRStyleConfig) =>
    set((state) => {
      const nextStyle = { ...style };

      // Preserve high error correction when a logo is present
      if (state.logoFile || nextStyle.logoUrl) {
        nextStyle.errorCorrection = "H";
      }

      return { style: nextStyle };
    }),
}));
