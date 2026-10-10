import type { ReactNode } from "react";

// Renders MarvelCDB card text without injecting HTML. The API uses a small
// markup set that we turn into React elements:
//   <b>/<strong>, <i>/<em>, <u>, <br>   → formatting / line breaks
//   [[S.H.I.E.L.D.]]                    → trait (bold italic, like on the card)
//   [energy] [mental] [physical] [wild] [star] [per_hero] … → icon tokens
// Any other tag is dropped; its inner text is kept.

const TOKEN_RE =
  /(<\/?\s*(?:b|strong|i|em|u)\s*>|<\s*br\s*\/?\s*>|\[\[[^\]]+\]\]|\[[a-z_]+\]|\n|<[^>]+>)/gi;

// Game icons as colored labels. Resources use their resource color.
// `plain` icons are drawn as a bare glyph in the text, like on the card.
const ICONS: Record<string, { label: string; cls: string; title?: string; plain?: boolean }> = {
  energy: { label: "Energy", cls: "bg-justice text-ink" },
  mental: { label: "Mental", cls: "bg-leadership text-ink" },
  physical: { label: "Physical", cls: "bg-aggression text-white" },
  wild: { label: "Wild", cls: "bg-protection text-ink" },
  star: { label: "★", cls: "text-ink", title: "Star", plain: true },
  per_hero: { label: "per player", cls: "bg-white text-ink", title: "Per player" },
  per_player: { label: "per player", cls: "bg-white text-ink", title: "Per player" },
  boost: { label: "Boost", cls: "bg-white text-ink" },
  crisis: { label: "Crisis", cls: "bg-white text-ink" },
  acceleration: { label: "Acceleration", cls: "bg-white text-ink" },
  hazard: { label: "Hazard", cls: "bg-white text-ink" },
  amplify: { label: "Amplify", cls: "bg-white text-ink" },
  unique: { label: "Unique", cls: "bg-white text-ink" },
  cost: { label: "Cost", cls: "bg-white text-ink" },
};

/** Colored label for a game icon token (also used for the card's resources). */
export function IconLabel({ name }: { name: string }) {
  const icon = ICONS[name] ?? {
    label: name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    cls: "bg-white text-ink",
  };
  if (icon.plain) {
    return (
      <span title={icon.title ?? icon.label} className={`not-italic ${icon.cls}`}>
        {icon.label}
      </span>
    );
  }
  return (
    <span
      title={icon.title ?? icon.label}
      className={`mx-0.5 inline-block rounded-md border-2 border-ink px-1.5 align-[1px] text-[0.8em] font-bold not-italic leading-snug ${icon.cls}`}
    >
      {icon.label}
    </span>
  );
}

export default function CardText({ text, className }: { text: string; className?: string }) {
  const nodes: ReactNode[] = [];
  let bold = 0;
  let italic = 0;
  let underline = 0;
  let key = 0;

  const pushText = (value: string) => {
    if (!value) return;
    let node: ReactNode = value;
    if (underline) node = <u key={key++}>{node}</u>;
    if (italic) node = <em key={key++}>{node}</em>;
    if (bold) node = <strong key={key++} className="font-semibold">{node}</strong>;
    nodes.push(typeof node === "string" ? <span key={key++}>{node}</span> : node);
  };

  for (const part of text.split(TOKEN_RE)) {
    if (!part) continue;
    const tag = /^<\s*(\/?)\s*([a-z]+)/i.exec(part);

    if (tag) {
      const closing = tag[1] === "/";
      const name = tag[2].toLowerCase();
      const delta = closing ? -1 : 1;
      if (name === "br") nodes.push(<br key={key++} />);
      else if (name === "b" || name === "strong") bold = Math.max(0, bold + delta);
      else if (name === "i" || name === "em") italic = Math.max(0, italic + delta);
      else if (name === "u") underline = Math.max(0, underline + delta);
      // other tags: ignored
    } else if (part === "\n") {
      nodes.push(<br key={key++} />);
    } else if (part.startsWith("[[") && part.endsWith("]]")) {
      nodes.push(
        <strong key={key++} className="font-trait font-normal tracking-wide">
          {part.slice(2, -2)}
        </strong>,
      );
    } else if (/^\[[a-z_]+\]$/i.test(part)) {
      nodes.push(<IconLabel key={key++} name={part.slice(1, -1).toLowerCase()} />);
    } else {
      pushText(part);
    }
  }

  return <p className={className}>{nodes}</p>;
}
