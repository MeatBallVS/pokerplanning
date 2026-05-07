export const GARAGE_DECK_CODE = "garage";

export interface DeckCardPresentation {
  accentClassName?: string;
  artClassName?: string;
  artKind?: string;
  displayValue: string;
  eyebrow?: string;
  title?: string;
  variant: "default" | "garage";
}

const sharedCards: Record<string, DeckCardPresentation> = {
  break: {
    displayValue: "Перерыв",
    eyebrow: "Пауза",
    title: "Небольшой брейк",
    variant: "default",
  },
};

const garageDeckCards: Record<string, Omit<DeckCardPresentation, "variant">> = {
  "1": {
    accentClassName: "from-emerald-400 via-lime-300 to-emerald-200",
    artClassName: "from-emerald-500/20 via-lime-400/15 to-transparent text-lime-200",
    artKind: "sprout-stick",
    displayValue: "1",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ИЗ ГОВНА\nИ ПАЛОК",
  },
  "2": {
    accentClassName: "from-sky-400 via-cyan-300 to-sky-200",
    artClassName: "from-sky-500/20 via-cyan-400/15 to-transparent text-cyan-100",
    artKind: "can-fire",
    displayValue: "2",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ОЧУМЕЛЫЕ\nРУЧКИ",
  },
  "3": {
    accentClassName: "from-amber-400 via-orange-300 to-yellow-200",
    artClassName: "from-orange-500/20 via-amber-400/15 to-transparent text-amber-100",
    artKind: "glue-battery",
    displayValue: "3",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ТЕРМОКЛЕЙ\nИ КРОНА",
  },
  "4": {
    accentClassName: "from-yellow-400 via-amber-300 to-orange-200",
    artClassName: "from-amber-500/20 via-yellow-400/15 to-transparent text-amber-100",
    artKind: "cart-bottles",
    displayValue: "4",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ПРИДЕТСЯ\nСДАТЬ ТАРУ",
  },
  "5": {
    accentClassName: "from-slate-300 via-blue-300 to-slate-100",
    artClassName: "from-slate-400/20 via-blue-400/15 to-transparent text-slate-100",
    artKind: "vacuum",
    displayValue: "5",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "БОГАТАЯ\nПОМОЙКА",
  },
  "6": {
    accentClassName: "from-orange-400 via-amber-300 to-zinc-100",
    artClassName: "from-orange-500/20 via-amber-500/15 to-transparent text-amber-100",
    artKind: "tools",
    displayValue: "6",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ГАРАЖ\nМАСТЕР",
  },
  "7": {
    accentClassName: "from-emerald-400 via-green-300 to-lime-100",
    artClassName: "from-emerald-500/20 via-green-400/15 to-transparent text-lime-100",
    artKind: "machine-shop",
    displayValue: "7",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "СВОЯ\nМАСТЕРСКАЯ",
  },
  "8": {
    accentClassName: "from-rose-400 via-pink-300 to-orange-100",
    artClassName: "from-pink-500/20 via-rose-400/15 to-transparent text-rose-100",
    artKind: "handshake",
    displayValue: "8",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ПОМОЩЬ\nДРУГА",
  },
  "9": {
    accentClassName: "from-violet-400 via-indigo-300 to-sky-200",
    artClassName: "from-violet-500/20 via-indigo-400/15 to-transparent text-violet-100",
    artKind: "laser-machine",
    displayValue: "9",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "СПЕЦ\nОБОРУДОВАНИЕ",
  },
  "10": {
    accentClassName: "from-red-500 via-orange-400 to-amber-200",
    artClassName: "from-red-500/20 via-orange-400/15 to-transparent text-orange-100",
    artKind: "engine",
    displayValue: "10",
    eyebrow: "УРОВЕНЬ\nСЛОЖНОСТИ",
    title: "ЧЕЛОВЕК-\nЦЕХ",
  },
};

export const isGarageDeck = (deckCode?: string | null) => deckCode === GARAGE_DECK_CODE;

export const getDeckCardPresentation = (
  deckCode: string | null | undefined,
  value: string,
): DeckCardPresentation => {
  if (isGarageDeck(deckCode) && garageDeckCards[value]) {
    return {
      ...garageDeckCards[value],
      variant: "garage",
    };
  }

  if (sharedCards[value]) {
    return sharedCards[value];
  }

  return {
    displayValue: value,
    variant: "default",
  };
};
