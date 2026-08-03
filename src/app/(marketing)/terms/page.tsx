import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of QR DNA — accounts, your content, acceptable use, dynamic code redirects, and disclaimers.",
};

const SHELL = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const H1 =
  "text-balance font-sans text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-bold tracking-[-0.03em]";

const H2 = "font-sans text-xl font-semibold tracking-[-0.01em]";

const P = "mt-3 leading-relaxed text-muted-foreground";

const UL =
  "mt-3 list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground marker:text-border";

const LINK = "text-foreground underline underline-offset-4 hover:no-underline";

const EFFECTIVE_DATE = "August 3, 2026";

export default function TermsPage() {
  return (
    <div className={`${SHELL} py-12 sm:py-20`}>
      <header className="max-w-[46ch]">
        <h1 className={H1}>Terms of Use</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Effective {EFFECTIVE_DATE}
        </p>
      </header>

      <div className="mt-12 max-w-[70ch] space-y-10 sm:mt-16">
        <section>
          <h2 className={H2}>1. Agreement to these terms</h2>
          <p className={P}>
            QR DNA (&ldquo;the Service&rdquo;) is operated by Chase Conching
            (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By using the Service — at
            qrdna.io or any related domain — you agree to these terms. If you
            don&apos;t agree with them, don&apos;t use the Service.
          </p>
        </section>

        <section>
          <h2 className={H2}>2. The Service</h2>
          <p className={P}>
            QR DNA lets you generate QR codes, create dynamic codes whose
            destination can be changed after printing, view scan analytics,
            and publish digital business cards. During early access, every
            feature is free. We may introduce paid plans in the future; if we
            do, we&apos;ll say clearly what is paid and what stays free before
            anything changes for you.
          </p>
          <p className={P}>
            The Service is under active development. Features may change, be
            added, or be removed as it evolves.
          </p>
        </section>

        <section>
          <h2 className={H2}>3. Your account</h2>
          <p className={P}>
            Some features require an account. You&apos;re responsible for the
            activity that happens under your account and for keeping your
            credentials secure. You must provide a valid email address, and
            you must be at least 13 years old to create an account.
          </p>
        </section>

        <section>
          <h2 className={H2}>4. Your content</h2>
          <p className={P}>
            You keep all rights to the content you create with the Service —
            the QR codes you generate, the destinations you configure, and the
            information you put on a digital business card. QR codes you
            download are yours to use anywhere, commercially or otherwise,
            with no attribution required.
          </p>
          <p className={P}>
            To operate the Service, you grant us permission to store your
            content and to serve it publicly where that is the point of the
            feature — a business card page and its contact download are
            visible to anyone who has the link, and a dynamic code&apos;s
            redirect is followed by anyone who scans it.
          </p>
        </section>

        <section>
          <h2 className={H2}>5. Acceptable use</h2>
          <p className={P}>You may not use the Service to:</p>
          <ul className={UL}>
            <li>
              direct people to phishing pages, malware, scams, or other
              deceptive or harmful destinations;
            </li>
            <li>
              impersonate another person or organization, including on a
              digital business card;
            </li>
            <li>
              distribute content that is illegal, infringes someone
              else&apos;s rights, or sexually exploits minors;
            </li>
            <li>send spam or facilitate unsolicited bulk messaging;</li>
            <li>
              probe, overload, or disrupt the Service, or access other
              users&apos; data without authorization.
            </li>
          </ul>
          <p className={P}>
            We may disable codes, cards, or accounts that violate these rules.
            Where a dynamic code&apos;s destination becomes harmful after the
            fact — for example, a linked site is later compromised — we may
            suspend the redirect until it&apos;s resolved.
          </p>
        </section>

        <section>
          <h2 className={H2}>6. Dynamic codes and redirects</h2>
          <p className={P}>
            Dynamic codes depend on our redirect service to reach their
            destination. We work to keep redirects fast and available, but we
            can&apos;t guarantee uninterrupted operation. Static codes encode
            their content directly and don&apos;t depend on the Service at
            all. If you&apos;re printing something critical and permanent,
            consider whether a static code fits your use.
          </p>
        </section>

        <section>
          <h2 className={H2}>7. Our property</h2>
          <p className={P}>
            The Service itself — its software, design, and branding — belongs
            to us. These terms don&apos;t grant you any right to use the QR
            DNA name or branding.
          </p>
        </section>

        <section>
          <h2 className={H2}>8. Termination</h2>
          <p className={P}>
            You can stop using the Service and delete your account at any
            time. We may suspend or terminate accounts that violate these
            terms. If your account is deleted, dynamic codes and business
            cards tied to it stop working; static codes you&apos;ve already
            downloaded are unaffected.
          </p>
        </section>

        <section>
          <h2 className={H2}>9. Disclaimers</h2>
          <p className={P}>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available,&rdquo; without warranties of any kind, express or
            implied. We don&apos;t warrant that the Service will be
            uninterrupted, error-free, or that any particular scanner app will
            read any particular code — always test-scan before a print run.
          </p>
        </section>

        <section>
          <h2 className={H2}>10. Limitation of liability</h2>
          <p className={P}>
            To the maximum extent permitted by law, we are not liable for
            indirect, incidental, special, or consequential damages arising
            from your use of the Service — including lost profits, lost data,
            or the cost of reprinting materials. Our total liability for any
            claim relating to the Service is limited to the amount you paid us
            in the twelve months before the claim, which during free early
            access is zero.
          </p>
        </section>

        <section>
          <h2 className={H2}>11. Changes to these terms</h2>
          <p className={P}>
            We may update these terms as the Service evolves. When we do,
            we&apos;ll update the effective date above, and for material
            changes we&apos;ll make reasonable efforts to notify account
            holders. Continuing to use the Service after a change takes effect
            means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className={H2}>12. Governing law</h2>
          <p className={P}>
            These terms are governed by the laws of the State of Hawai&lsquo;i,
            United States, without regard to conflict-of-law rules.
          </p>
        </section>

        <section>
          <h2 className={H2}>13. Contact</h2>
          <p className={P}>
            Questions about these terms:{" "}
            <a href="mailto:chase@chase.is" className={LINK}>
              chase@chase.is
            </a>
            . For how we handle data, see the{" "}
            <Link href="/privacy" className={LINK}>
              privacy policy
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
