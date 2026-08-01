"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QRInputValue } from "@/stores/qr-editor-store";

export type Row = Record<string, string>;

/**
 * Read repeatable rows out of the editor's loose input map, falling back to the
 * legacy single-value field so contacts saved before multi-value support still
 * open with their data intact.
 */
export function readRows(
  value: QRInputValue | undefined,
  legacy: QRInputValue | undefined,
  legacyKey: string,
  legacyDefaults: Row = {},
): Row[] {
  if (Array.isArray(value) && typeof value[0] !== "string") {
    return value as Row[];
  }
  if (typeof legacy === "string" && legacy.trim()) {
    return [{ ...legacyDefaults, [legacyKey]: legacy }];
  }
  return [];
}

export function readStrings(
  value: QRInputValue | undefined,
  legacy: QRInputValue | undefined,
): string[] {
  if (Array.isArray(value) && (value.length === 0 || typeof value[0] === "string")) {
    return value as string[];
  }
  if (typeof legacy === "string" && legacy.trim()) return [legacy];
  return [];
}

export const PHONE_LABELS = ["Mobile", "Work", "Home", "Main", "Fax"];
export const EMAIL_LABELS = ["Work", "Personal", "Other"];
export const SOCIAL_PLATFORMS = [
  "LinkedIn",
  "X",
  "Instagram",
  "GitHub",
  "YouTube",
  "TikTok",
  "Facebook",
  "Bluesky",
];

interface RepeatableProps {
  legend: string;
  /** Word used in the add button and the per-row remove label. */
  noun: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  /** Shape of a freshly added row. */
  blank: Row;
  /** Key holding the free-text value. */
  valueKey: string;
  placeholder: string;
  inputType?: string;
  /** When set, renders a label dropdown before the value input. */
  labelKey?: string;
  labelOptions?: string[];
}

/**
 * A list of removable rows with an add button.
 *
 * A real business contact has a mobile *and* a desk line, a work *and* a
 * personal address — capping each at one silently drops information the person
 * is trying to hand over.
 */
export function RepeatableRows({
  legend,
  noun,
  rows,
  onChange,
  blank,
  valueKey,
  placeholder,
  inputType = "text",
  labelKey,
  labelOptions,
}: RepeatableProps) {
  const update = (index: number, patch: Row) =>
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const remove = (index: number) =>
    onChange(rows.filter((_, i) => i !== index));

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">{legend}</legend>

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground">
          None added.
        </p>
      )}

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            {labelKey && labelOptions && (
              <Select
                value={row[labelKey] || labelOptions[0]}
                onValueChange={(v) => update(i, { [labelKey]: v })}
              >
                <SelectTrigger
                  className="w-[110px] shrink-0"
                  aria-label={`${noun} ${i + 1} type`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {labelOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              type={inputType}
              value={row[valueKey] ?? ""}
              placeholder={placeholder}
              aria-label={`${noun} ${i + 1}`}
              onChange={(e) => update(i, { [valueKey]: e.target.value })}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`Remove ${noun.toLowerCase()} ${i + 1}`}
              onClick={() => remove(i)}
            >
              <Trash2 className="size-4 text-muted-foreground" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { ...blank }])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add {noun.toLowerCase()}
      </Button>
    </fieldset>
  );
}

/** Simple string-list variant, for websites. */
export function RepeatableStrings({
  legend,
  noun,
  values,
  onChange,
  placeholder,
}: {
  legend: string;
  noun: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium leading-none">{legend}</legend>

      {values.length === 0 && (
        <p className="text-xs text-muted-foreground">None added.</p>
      )}

      <div className="space-y-2">
        {values.map((value, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              aria-label={`${noun} ${i + 1}`}
              onChange={(e) =>
                onChange(values.map((v, j) => (j === i ? e.target.value : v)))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label={`Remove ${noun.toLowerCase()} ${i + 1}`}
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              <Trash2 className="size-4 text-muted-foreground" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...values, ""])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add {noun.toLowerCase()}
      </Button>
    </fieldset>
  );
}

export { Label };
