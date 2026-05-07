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
  preview: "text-2xl",
  selector: "text-3xl",
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
    "flex h-full w-full flex-col justify-between border bg-white text-left text-slate-950 transition",
    {
      "border-indigo-400 bg-indigo-50 shadow-[0_18px_45px_rgba(79,70,229,0.18)]": selected,
      "cursor-not-allowed opacity-55": disabled,
      "cursor-pointer hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-slate-50":
        interactive && !disabled,
    },
    [defaultSizeClasses[size], selected ? "" : "border-slate-200 shadow-sm"],
  );

  const defaultContent = (
    <>
      {presentation.eyebrow && (
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {presentation.eyebrow}
        </div>
      )}

      <div className="mt-3 flex-1 rounded-[20px] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] px-3 py-4 shadow-inner">
        <div
          className={classNames(
            "font-semibold tracking-tight text-slate-950",
            {},
            [defaultValueClasses[size]],
          )}
        >
          {presentation.displayValue}
        </div>
        {presentation.title && (
          <div className="mt-2 text-xs leading-5 text-slate-500">{presentation.title}</div>
        )}
      </div>
    </>
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
