"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  BusinessCard,
  CreateCardPayload,
  UpdateCardPayload,
  CardPhone,
  CardEmail,
  CardWebsite,
  CardSocialLink,
  CardTheme,
  CardLayout,
  CardFont,
} from "@/lib/cards/types";
import { DEFAULT_THEME } from "@/lib/cards/types";

// ─────────────────────────────────────────────────────────────────────────────
// Section collapse helper
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border">
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="space-y-4 border-t px-4 py-4">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CardFormProps {
  card?: BusinessCard; // present in edit mode
}

// ─────────────────────────────────────────────────────────────────────────────
// Main form
// ─────────────────────────────────────────────────────────────────────────────

export function CardForm({ card }: CardFormProps) {
  const router = useRouter();
  const isEdit = !!card;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic fields
  const [firstName, setFirstName] = useState(card?.first_name ?? "");
  const [lastName, setLastName] = useState(card?.last_name ?? "");
  const [pronouns, setPronouns] = useState(card?.pronouns ?? "");
  const [title, setTitle] = useState(card?.title ?? "");
  const [company, setCompany] = useState(card?.company ?? "");
  const [department, setDepartment] = useState(card?.department ?? "");
  const [bio, setBio] = useState(card?.bio ?? "");
  const [headshotUrl, setHeadshotUrl] = useState(card?.headshot_url ?? "");
  const [companyLogoUrl, setCompanyLogoUrl] = useState(card?.company_logo_url ?? "");

  // Contact arrays
  const [phones, setPhones] = useState<CardPhone[]>(card?.phones ?? []);
  const [emails, setEmails] = useState<CardEmail[]>(card?.emails ?? []);
  const [websites, setWebsites] = useState<CardWebsite[]>(card?.websites ?? []);
  const [socialLinks, setSocialLinks] = useState<CardSocialLink[]>(card?.social_links ?? []);

  // Address
  const [street, setStreet] = useState(card?.address?.street ?? "");
  const [city, setCity] = useState(card?.address?.city ?? "");
  const [state, setState] = useState(card?.address?.state ?? "");
  const [zip, setZip] = useState(card?.address?.zip ?? "");
  const [country, setCountry] = useState(card?.address?.country ?? "");

  // Theme
  const [theme, setTheme] = useState<CardTheme>({
    ...DEFAULT_THEME,
    ...(card?.theme ?? {}),
  });

  const updateTheme = (patch: Partial<CardTheme>) =>
    setTheme((t) => ({ ...t, ...patch }));

  // ── Phone helpers ──
  const addPhone = () =>
    setPhones((prev) => [...prev, { label: "mobile", number: "" }]);
  const updatePhone = (i: number, patch: Partial<CardPhone>) =>
    setPhones((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const removePhone = (i: number) =>
    setPhones((prev) => prev.filter((_, idx) => idx !== i));

  // ── Email helpers ──
  const addEmail = () =>
    setEmails((prev) => [...prev, { label: "work", address: "" }]);
  const updateEmail = (i: number, patch: Partial<CardEmail>) =>
    setEmails((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeEmail = (i: number) =>
    setEmails((prev) => prev.filter((_, idx) => idx !== i));

  // ── Website helpers ──
  const addWebsite = () =>
    setWebsites((prev) => [...prev, { label: "Website", url: "" }]);
  const updateWebsite = (i: number, patch: Partial<CardWebsite>) =>
    setWebsites((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const removeWebsite = (i: number) =>
    setWebsites((prev) => prev.filter((_, idx) => idx !== i));

  // ── Social helpers ──
  const addSocial = () =>
    setSocialLinks((prev) => [...prev, { platform: "linkedin", url: "" }]);
  const updateSocial = (i: number, patch: Partial<CardSocialLink>) =>
    setSocialLinks((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeSocial = (i: number) =>
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== i));

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const address =
      street || city || state || zip || country
        ? { street, city, state, zip, country }
        : undefined;

    const payload: CreateCardPayload | UpdateCardPayload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      pronouns: pronouns.trim() || undefined,
      title: title.trim() || undefined,
      company: company.trim() || undefined,
      department: department.trim() || undefined,
      bio: bio.trim() || undefined,
      phones: phones.filter((p) => p.number.trim()),
      emails: emails.filter((e) => e.address.trim()),
      websites: websites.filter((w) => w.url.trim()),
      social_links: socialLinks.filter((s) => s.url.trim()),
      address,
      headshot_url: headshotUrl.trim() || undefined,
      company_logo_url: companyLogoUrl.trim() || undefined,
      theme,
    };

    try {
      const res = isEdit
        ? await fetch(`/api/v1/cards/${card.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/v1/cards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Failed to save card");
        return;
      }

      router.push("/cards");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* ── Identity ── */}
      <Section title="Identity" defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="Jane"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Smith"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="pronouns">Pronouns</Label>
          <Input
            id="pronouns"
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            placeholder="she/her"
          />
        </div>
        <div>
          <Label htmlFor="title">Job title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Senior Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short bio…"
            rows={3}
          />
        </div>
      </Section>

      {/* ── Photos ── */}
      <Section title="Photos" defaultOpen={false}>
        <div>
          <Label htmlFor="headshotUrl">Headshot URL</Label>
          <Input
            id="headshotUrl"
            value={headshotUrl}
            onChange={(e) => setHeadshotUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </div>
        <div>
          <Label htmlFor="companyLogoUrl">Company logo URL</Label>
          <Input
            id="companyLogoUrl"
            value={companyLogoUrl}
            onChange={(e) => setCompanyLogoUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </div>
      </Section>

      {/* ── Phones ── */}
      <Section title={`Phones ${phones.length > 0 ? `(${phones.length})` : ""}`} defaultOpen={phones.length > 0}>
        {phones.map((phone, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-28">
              <Label>Type</Label>
              <Select
                value={phone.label}
                onValueChange={(v) => updatePhone(i, { label: v as CardPhone["label"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["mobile", "work", "home", "fax", "other"] as const).map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Number</Label>
              <Input
                value={phone.number}
                onChange={(e) => updatePhone(i, { number: e.target.value })}
                placeholder="+1 555 123 4567"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove phone ${i + 1}`} onClick={() => removePhone(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPhone} className="gap-2">
          <Plus className="h-4 w-4" /> Add phone
        </Button>
      </Section>

      {/* ── Emails ── */}
      <Section title={`Emails ${emails.length > 0 ? `(${emails.length})` : ""}`} defaultOpen={emails.length > 0}>
        {emails.map((email, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-28">
              <Label>Type</Label>
              <Select
                value={email.label}
                onValueChange={(v) => updateEmail(i, { label: v as CardEmail["label"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["work", "personal", "other"] as const).map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Address</Label>
              <Input
                value={email.address}
                onChange={(e) => updateEmail(i, { address: e.target.value })}
                type="email"
                placeholder="jane@example.com"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove email ${i + 1}`} onClick={() => removeEmail(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addEmail} className="gap-2">
          <Plus className="h-4 w-4" /> Add email
        </Button>
      </Section>

      {/* ── Websites ── */}
      <Section title={`Websites ${websites.length > 0 ? `(${websites.length})` : ""}`} defaultOpen={websites.length > 0}>
        {websites.map((site, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-28">
              <Label>Label</Label>
              <Input
                value={site.label}
                onChange={(e) => updateWebsite(i, { label: e.target.value })}
                placeholder="Portfolio"
              />
            </div>
            <div className="flex-1">
              <Label>URL</Label>
              <Input
                value={site.url}
                onChange={(e) => updateWebsite(i, { url: e.target.value })}
                type="url"
                placeholder="https://…"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove website ${i + 1}`} onClick={() => removeWebsite(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addWebsite} className="gap-2">
          <Plus className="h-4 w-4" /> Add website
        </Button>
      </Section>

      {/* ── Social links ── */}
      <Section title={`Social ${socialLinks.length > 0 ? `(${socialLinks.length})` : ""}`} defaultOpen={socialLinks.length > 0}>
        {socialLinks.map((social, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="w-32">
              <Label>Platform</Label>
              <Select
                value={social.platform}
                onValueChange={(v) => updateSocial(i, { platform: v as CardSocialLink["platform"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["linkedin", "twitter", "instagram", "github", "youtube", "tiktok", "facebook", "other"] as const).map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>URL</Label>
              <Input
                value={social.url}
                onChange={(e) => updateSocial(i, { url: e.target.value })}
                type="url"
                placeholder="https://…"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label={`Remove social ${i + 1}`} onClick={() => removeSocial(i)}>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addSocial} className="gap-2">
          <Plus className="h-4 w-4" /> Add social
        </Button>
      </Section>

      {/* ── Address ── */}
      <Section title="Address" defaultOpen={false}>
        <div>
          <Label htmlFor="street">Street</Label>
          <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="state">State / Province</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="zip">Zip / Postal code</Label>
            <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} />
          </div>
        </div>
      </Section>

      {/* ── Theme ── */}
      <Section title="Theme & Layout" defaultOpen>
        <div>
          <Label>Layout</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {(["centered", "left-aligned", "split", "minimal"] as CardLayout[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => updateTheme({ layout: l })}
                className={cn(
                  "rounded-md border p-2 text-xs font-medium capitalize transition-colors",
                  theme.layout === l
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted text-muted-foreground hover:border-primary/50",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="primaryColor">Primary color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primaryColor"
                value={theme.primaryColor}
                onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={theme.primaryColor} onChange={(e) => updateTheme({ primaryColor: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label htmlFor="accentColor">Accent color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="accentColor"
                value={theme.accentColor}
                onChange={(e) => updateTheme({ accentColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={theme.accentColor} onChange={(e) => updateTheme({ accentColor: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label htmlFor="bgColor">Background</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="bgColor"
                value={theme.bgColor}
                onChange={(e) => updateTheme({ bgColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={theme.bgColor} onChange={(e) => updateTheme({ bgColor: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div>
            <Label htmlFor="textColor">Text color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="textColor"
                value={theme.textColor}
                onChange={(e) => updateTheme({ textColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input value={theme.textColor} onChange={(e) => updateTheme({ textColor: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
        </div>

        <div>
          <Label>Font</Label>
          <Select
            value={theme.font}
            onValueChange={(v) => updateTheme({ font: v as CardFont })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inter">Inter (Sans-serif)</SelectItem>
              <SelectItem value="space-grotesk">Space Grotesk</SelectItem>
              <SelectItem value="playfair">Playfair Display (Serif)</SelectItem>
              <SelectItem value="mono">JetBrains Mono</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="darkMode"
            checked={theme.darkMode}
            onCheckedChange={(v) => updateTheme({ darkMode: v })}
          />
          <Label htmlFor="darkMode">Dark mode</Label>
        </div>
      </Section>

      {/* ── Submit ── */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create card"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
