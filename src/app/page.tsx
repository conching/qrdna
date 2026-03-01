import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { QrCode, ArrowRight, Zap, Palette, CreditCard } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-primary" />
          <Logo size="md" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Free forever for static QR codes
          </div>
          <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            QR codes that look{" "}
            <span className="text-primary">as good</span> as your brand
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Generate styled QR codes and digital business cards in seconds.
            No account needed for static codes.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href="/create">
                Create QR Code
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-4xl gap-8 sm:grid-cols-3">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold">
              Lightning Fast
            </h3>
            <p className="text-sm text-muted-foreground">
              Generate a styled QR code in under 30 seconds. Live preview
              updates as you type.
            </p>
          </div>
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold">
              Fully Customizable
            </h3>
            <p className="text-sm text-muted-foreground">
              Custom colors, dot styles, gradients, logo embedding, and
              pre-built templates.
            </p>
          </div>
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-sans text-lg font-semibold">
              Digital Business Cards
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a beautiful hosted card page with one tap. Share via
              QR code or NFC.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        QR DNA &mdash; QR codes and digital business cards.
      </footer>
    </div>
  );
}
