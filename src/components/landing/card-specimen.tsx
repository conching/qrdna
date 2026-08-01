import { DEFAULT_THEME } from "@/lib/cards/types";

const { bgColor, textColor, primaryColor, accentColor } = DEFAULT_THEME;

/**
 * A miniature of a hosted card page, drawn with the product's own default card
 * theme. Decorative: the controls are not real, so the whole mock is hidden
 * from assistive technology and the facts live in the caption and the prose
 * beside it.
 */
export function CardSpecimen() {
  return (
    <figure>
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-[19rem] rounded-2xl border border-border p-6 text-center shadow-sm"
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <span
          className="mx-auto flex size-16 items-center justify-center rounded-full font-sans text-xl font-bold"
          style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
        >
          JE
        </span>
        <p className="mt-4 font-sans text-lg font-bold tracking-[-0.02em]">
          Jordan Ellis
        </p>
        <p className="mt-1 text-sm" style={{ color: `${textColor}B3` }}>
          Studio director, Ellis &amp; Co
        </p>

        <span
          className="mt-5 flex h-10 items-center justify-center rounded-lg text-sm font-medium"
          style={{ backgroundColor: primaryColor, color: "#FFFFFF" }}
        >
          Save to contacts
        </span>
        <span
          className="mt-2 flex h-10 items-center justify-center rounded-lg border text-sm font-medium"
          style={{ borderColor: `${textColor}33`, color: textColor }}
        >
          Call
        </span>

        <span className="mt-5 flex items-center justify-center gap-2">
          {[primaryColor, accentColor, `${textColor}59`].map((c) => (
            <span
              key={c}
              className="block size-2 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
        </span>
      </div>

      <figcaption className="mt-4 text-center font-mono text-xs text-muted-foreground">
        example: qrdna.io/card/jordan-ellis
      </figcaption>
    </figure>
  );
}
