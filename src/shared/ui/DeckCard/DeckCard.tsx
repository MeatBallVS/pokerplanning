import { garageDeckImages } from "@/shared/assets/garage-deck";
import { getDeckCardPresentation } from "@/shared/config/deckPresentation";
import { classNames } from "@/shared/lib/classNames";

type DeckCardSize = "compact" | "preview" | "selector";

interface DeckCardProps {
  card: string;
  deckCode?: string | null;
  disabled?: boolean;
  onSelect?: (value: string) => void;
  selected?: boolean;
  size?: DeckCardSize;
}

const defaultSizeClasses: Record<DeckCardSize, string> = {
  compact: "aspect-[3/4] rounded-[22px] p-3",
  preview: "aspect-[3/4] rounded-[24px] p-3.5",
  selector: "aspect-[3/4] rounded-[26px] p-4",
};

const garageSizeClasses: Record<DeckCardSize, string> = {
  compact: "aspect-[1/2] rounded-[24px] p-2.5",
  preview: "aspect-[1/2] rounded-[26px] p-3",
  selector: "aspect-[1/2] rounded-[28px] p-3 sm:p-3.5",
};

const defaultValueClasses: Record<DeckCardSize, string> = {
  compact: "text-base",
  preview: "text-xl",
  selector: "text-2xl",
};

const buildAriaLabel = (value: string, title?: string, eyebrow?: string) =>
  [value, title?.replaceAll("\n", " "), eyebrow?.replaceAll("\n", " ")]
    .filter(Boolean)
    .join(" ");

export const DeckCard = ({
  card,
  deckCode,
  disabled = false,
  onSelect,
  selected = false,
  size = "selector",
}: DeckCardProps) => {
  const presentation = getDeckCardPresentation(deckCode, card);
  const interactive = Boolean(onSelect);
  const ariaLabel = buildAriaLabel(
    presentation.displayValue,
    presentation.title,
    presentation.eyebrow,
  );

  const handleClick = () => {
    if (!disabled) {
      onSelect?.(card);
    }
  };

  if (presentation.variant === "garage") {
    const garageImage = garageDeckImages[card];
    const garageClassName = classNames(
      "group relative isolate block h-full w-full overflow-hidden border bg-[#020202] text-left text-white transition duration-200",
      {
        "-translate-y-0.5 border-indigo-500 shadow-[0_22px_60px_rgba(79,70,229,0.28)] ring-2 ring-indigo-500/75 ring-offset-2 ring-offset-[var(--color-bg)]":
          selected,
        "cursor-not-allowed": disabled,
        "cursor-pointer hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[0_20px_48px_rgba(15,23,42,0.28)]":
          interactive && !disabled,
      },
      [
        garageSizeClasses[size],
        selected ? "" : "border-black/70 shadow-[0_18px_42px_rgba(15,23,42,0.18)]",
      ],
    );

    const content = garageImage ? (
      <>
        <img
          alt=""
          className="h-full w-full scale-[1.045] rounded-[inherit] object-cover object-center select-none"
          draggable={false}
          loading="lazy"
          src={garageImage}
          style={{ objectPosition: "center 58%" }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-black/45" />
        {disabled && <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-black/8" />}
      </>
    ) : (
      <div className="flex h-full items-center justify-center rounded-[inherit] bg-black text-center text-sm font-semibold text-white">
        {presentation.displayValue}
      </div>
    );

    if (interactive) {
      return (
        <button
          aria-label={ariaLabel}
          className={garageClassName}
          disabled={disabled}
          onClick={handleClick}
          type="button"
        >
          {content}
        </button>
      );
    }

    return (
      <div aria-label={ariaLabel} className={garageClassName} role="img">
        {content}
      </div>
    );
  }

  const defaultClassName = classNames(
    "flex h-full w-full flex-col items-center justify-center overflow-hidden border bg-white/6 text-center text-white transition",
    {
      "border-[var(--color-primary)] bg-[var(--color-primary)]/15 shadow-[0_18px_45px_rgba(216,255,115,0.16)] ring-1 ring-[var(--color-primary)]/70":
        selected,
      "cursor-not-allowed opacity-55": disabled,
      "cursor-pointer hover:-translate-y-0.5 hover:border-[var(--color-primary)]/50 hover:bg-white/10":
        interactive && !disabled,
    },
    [defaultSizeClasses[size], selected ? "" : "border-slate-200 shadow-sm"],
  );

  const defaultContent =
    size === "preview" ? (
      <div className="flex h-full w-full min-w-0 items-center justify-center rounded-[18px] border border-white/10 bg-black/18 px-2 py-2 shadow-inner shadow-black/25">
        <span
          className={classNames(
            "block max-w-full truncate font-semibold leading-none tracking-normal text-white",
            {},
            [defaultValueClasses[size]],
          )}
        >
          {presentation.displayValue}
        </span>
      </div>
    ) : (
      <div className="flex h-full w-full min-w-0 flex-col items-center justify-center overflow-hidden rounded-[20px] border border-white/10 bg-black/18 px-3 py-4 text-center shadow-inner shadow-black/25">
      {presentation.eyebrow && (
        <div className="line-clamp-1 max-w-full text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {presentation.eyebrow}
        </div>
      )}

        <div
          className={classNames(
            "mt-2 max-w-full break-words font-semibold leading-none tracking-normal text-white",
            {},
            [defaultValueClasses[size]],
          )}
        >
          {presentation.displayValue}
        </div>
        {presentation.title && (
          <div className="line-clamp-2 mt-2 break-words text-xs leading-5 text-[var(--color-text-soft)]">
            {presentation.title}
          </div>
        )}
      </div>
    );

  if (interactive) {
    return (
      <button
        aria-label={ariaLabel}
        className={defaultClassName}
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        {defaultContent}
      </button>
    );
  }

  return (
    <div aria-label={ariaLabel} className={defaultClassName} role="img">
      {defaultContent}
    </div>
  );
};
