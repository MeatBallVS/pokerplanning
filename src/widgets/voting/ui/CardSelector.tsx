import { isGarageDeck } from "@/shared/config/deckPresentation";
import { DeckCard } from "@/shared/ui/DeckCard/DeckCard";

interface Props {
  cards: string[];
  deckCode?: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  selectedValue?: string | null;
}

export const CardSelector = ({
  cards,
  deckCode,
  disabled,
  onSelect,
  selectedValue,
}: Props) => {
  const garageDeck = isGarageDeck(deckCode);

  return (
    <div
      className={[
        "grid gap-3",
        garageDeck
          ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          : "grid-cols-2 sm:grid-cols-3",
      ].join(" ")}
    >
      {cards.map((card) => (
        <DeckCard
          card={card}
          deckCode={deckCode}
          disabled={disabled}
          key={card}
          onSelect={onSelect}
          selected={selectedValue === card}
          size="selector"
        />
      ))}
    </div>
  );
};
