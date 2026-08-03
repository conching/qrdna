import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about QR DNA: static vs dynamic codes, export formats, logos and scannability, analytics, and digital business cards.",
};

const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const H1 =
  "text-balance font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.03em]";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

interface FAQGroup {
  title: string;
  items: FAQItem[];
}

const A = "leading-relaxed text-muted-foreground";
const LINK = "text-foreground underline underline-offset-4 hover:no-underline";

const GROUPS: FAQGroup[] = [
  {
    title: "The basics",
    items: [
      {
        question: "What is QR DNA?",
        answer: (
          <p className={A}>
            QR DNA is a QR code generator and digital business card platform.
            You can create styled, correctly encoded QR codes in the browser,
            download them as vector or raster files, and optionally create
            dynamic codes whose destination you can change after printing —
            with scan analytics to see how they perform.
          </p>
        ),
      },
      {
        question: "Is QR DNA free?",
        answer: (
          <p className={A}>
            Yes. Every feature is free while QR DNA is in early access. Paid
            plans may be introduced later, but codes you generate and download
            are yours to keep either way.
          </p>
        ),
      },
      {
        question: "Do I need an account?",
        answer: (
          <p className={A}>
            No. You can{" "}
            <Link href="/create" className={LINK}>
              generate and download static QR codes
            </Link>{" "}
            without signing up. An account is needed for the features that
            require us to store something for you: dynamic codes, saved codes
            and projects, analytics, and digital business cards.
          </p>
        ),
      },
      {
        question: "What can a QR code contain?",
        answer: (
          <p className={A}>
            Ten content types: URL, plain text, email, phone number, SMS,
            Wi-Fi credentials, vCard contact, location, calendar event, and
            App Store links. Each payload is written the way its own
            specification expects, so a Wi-Fi code actually joins the network
            and a vCard saves cleanly to contacts.
          </p>
        ),
      },
    ],
  },
  {
    title: "Printing, styling and scannability",
    items: [
      {
        question: "Do my QR codes expire?",
        answer: (
          <p className={A}>
            Static codes never expire. The destination is encoded directly in
            the pattern, so the printed code keeps working forever — it
            doesn&apos;t depend on QR DNA existing. Dynamic codes route
            through a qrdna.io short link, so they work for as long as the
            service hosts the redirect.
          </p>
        ),
      },
      {
        question: "What file formats can I export?",
        answer: (
          <p className={A}>
            Five formats: SVG and PDF are vector — they open in Figma,
            Illustrator and InDesign and scale to any size without blurring.
            PNG, JPEG and WebP are raster, exported at whatever pixel size you
            choose. For anything going to print, use SVG or PDF.
          </p>
        ),
      },
      {
        question: "Can I add a logo or change the colors? Will it still scan?",
        answer: (
          <p className={A}>
            Yes. You can style the modules, corners and colors and drop a logo
            into the center. QR codes carry built-in error correction, which
            is what lets scanners reconstruct the data hidden behind a logo.
            Two habits keep styled codes reliable: keep strong contrast
            between the code and its background, and test-scan with a phone
            before printing a large run.
          </p>
        ),
      },
      {
        question: "How large should a printed QR code be?",
        answer: (
          <p className={A}>
            A common rule of thumb is scan distance ÷ 10. A code scanned from
            about 30 cm away — a flyer or business card — should be at least
            3 cm wide. For posters and signage viewed from farther away, scale
            up accordingly, and always do a test scan at real size.
          </p>
        ),
      },
    ],
  },
  {
    title: "Dynamic codes and analytics",
    items: [
      {
        question: "What's the difference between static and dynamic codes?",
        answer: (
          <p className={A}>
            A static code encodes your content directly in the pattern — it
            works forever, needs no account, and can never be changed. A
            dynamic code encodes a short qrdna.io link that redirects to your
            destination, which means you can change where it points after
            it&apos;s printed, and every scan can be counted.
          </p>
        ),
      },
      {
        question: "Can I change where a code points after it's printed?",
        answer: (
          <p className={A}>
            Yes — if it&apos;s a dynamic code. Edit the destination in your
            dashboard and every existing print of the code follows the new
            destination immediately. Static codes cannot be re-pointed, so if
            you expect the destination to change, make the code dynamic before
            you print.
          </p>
        ),
      },
      {
        question: "What analytics do I get?",
        answer: (
          <p className={A}>
            For dynamic codes: scans over time, unique versus repeat scans,
            device type, operating system and browser, approximate location
            (country, region and city), and referrer. Digital business cards
            get view analytics on the same model. Everything can be exported
            as CSV. See the{" "}
            <Link href="/privacy" className={LINK}>
              privacy policy
            </Link>{" "}
            for exactly what a scan records.
          </p>
        ),
      },
    ],
  },
  {
    title: "Digital business cards",
    items: [
      {
        question: "What is a digital business card?",
        answer: (
          <p className={A}>
            A hosted personal page with your name, role, contact details,
            links and photo, reachable by QR code or link. Visitors can save
            your details straight to their phone&apos;s contacts with one tap.
            Four layouts are available, and the card can be updated any time
            without reprinting anything.
          </p>
        ),
      },
      {
        question:
          "Why does the card QR point to a page instead of embedding my details?",
        answer: (
          <p className={A}>
            Capacity. A vCard with a photo is far more data than a scannable
            QR code can hold — codes get denser and harder to scan as the
            payload grows. Pointing the code at a hosted card keeps the
            pattern simple enough to scan from across a table, and the
            contact file visitors download can include your photo and always
            reflects your latest details.
          </p>
        ),
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className={`${SHELL} py-12 sm:py-20`}>
      <header className="max-w-[46ch]">
        <h1 className={H1}>Frequently asked questions</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          Short answers to the questions that come up most. Something not
          covered here? Email{" "}
          <a href="mailto:chase@chase.is" className={LINK}>
            chase@chase.is
          </a>
          .
        </p>
      </header>

      <div className="mt-12 space-y-14 sm:mt-16">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
              {group.title}
            </h2>
            <dl className="mt-6 grid gap-x-14 gap-y-10 lg:grid-cols-2">
              {group.items.map((item) => (
                <div key={item.question} className="max-w-[65ch]">
                  <dt className="font-sans text-lg font-semibold tracking-[-0.01em]">
                    {item.question}
                  </dt>
                  <dd className="mt-2">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
