"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { QRHeadshotUpload } from "@/components/qr/qr-headshot-upload";
import { toVCardData } from "@/lib/qr/build-data";
import { encodeVCard } from "@/lib/qr/encoders";
import { byteLength, comfortableCapacity } from "@/lib/vcard/build";
import {
  RepeatableRows,
  RepeatableStrings,
  readRows,
  readStrings,
  PHONE_LABELS,
  EMAIL_LABELS,
  SOCIAL_PLATFORMS,
} from "./vcard-rows";

export function VCardForm() {
  const { inputData, setInputData, style } = useQREditorStore();

  const field = (key: string) =>
    typeof inputData[key] === "string" ? (inputData[key] as string) : "";

  // Rows are derived, never mirrored into local state — that would need an
  // effect, and the legacy single-value fields let old records open unchanged.
  const phoneRows = readRows(inputData.phones, inputData.phone, "number", {
    label: "Mobile",
  });
  const emailRows = readRows(inputData.emails, inputData.email, "address", {
    label: "Work",
  });
  const websiteValues = readStrings(inputData.websites, inputData.website);
  const socialRows = readRows(inputData.socialLinks, undefined, "url", {
    platform: "LinkedIn",
  });

  const data = toVCardData(inputData);
  const hosted = data.hostedContact === true;
  const hasPhoto = !!data.photoDataUrl;

  // Only meaningful for the encoded-directly mode — the hosted mode encodes a
  // short URL, which is always tiny.
  const encodedBytes = hosted ? 0 : byteLength(encodeVCard(data));
  const ceiling = comfortableCapacity(style.errorCorrection);
  const tooBig = !hosted && encodedBytes > ceiling;

  return (
    <div className="space-y-6">
      <QRHeadshotUpload />

      {/* ---- Delivery mode ---------------------------------------------- */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none">
          How the contact is delivered
        </legend>

        <div className="grid gap-2 sm:grid-cols-2">
          <DeliveryOption
            selected={!hosted}
            disabled={hasPhoto}
            title="Encode in the code"
            description="The contact is inside the QR itself. Scans forever, with no internet and no dependency on us — but cannot carry a photo."
            onSelect={() => setInputData({ hostedContact: false })}
          />
          <DeliveryOption
            selected={hosted}
            title="Link to contact file"
            description="The QR holds a short link that hands over a .vcf with the headshot. Needs a network connection when scanned."
            onSelect={() => setInputData({ hostedContact: true })}
          />
        </div>

        {hasPhoto && (
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            A QR code holds at most 2,953 bytes, so a headshot cannot fit inside
            one. With a photo attached, the code links to the contact file.
            Remove the photo to encode the contact directly instead.
          </p>
        )}

        {!hosted && (
          <p
            className={cn(
              "flex items-start gap-1.5 text-xs",
              tooBig ? "text-destructive" : "text-muted-foreground",
            )}
            role={tooBig ? "alert" : undefined}
          >
            {tooBig ? (
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            )}
            {tooBig
              ? `This contact is ${encodedBytes} bytes — past the ~${ceiling} that stays reliably scannable off paper. Shorten the note or address, or switch to a linked contact file.`
              : `${encodedBytes} of ~${ceiling} bytes used at error correction ${style.errorCorrection}.`}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium leading-none">Name</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={field("firstName")}
              onChange={(e) => setInputData({ firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={field("lastName")}
              onChange={(e) => setInputData({ lastName: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      {/* Writing the array clears the legacy scalar, so the merge in
          toVCardData cannot emit the same number twice. */}
      <RepeatableRows
        legend="Phone numbers"
        noun="Phone"
        rows={phoneRows}
        onChange={(rows) => setInputData({ phones: rows, phone: "" })}
        blank={{ label: "Mobile", number: "" }}
        valueKey="number"
        labelKey="label"
        labelOptions={PHONE_LABELS}
        inputType="tel"
        placeholder="+1 (555) 123-4567"
      />

      <RepeatableRows
        legend="Email addresses"
        noun="Email"
        rows={emailRows}
        onChange={(rows) => setInputData({ emails: rows, email: "" })}
        blank={{ label: "Work", address: "" }}
        valueKey="address"
        labelKey="label"
        labelOptions={EMAIL_LABELS}
        inputType="email"
        placeholder="john@example.com"
      />

      <RepeatableStrings
        legend="Websites"
        noun="Website"
        values={websiteValues}
        onChange={(values) => setInputData({ websites: values, website: "" })}
        placeholder="example.com"
      />

      <RepeatableRows
        legend="Social profiles"
        noun="Profile"
        rows={socialRows}
        onChange={(rows) => setInputData({ socialLinks: rows })}
        blank={{ platform: "LinkedIn", url: "" }}
        valueKey="url"
        labelKey="platform"
        labelOptions={SOCIAL_PLATFORMS}
        placeholder="https://linkedin.com/in/…"
      />

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium leading-none">Company</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input
              id="organization"
              placeholder="Acme Inc."
              value={field("organization")}
              onChange={(e) => setInputData({ organization: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Software Engineer"
              value={field("title")}
              onChange={(e) => setInputData({ title: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium leading-none">Address</legend>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street</Label>
            <Input
              id="street"
              placeholder="123 Main St"
              value={field("street")}
              onChange={(e) => setInputData({ street: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="San Francisco"
                value={field("city")}
                onChange={(e) => setInputData({ city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="CA"
                value={field("state")}
                onChange={(e) => setInputData({ state: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                placeholder="94102"
                value={field("zip")}
                onChange={(e) => setInputData({ zip: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="US"
                value={field("country")}
                onChange={(e) => setInputData({ country: e.target.value })}
              />
            </div>
          </div>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <textarea
          id="note"
          placeholder="Additional notes..."
          value={field("note")}
          onChange={(e) => setInputData({ note: e.target.value })}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delivery mode option
// ---------------------------------------------------------------------------

function DeliveryOption({
  selected,
  disabled,
  title,
  description,
  onSelect,
}: {
  selected: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-accent",
        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="mt-1 block text-xs text-muted-foreground">
        {description}
      </span>
    </button>
  );
}
