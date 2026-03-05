"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  CreditCard,
  Check,
  User,
  SlidersHorizontal,
  Shield,
  ShieldCheck,
  Lock,
  Download,
  Trash2,
  Save,
  Loader2,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/hooks/use-user";
import { UpgradeModal } from "@/components/billing/upgrade-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

// ---------------------------------------------------------------------------
// Account Tab
// ---------------------------------------------------------------------------

function AccountTab() {
  const { user, loading } = useUser();

  // Display name
  const [displayName, setDisplayName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // Sync display name from profile on load
  useEffect(() => {
    if (user?.display_name) {
      setDisplayName(user.display_name);
    }
  }, [user?.display_name]);

  async function handleSaveDisplayName() {
    setNameSaving(true);
    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "Failed to update display name");
        return;
      }
      toast.success("Display name updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Avatar + identity */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 text-lg" size="lg">
              {user?.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.display_name ?? "Avatar"} />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(user?.display_name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {user?.display_name || user?.email || "Anonymous"}
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate text-sm text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <Badge variant="secondary" className="mt-1.5">
                {user?.isPro ? "Pro" : "Free"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display name */}
      <section>
        <h3 className="text-sm font-medium">Display name</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          This is how your name appears across QR DNA.
        </p>
        <div className="mt-3 flex gap-3">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="max-w-sm"
          />
          <Button
            onClick={handleSaveDisplayName}
            disabled={nameSaving}
            className="gap-2 shrink-0"
          >
            {nameSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </section>

      <Separator />

      {/* Email (read-only) */}
      <section>
        <h3 className="text-sm font-medium">Email address</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email is managed through your authentication provider.
        </p>
        <Input
          value={user?.email ?? ""}
          readOnly
          disabled
          className="mt-3 max-w-sm bg-muted"
        />
      </section>

      <Separator />

      {/* Password change */}
      <section>
        <h3 className="text-sm font-medium">Change password</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Update your password. You will remain signed in after the change.
        </p>
        <div className="mt-3 max-w-sm space-y-3">
          <div>
            <Label htmlFor="current-password">Current password</Label>
            <div className="relative mt-1">
              <Input
                id="current-password"
                type={showCurrentPw ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="new-password">New password</Label>
            <div className="relative mt-1">
              <Input
                id="new-password"
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <div className="relative mt-1">
              <Input
                id="confirm-password"
                type={showConfirmPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={passwordSaving || !newPassword || !confirmPassword}
            variant="outline"
            className="gap-2"
          >
            {passwordSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Update password
          </Button>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preferences Tab
// ---------------------------------------------------------------------------

const EXPORT_FORMATS = ["PNG", "SVG", "JPEG"] as const;
const EXPORT_SIZES = ["256", "512", "1024", "2048"] as const;

function PreferencesTab() {
  const [exportFormat, setExportFormat] = useState<string>("PNG");
  const [exportSize, setExportSize] = useState<string>("1024");

  // Load from localStorage on mount
  useEffect(() => {
    const savedFormat = localStorage.getItem("qrdna_export_format");
    if (savedFormat && EXPORT_FORMATS.includes(savedFormat as typeof EXPORT_FORMATS[number])) {
      setExportFormat(savedFormat);
    }
    const savedSize = localStorage.getItem("qrdna_export_size");
    if (savedSize && EXPORT_SIZES.includes(savedSize as typeof EXPORT_SIZES[number])) {
      setExportSize(savedSize);
    }
  }, []);

  function handleFormatChange(value: string) {
    setExportFormat(value);
    localStorage.setItem("qrdna_export_format", value);
    toast.success(`Default export format set to ${value}`);
  }

  function handleSizeChange(value: string) {
    setExportSize(value);
    localStorage.setItem("qrdna_export_size", value);
    toast.success(`Default export size set to ${value}px`);
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-medium">QR code export defaults</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the default format and size used when exporting QR codes. You can still override these per export.
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {/* Format */}
          <div>
            <Label htmlFor="export-format">Default export format</Label>
            <Select value={exportFormat} onValueChange={handleFormatChange}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_FORMATS.map((fmt) => (
                  <SelectItem key={fmt} value={fmt}>
                    {fmt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size */}
          <div>
            <Label htmlFor="export-size">Default export size</Label>
            <Select value={exportSize} onValueChange={handleSizeChange}>
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_SIZES.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size} x {size}px
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing Tab (preserved from original)
// ---------------------------------------------------------------------------

function BillingTab() {
  const { user } = useUser();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/v1/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-sm font-medium">Current plan</h3>
        <div className="mt-3 rounded-xl border p-6">
          {user?.isPro ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-semibold">QR DNA Pro</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have access to all Pro features.
                </p>
                <ul className="mt-3 space-y-1">
                  {[
                    "Unlimited dynamic QR codes",
                    "Unlimited business cards",
                    "Full analytics",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={openPortal}
                disabled={portalLoading}
                className="gap-2 shrink-0"
              >
                <CreditCard className="h-4 w-4" />
                {portalLoading ? "Loading..." : "Manage billing"}
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Free plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Unlimited static QR codes. Upgrade for dynamic QR, business cards, and analytics.
                </p>
              </div>
              <Button
                onClick={() => setUpgradeOpen(true)}
                className="shrink-0 gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </div>
      </section>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureName="Pro features"
      />

      {/* Admin access section */}
      <AdminAccessSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Access Section
// ---------------------------------------------------------------------------

function AdminAccessSection() {
  const { user } = useUser();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  async function activate() {
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "Activation failed");
        return;
      }
      toast.success("Admin access activated — reload to apply");
      setSecret("");
      window.location.reload();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function revoke() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/activate", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to revoke admin access");
        return;
      }
      toast.success("Admin access revoked");
      window.location.reload();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3 className="text-sm font-medium">Admin access</h3>
      <div className="mt-3 rounded-xl border p-6">
        {user?.isAdmin ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                <span className="font-semibold">Admin</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                You have admin access — all Pro features are unlocked.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={revoke}
              disabled={loading}
              className="shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Revoke"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the admin secret to unlock all Pro features.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Admin secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") activate();
                }}
                className="max-w-xs"
              />
              <Button
                onClick={activate}
                disabled={loading || !secret.trim()}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                Activate
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Privacy & Data Tab
// ---------------------------------------------------------------------------

function PrivacyTab() {
  return (
    <div className="space-y-8">
      {/* Export data */}
      <section>
        <h3 className="text-sm font-medium">Export my data</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Download a copy of all your QR codes, business cards, and analytics data.
        </p>
        <Button
          variant="outline"
          className="mt-3 gap-2"
          onClick={() => toast.info("Data export coming soon")}
        >
          <Download className="h-4 w-4" />
          Export my data
        </Button>
      </section>

      <Separator />

      {/* Delete account */}
      <section>
        <h3 className="text-sm font-medium text-destructive">Delete account</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-3 gap-2">
              <Trash2 className="h-4 w-4" />
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, all QR codes, business cards,
                analytics data, and projects. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  toast.info(
                    "Please contact support@qrdna.io to delete your account"
                  );
                }}
              >
                Yes, delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="h-10 w-64 animate-pulse rounded bg-muted" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { loading } = useUser();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to Pro! Your account has been upgraded.");
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="px-4 py-8 sm:px-8 max-w-2xl">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6">
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-8 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="account" className="mt-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="account" className="gap-1.5">
            <User className="h-4 w-4 hidden sm:inline-block" />
            Account
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <SlidersHorizontal className="h-4 w-4 hidden sm:inline-block" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-1.5">
            <CreditCard className="h-4 w-4 hidden sm:inline-block" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <Shield className="h-4 w-4 hidden sm:inline-block" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="account">
            <AccountTab />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesTab />
          </TabsContent>

          <TabsContent value="billing">
            <BillingTab />
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
