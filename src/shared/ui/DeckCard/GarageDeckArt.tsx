import type { JSX } from "react";

type GarageDeckArtKind =
  | "sprout-stick"
  | "can-fire"
  | "glue-battery"
  | "cart-bottles"
  | "vacuum"
  | "tools"
  | "machine-shop"
  | "handshake"
  | "laser-machine"
  | "engine";

interface GarageDeckArtProps {
  kind: string;
}

const artClassName = "h-full w-full";

const SproutStickArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <ellipse cx="43" cy="72" fill="#8b5a2b" rx="28" ry="12" />
    <ellipse cx="43" cy="60" fill="#9a6331" rx="24" ry="10" />
    <ellipse cx="43" cy="50" fill="#a96d36" rx="18" ry="9" />
    <path d="M48 32L58 68" stroke="#b9783a" strokeLinecap="round" strokeWidth="10" />
    <path d="M42 36c-12-3-18 5-14 11 8 1 13-2 17-8" fill="#62c26f" />
    <path d="M58 38c11 1 15 9 10 14-7-1-11-5-13-11" fill="#7ddf72" />
    <circle cx="49" cy="28" fill="#67c96f" r="4" />
    <path d="M45 26l4 3" stroke="#7f4e21" strokeLinecap="round" strokeWidth="2" />
  </svg>
);

const CanFireArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <ellipse cx="45" cy="63" fill="#171717" opacity="0.75" rx="28" ry="8" />
    <path d="M26 58h38l-4 17H30z" fill="#7b7b7b" />
    <ellipse cx="45" cy="57" fill="#8d8d8d" rx="19" ry="6" />
    <ellipse cx="45" cy="41" fill="#8d8d8d" rx="19" ry="6" />
    <rect fill="#8d8d8d" height="16" width="38" x="26" y="41" />
    <path d="M64 44c8 0 12 5 12 10" fill="none" stroke="#9c9c9c" strokeLinecap="round" strokeWidth="4" />
    <path d="M50 28l7 28" stroke="#bfbfbf" strokeLinecap="round" strokeWidth="5" />
    <path d="M34 74c4-10 8-10 12 0-5-2-8-2-12 0z" fill="#2da0ff" />
    <path d="M43 74c4-13 8-13 12 0-5-3-8-3-12 0z" fill="#4db7ff" />
    <path d="M52 74c4-10 8-10 12 0-5-2-8-2-12 0z" fill="#2da0ff" />
  </svg>
);

const GlueBatteryArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <path d="M33 28h22l10 9v12H53l-7 8H36c-5 0-8-3-8-8V36c0-5 3-8 5-8z" fill="#2d3239" />
    <rect fill="#161b22" height="16" rx="4" width="17" x="53" y="29" />
    <rect fill="#f97316" height="8" rx="2" width="9" x="57" y="33" />
    <path d="M64 42l10-2-4 5" fill="#f5f5f5" />
    <path d="M43 50l8 18" stroke="#f97316" strokeLinecap="round" strokeWidth="8" />
    <path d="M50 66l10 8" stroke="#d46a12" strokeLinecap="round" strokeWidth="7" />
    <rect fill="#f28c28" height="14" rx="3" width="22" x="24" y="65" />
    <rect fill="#1f2937" height="4" width="4" x="29" y="63" />
    <rect fill="#1f2937" height="4" width="4" x="37" y="63" />
    <path d="M30 73h4m4 0h4" stroke="#111827" strokeLinecap="round" strokeWidth="2.5" />
  </svg>
);

const CartBottlesArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <circle cx="32" cy="74" fill="#a0a0a0" r="5" />
    <circle cx="66" cy="74" fill="#a0a0a0" r="5" />
    <path d="M18 29h9l6 32h39" fill="none" stroke="#8f8f8f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    <path d="M33 38h40l-4 24H37z" fill="#2c3238" opacity="0.88" />
    <path d="M42 28h10v34H42z" fill="#d6f0ff" />
    <rect fill="#8fd1ff" height="5" rx="2" width="6" x="44" y="22" />
    <path d="M55 31h11v28H55z" fill="#8b4d23" />
    <rect fill="#c57a32" height="5" rx="2" width="6" x="58" y="25" />
    <path d="M68 38h8v20h-8z" fill="#b0b7bd" />
    <rect fill="#d8dee3" height="4" rx="1.5" width="6" x="69" y="34" />
  </svg>
);

const VacuumArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <circle cx="38" cy="69" fill="#16212e" r="8" />
    <circle cx="63" cy="73" fill="#16212e" r="7" />
    <path d="M34 28h25c7 0 13 6 13 13v22c0 7-6 13-13 13H35c-6 0-11-5-11-11V38c0-6 4-10 10-10z" fill="#56768d" />
    <rect fill="#8ea9bc" height="17" rx="4" width="11" x="34" y="37" />
    <circle cx="54" cy="53" fill="#263645" r="9" />
    <circle cx="54" cy="53" fill="#93a8b6" r="4" />
    <path d="M66 38c10 3 17 10 18 20" fill="none" stroke="#4e5963" strokeLinecap="round" strokeWidth="7" />
    <path d="M84 58l-7 1" fill="none" stroke="#303942" strokeLinecap="round" strokeWidth="6" />
    <path d="M35 71c-10 0-14 3-17 8" fill="none" stroke="#4e5963" strokeLinecap="round" strokeWidth="7" />
  </svg>
);

const ToolsArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <path d="M28 28l14 15-9 9-15-14c-4-4-4-10 0-14l2-2c4-4 10-4 14 0z" fill="#706c6a" />
    <path d="M44 26L26 44" stroke="#b99d6b" strokeLinecap="round" strokeWidth="8" />
    <path d="M57 21c7 2 11 10 8 18l-6-5-8 8 5 6c-8 2-16-1-18-8z" fill="#8f8f8f" />
    <path d="M65 48l11 12" stroke="#8f8f8f" strokeLinecap="round" strokeWidth="6" />
    <path d="M69 24l9 9-17 17-9-9z" fill="#f6c34e" />
    <path d="M60 42l9 9-6 6-9-9z" fill="#4a4a4a" />
  </svg>
);

const MachineShopArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <rect fill="#5e7b61" height="44" rx="6" width="54" x="18" y="28" />
    <rect fill="#35513b" height="8" rx="2" width="46" x="22" y="58" />
    <circle cx="31" cy="43" fill="#1e2722" r="6" />
    <circle cx="31" cy="43" fill="#8fa08f" r="2.5" />
    <circle cx="48" cy="60" fill="#263227" r="8" />
    <circle cx="48" cy="60" fill="#9caf9e" r="3" />
    <rect fill="#304132" height="15" rx="2" width="12" x="57" y="36" />
    <path d="M69 43h10" stroke="#cad5c8" strokeLinecap="round" strokeWidth="4" />
    <circle cx="24" cy="29" fill="#9caf9e" r="3" />
    <circle cx="35" cy="29" fill="#9caf9e" r="3" />
  </svg>
);

const HandshakeArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <path d="M19 47l13-10 18 15-13 10z" fill="#80c97a" />
    <path d="M77 47L64 37 46 52l13 10z" fill="#4a586f" />
    <path d="M37 63l-8-7 19-16 8 7c4 4 4 10 0 14l-4 4c-4 4-10 4-15-2z" fill="#e9b58f" />
    <path d="M59 63l8-7-19-16-8 7c-4 4-4 10 0 14l4 4c4 4 10 4 15-2z" fill="#d59b75" />
    <path d="M39 57l7 7M46 52l8 8M53 47l7 7" fill="none" stroke="#bc835e" strokeLinecap="round" strokeWidth="3.5" />
  </svg>
);

const LaserMachineArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <rect fill="#44413d" height="10" rx="2" width="58" x="19" y="68" />
    <rect fill="#585552" height="30" rx="4" width="20" x="37" y="31" />
    <rect fill="#79756d" height="12" rx="2" width="10" x="42" y="24" />
    <path d="M47 36v24" stroke="#161616" strokeWidth="4" />
    <circle cx="47" cy="65" fill="#ff4b3e" r="4.5" />
    <path d="M47 65l-13 8M47 65l13 8M47 65l-16 0M47 65l16 0" stroke="#ff5f55" strokeLinecap="round" strokeWidth="2" />
    <rect fill="#353230" height="22" rx="3" width="13" x="18" y="34" />
    <rect fill="#353230" height="22" rx="3" width="13" x="64" y="34" />
    <path d="M67 28h10l-5 10h-10z" fill="#f8d047" />
    <path d="M70 31l2 4" stroke="#463400" strokeLinecap="round" strokeWidth="2" />
  </svg>
);

const EngineArt = () => (
  <svg aria-hidden="true" className={artClassName} viewBox="0 0 96 96">
    <path d="M22 52l10-12h28l14 12-14 12H32z" fill="#6e7379" />
    <circle cx="28" cy="52" fill="#2d3742" r="8" />
    <circle cx="28" cy="52" fill="#99a0a6" r="3.5" />
    <path d="M72 46l12 6-12 6z" fill="#f97316" />
    <path d="M83 52c6 0 9 4 11 8-7 1-13-1-15-5 1-2 2-3 4-3z" fill="#fb923c" />
    <path d="M27 39l5-8h7l-3 8zM27 65l5 8h7l-3-8zM57 39l6-8h7l-4 8zM57 65l6 8h7l-4-8z" fill="#9aa1a8" />
    <path d="M39 42h15v20H39z" fill="#808890" />
    <path d="M54 44h8v16h-8z" fill="#596069" />
  </svg>
);

const artMap: Record<GarageDeckArtKind, () => JSX.Element> = {
  "sprout-stick": SproutStickArt,
  "can-fire": CanFireArt,
  "glue-battery": GlueBatteryArt,
  "cart-bottles": CartBottlesArt,
  vacuum: VacuumArt,
  tools: ToolsArt,
  "machine-shop": MachineShopArt,
  handshake: HandshakeArt,
  "laser-machine": LaserMachineArt,
  engine: EngineArt,
};

export const GarageDeckArt = ({ kind }: GarageDeckArtProps) => {
  const Illustration = artMap[kind as GarageDeckArtKind];

  if (!Illustration) {
    return null;
  }

  return <Illustration />;
};
