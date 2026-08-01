"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";

import { QRDataForm } from "@/components/qr/qr-data-forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_STYLE, type QRContentType, type QRStyleConfig } from "@/lib/qr/types";
import type { QRInputMap } from "@/lib/qr/build-data";
import { useQREditorStore } from "@/stores/qr-editor-store";
import type { QRCodeRow } from "@/types/database";

/**
 * Edit the content of a saved static QR code.
 *
 * Static codes carry their data inside the symbol, and until now that data was
 * write-once: the detail page exposed the name and nothing else. Duplicating a
 * contact card therefore produced a copy of somebody else's details that could
 * never be corrected — the only route to a changed phone number was to build a
 * new code from scratch in /create.
 *
 * The forms are the same components /create uses, driven by the same store, so
 * there is one implementation of "what a vCard form is" rather than two that
 * drift.
 */

/** Read a row's stored static data as the loose map the editor forms expect. */
export function staticDataOf(qr: Pick<QRCodeRow, "static_data">): QRInputMap {
  const sd = qr.static_data;
  if (!sd || typeof sd !== "object" || Array.isArray(sd)) return {};
  return sd as QRInputMap;
}

/** Order-insensitive comparison, so a re-serialised map is not "changed". */
function sameData(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    // An absent key and an empty string mean the same thing to every encoder,
    // so a form that writes "" where the DB had nothing is not a real edit.
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
    .join(",")}}`;
}

interface QRContentEditorProps {
  qr: QRCodeRow;
  /** Fires on every keystroke so the preview and export track the draft. */
  onDraftChange: (data: QRInputMap) => void;
  onSaved: (row: QRCodeRow) => void;
}

export function QRContentEditor({
  qr,
  onDraftChange,
  onSaved,
}: QRContentEditorProps) {
  const inputData = useQREditorStore((s) => s.inputData);
  const [isSaving, setIsSaving] = useState(false);
  // The store starts at its defaults (content type `url`, no data). Rendering
  // the forms before hydration would show a URL box on a contact card for one
  // frame, and read as "unsaved changes" against an empty draft.
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);
  const isHydrated = hydratedFor === qr.id;

  // The store is a module-level singleton shared with /create. Hydrate it from
  // this row on mount and clear it on the way out, so a half-edited code never
  // shows up pre-filled in the create page.
  useEffect(() => {
    const store = useQREditorStore.getState();
    // setContentType clears inputData, so it has to come first.
    store.setContentType(qr.content_type as QRContentType);
    store.setInputData(staticDataOf(qr));
    store.setStyle(resolveStyle(qr));
    store.setName(qr.name);
    setHydratedFor(qr.id);

    return () => {
      useQREditorStore.getState().reset();
      setHydratedFor(null);
    };
    // Deliberately keyed on identity, not content: re-running after a save
    // would throw away whatever the user typed next.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr.id, qr.content_type]);

  // Publish the draft upward so the preview renders what the user is typing
  // rather than what was last saved.
  useEffect(() => {
    if (!isHydrated) return;
    onDraftChange(inputData);
  }, [inputData, onDraftChange, isHydrated]);

  const saved = staticDataOf(qr);
  const isDirty = isHydrated && !sameData(inputData, saved);

  const handleRevert = useCallback(() => {
    const store = useQREditorStore.getState();
    store.setContentType(qr.content_type as QRContentType);
    store.setInputData(staticDataOf(qr));
  }, [qr]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/v1/qr/${qr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staticData: useQREditorStore.getState().inputData,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? "Failed to save content");
      }
      onSaved(json.data as QRCodeRow);
      toast.success("Content saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save content");
    } finally {
      setIsSaving(false);
    }
  }, [qr.id, onSaved]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Content</CardTitle>
        <CardDescription>
          {qr.is_active
            ? "Editing a published code changes what the printed symbol encodes. Re-export and reprint after saving."
            : "This code is not published yet. Change anything you like, then publish when it is right."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isHydrated ? (
          <QRDataForm />
        ) : (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-2/3" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Save content
              </>
            )}
          </Button>
          {isDirty && (
            <Button variant="ghost" onClick={handleRevert} disabled={isSaving}>
              <RotateCcw className="mr-2 size-4" />
              Discard changes
            </Button>
          )}
          <span
            className="text-xs text-muted-foreground"
            data-testid="content-dirty-state"
          >
            {!isHydrated
              ? "Loading…"
              : isDirty
                ? "Unsaved changes"
                : "All changes saved"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function resolveStyle(qr: QRCodeRow): QRStyleConfig {
  if (qr.style && typeof qr.style === "object" && !Array.isArray(qr.style)) {
    return { ...DEFAULT_STYLE, ...(qr.style as Partial<QRStyleConfig>) };
  }
  return { ...DEFAULT_STYLE };
}
