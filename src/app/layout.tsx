import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { MotionProvider } from "@/components/motion/motion-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QR DNA — QR Codes & Digital Business Cards",
    template: "%s | QR DNA",
  },
  description:
    "Create styled QR codes and digital business cards in seconds. Free, fast, and beautiful.",
  keywords: [
    "QR code generator",
    "digital business card",
    "QR code styling",
    "vCard",
    "NFC business card",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
