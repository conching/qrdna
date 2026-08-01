import { ArrowDown, Lock, Pencil } from "lucide-react";

/**
 * How a dynamic code resolves, drawn as the two hops it actually makes.
 * Values are illustrative; the short code is a real seven-character one.
 */
export function RedirectPanel() {
  return (
    <figure className="rounded-2xl border border-border bg-background p-4 sm:p-6">
      <ol>
        <li>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h3 className="text-balance font-body text-sm font-medium">
                What gets printed
              </h3>
              <p className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Lock className="size-3.5" aria-hidden="true" />
                fixed for the life of the code
              </p>
            </div>
            <p className="mt-2 font-mono text-sm break-all sm:text-base">
              qrdna.io/a7Xk2Qp
            </p>
          </div>
        </li>

        <li>
          <p className="flex items-center gap-2 py-3 pl-4 font-mono text-xs text-muted-foreground">
            <ArrowDown className="size-3.5" aria-hidden="true" />
            resolves to
          </p>
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <h3 className="text-balance font-body text-sm font-medium">
                Where it goes today
              </h3>
              <p className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <Pencil className="size-3.5" aria-hidden="true" />
                a field you can edit
              </p>
            </div>
            <p className="mt-2 font-mono text-sm break-all sm:text-base">
              yourdomain.com/menus/spring
            </p>
          </div>
        </li>
      </ol>

      <figcaption className="mt-5 text-sm text-muted-foreground">
        Every scan passes through the redirect, so every scan is counted:
        timestamp, device, operating system, browser, country and referrer.
      </figcaption>
    </figure>
  );
}
