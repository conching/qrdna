"use client";

import { useQREditorStore } from "@/stores/qr-editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function VCardForm() {
  const { inputData, setInputData } = useQREditorStore();

  const field = (key: string) => (inputData[key] as string) ?? "";

  return (
    <div className="space-y-6">
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

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium leading-none">Contact</legend>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={field("phone")}
              onChange={(e) => setInputData({ phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={field("email")}
              onChange={(e) => setInputData({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              placeholder="https://example.com"
              value={field("website")}
              onChange={(e) => setInputData({ website: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

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
