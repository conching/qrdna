import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What QR DNA collects, why, and what happens when someone scans a code — including exactly what a scan event records.",
};

const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const H1 =
  "text-balance font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.03em]";

const H2 = "font-sans text-xl font-semibold tracking-[-0.01em]";

const H3 = "mt-5 font-sans font-semibold";

const P = "mt-3 leading-relaxed text-muted-foreground";

const UL =
  "mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-border";

const LINK = "text-foreground underline underline-offset-4 hover:no-underline";

const EFFECTIVE_DATE = "August 3, 2026";

export default function PrivacyPage() {
  return (
    <div className={`${SHELL} py-12 sm:py-20`}>
      <header className="max-w-[46ch]">
        <h1 className={H1}>Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Effective {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="mt-12 max-w-[70ch] space-y-10 sm:mt-16">
        <section>
          <h2 className={H2}>1. Who we are</h2>
          <p className={P}>
            QR DNA (qrdna.io) is operated by Chase Conching. This policy
            explains what we collect, why, and what your options are. It
            covers two kinds of people: users who create codes and cards with
            an account, and people who scan a code or view a business card
            that a user published. Both are covered below, because the Service
            collects different things from each.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. What we collect from account holders</h2>

          <h3 className={H3}>Account information</h3>
          <p className={P}>
            Your email address and login credentials, managed through our
            authentication provider, Supabase. Passwords are stored hashed —
            we never see them in plain text.
          </p>

          <h3 className={H3}>Content you create</h3>
          <p className={P}>
            The QR codes you save, their styling, the destinations you
            configure, your projects, and anything you put on a digital
            business card — name, role, contact details, links, and photo.
            Note that business card pages are public by design: anyone with
            the link or the code can view the card and download the contact
            file.
          </p>

          <h3 className={H3}>Generating without an account</h3>
          <p className={P}>
            Static codes are generated in your browser. If you use the
            generator without signing in, the content of your code isn&apos;t
            saved on our servers.
          </p>
        </section>

        <section>
          <h2 className={H2}>3. What we collect when someone scans a code</h2>
          <p className={P}>
            When someone scans a dynamic code (or views a business card), we
            record a scan event so the code&apos;s owner can see how their
            code performs. A scan event contains:
          </p>
          <ul className={UL}>
            <li>date and time of the scan;</li>
            <li>IP address;</li>
            <li>
              approximate location — country, region, and city — derived from
              the IP address by our hosting provider (never GPS; the scanning
              device&apos;s precise location is not accessed);
            </li>
            <li>
              device type, operating system, and browser, derived from the
              browser&apos;s user-agent string;
            </li>
            <li>the referring page, when the browser provides one.</li>
          </ul>
          <p className={P}>
            Scan events are not linked to any account or identity of the
            person scanning — we don&apos;t know who scanned, only that a scan
            happened and roughly where and on what kind of device. Static
            codes never touch our servers when scanned, so scanning one sends
            us nothing.
          </p>
        </section>

        <section>
          <h2 className={H2}>4. How we use this information</h2>
          <ul className={UL}>
            <li>to operate the Service: accounts, redirects, hosted cards;</li>
            <li>
              to show code owners their analytics — scan counts, trends,
              device and location breakdowns;
            </li>
            <li>to prevent abuse of the redirect service;</li>
            <li>
              to communicate with you about your account or material changes
              to the Service.
            </li>
          </ul>
          <p className={P}>
            We do not sell personal information, we don&apos;t run advertising
            or advertising trackers, and we don&apos;t use your content or
            scan data for marketing profiles.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. Cookies and local storage</h2>
          <p className={P}>
            We use cookies only to keep you signed in (authentication session
            cookies set by Supabase). Your theme preference (light or dark) is
            kept in your browser&apos;s local storage. There are no
            third-party advertising or analytics cookies.
          </p>
        </section>

        <section>
          <h2 className={H2}>6. Who we share data with</h2>
          <p className={P}>
            We share data only with the infrastructure providers that run the
            Service, and only to the extent needed to run it:
          </p>
          <ul className={UL}>
            <li>
              <span className="text-foreground">Supabase</span> — database and
              authentication; stores account data, content, and scan events;
            </li>
            <li>
              <span className="text-foreground">Vercel</span> — application
              hosting and content delivery; processes requests (including
              scans) and derives the approximate location used in analytics;
            </li>
            <li>
              <span className="text-foreground">Stripe</span> — payment
              processing, if and when paid plans are offered. Card details
              would go directly to Stripe and never touch our servers. While
              the Service is free, no payment data is collected at all.
            </li>
          </ul>
          <p className={P}>
            Beyond that, we disclose data only if required by law, or to
            protect the Service and its users from abuse.
          </p>
        </section>

        <section>
          <h2 className={H2}>7. Retention</h2>
          <p className={P}>
            Account data and content are kept for as long as your account
            exists. Scan events are kept so long as the code they belong to
            exists, to power its analytics history. Deleting a code deletes
            its scan events; deleting your account deletes your codes, cards,
            and their analytics.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Your rights</h2>
          <p className={P}>
            You can access and edit your content and account details from the
            dashboard and settings at any time. You can also ask us to
            export, correct, or delete the personal data we hold about you —
            email{" "}
            <a href="mailto:chase@chase.is" className={LINK}>
              chase@chase.is
            </a>{" "}
            and we&apos;ll respond within 30 days. If you scanned
            someone&apos;s code and have questions about a scan event, the
            same address works; include roughly when and where the scan
            happened so we can locate it.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. Security</h2>
          <p className={P}>
            Data is encrypted in transit (TLS) and at rest by our providers.
            Access to production data is limited to the operator. Database
            access is governed by row-level security, so one account&apos;s
            data isn&apos;t readable by another&apos;s. No system is perfectly
            secure, but if a breach affects your personal data we&apos;ll
            notify you as required by law.
          </p>
        </section>

        <section>
          <h2 className={H2}>10. Children</h2>
          <p className={P}>
            The Service isn&apos;t directed at children under 13, and we
            don&apos;t knowingly collect personal information from them. If
            you believe a child has created an account, contact us and
            we&apos;ll delete it.
          </p>
        </section>

        <section>
          <h2 className={H2}>11. Changes to this policy</h2>
          <p className={P}>
            If this policy changes, we&apos;ll update the effective date
            above, and for material changes we&apos;ll make reasonable
            efforts to notify account holders by email before the change
            takes effect.
          </p>
        </section>

        <section>
          <h2 className={H2}>12. Contact</h2>
          <p className={P}>
            Privacy questions:{" "}
            <a href="mailto:chase@chase.is" className={LINK}>
              chase@chase.is
            </a>
            . For the rules that govern using the Service, see the{" "}
            <Link href="/terms" className={LINK}>
              terms of use
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
