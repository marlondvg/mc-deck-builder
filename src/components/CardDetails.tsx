import type { CSSProperties } from "react";
import type { Card } from "../api/types";
import { cardImageUrl } from "../api/marvelcdb";
import { factionStyle } from "../lib/factions";
import CardText, { IconLabel } from "./CardText";

// White number with an ink outline and a hard shadow down-left, like the stat
// numbers printed on the card.
const OUTLINED =
  "text-white [-webkit-text-stroke:5px_#141414] [paint-order:stroke_fill] [text-shadow:-4px_4px_0_#141414]";

// Info chips under the card name; fixed height so they all line up.
const CHIP = "flex h-8 items-center rounded-lg border-2 border-ink px-3";

const STAR_PATH =
  "M12 2 14.82 9.12 22.46 9.6 16.57 14.48 18.47 21.9 12 17.8 5.53 21.9 7.43 14.48 1.54 9.6 9.18 9.12z";

/** Consequential damage marker: a black five-point star with a white outline,
 *  set on the black label box (our own drawing in the style of the card icon). */
function DamageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 -rotate-15 overflow-visible" aria-hidden="true">
      <path
        d={STAR_PATH}
        className="fill-ink stroke-white"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Star printed next to a stat number: white with an ink outline and a hard
 *  shadow down-left (smaller than the number's, to suit its size). */
function StatStar() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-1 h-4 w-4 overflow-visible drop-shadow-[-1.5px_1.5px_0_#141414]"
      role="img"
      aria-label="Estrella: ver el texto de la carta"
    >
      <title>Estrella: ver el texto de la carta</title>
      <path d={STAR_PATH} className="fill-white stroke-ink" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// Resources printed on the card, shown as colored labels.
const RESOURCES = [
  { key: "resource_physical", name: "physical" },
  { key: "resource_mental", name: "mental" },
  { key: "resource_energy", name: "energy" },
  { key: "resource_wild", name: "wild" },
] as const;

/** Small chip with the card's resources, shown next to the type chip. */
function ResourceChip({ card }: { card: Card }) {
  const icons = RESOURCES.flatMap((r) =>
    Array.from({ length: card[r.key] ?? 0 }, (_, i) => ({ ...r, id: `${r.key}-${i}` })),
  );
  if (icons.length === 0) return null;
  return (
    <span className={`${CHIP} gap-0.5 bg-white`}>
      <span className="mr-1 italic">Recurso:</span>
      {icons.map((r) => (
        <IconLabel key={r.id} name={r.name} />
      ))}
    </span>
  );
}

function Stat({
  label,
  value,
  fill,
  consequential,
  star,
}: {
  label: string;
  value: number | null | undefined;
  /** Star printed next to the number: the card text has a rule about this stat. */
  star?: boolean;
  /** Background color class (comic halftone fill), like the cost box on the card. */
  fill?: string;
  /** Consequential damage icons shown inside the label box, after the text (allies' ATK/THW). */
  consequential?: number;
}) {
  if (value === undefined || value === null) return null;
  const labelContent = (
    <span className="flex items-center gap-1 font-stat-label text-sm font-black uppercase tracking-wider">
      {label}
      {!!consequential && consequential > 0 && (
        <span
          className="flex items-center gap-0.5"
          role="img"
          aria-label={`Daño consecuente: ${consequential}`}
          title={`Daño consecuente: ${consequential}`}
        >
          {Array.from({ length: consequential }, (_, i) => (
            <DamageIcon key={i} />
          ))}
        </span>
      )}
    </span>
  );
  return (
    <div
      className={`panel flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 shadow-comic-sm ${
        fill ? `comic-fill ${fill}` : ""
      }`}
    >
      <div className="flex items-start">
        <div
          className={`font-stat text-4xl font-black italic leading-tight ${fill ? OUTLINED : "text-ink"}`}
        >
          {value}
        </div>
        {star && <StatStar />}
      </div>
      {fill ? (
        <div className="stat-label-box">
          <div className="text-white">{labelContent}</div>
        </div>
      ) : (
        <div className="text-ink">{labelContent}</div>
      )}
    </div>
  );
}

/** Four-point star used on the cards to mark unique characters. */
function UniqueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mr-1 inline-block h-[0.6em] w-[0.6em] -translate-y-[0.08em] fill-current align-baseline"
      role="img"
      aria-label="Única"
    >
      <title>Única</title>
      <path d="M12 0c.9 6.6 5.4 11.1 12 12-6.6.9-11.1 5.4-12 12-.9-6.6-5.4-11.1-12-12C6.6 11.1 11.1 6.6 12 0z" />
    </svg>
  );
}

/** Image + info for one card. Used by the card modal and the /card/:code page. */
export default function CardDetails({ card, titleId }: { card: Card; titleId?: string }) {
  const img = cardImageUrl(card);
  const style = factionStyle(card.faction_code);

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,340px)_1fr]">
      <div className="panel self-start overflow-hidden rounded-[18px] bg-white shadow-comic-lg">
        {img ? (
          <img src={img} alt={card.name} className="block w-full" />
        ) : (
          <div className={`comic-fill ${style.fill} flex aspect-[5/7] items-center justify-center p-6`}>
            <span className="-skew-x-6 border-[3px] border-ink bg-white px-4 py-1.5 font-display text-2xl uppercase shadow-comic-sm">
              Sin imagen
            </span>
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <h2
            id={titleId}
            className="font-card-title text-5xl font-bold leading-none [font-variant:small-caps] sm:text-6xl"
          >
            {(card.is_unique ?? card.unique) && <UniqueIcon />}
            {card.name}
          </h2>
          {card.subname && (
            <p className="mt-1.5 font-card text-lg font-semibold uppercase tracking-wide text-muted">
              {card.subname}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className={`${CHIP} font-bold ${style.badge}`}>
              {card.faction_name}
            </span>
            <span className={`${CHIP} bg-white font-bold`}>
              {card.type_name}
            </span>
            <ResourceChip card={card} />
            <span className={`${CHIP} gap-1 bg-white`}>
              <span className="italic">Pack:</span>
              {card.pack_name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          <Stat label="Coste" value={card.cost} fill={style.fill} star={card.cost_star} />
          <Stat
            label="THW"
            value={card.thwart}
            fill="bg-stat-thw"
            consequential={card.thwart_cost}
            star={card.thwart_star}
          />
          <Stat
            label="ATK"
            value={card.attack}
            fill="bg-stat-atk"
            consequential={card.attack_cost}
            star={card.attack_star}
          />
          <Stat label="DEF" value={card.defense} fill="bg-stat-def" star={card.defense_star} />
          <Stat label="HP" value={card.health} fill="bg-stat-hp" star={card.health_star} />
          <Stat label="Mano" value={card.hand_size} />
        </div>

        {(card.traits || card.text || card.flavor) && (
          <div
            className="panel comic-fill card-text-frame"
            style={{ "--aspect": `var(--color-${card.faction_code}, var(--color-basic))` } as CSSProperties}
          >
            <div className="card-text-rays space-y-3 p-5">
              {card.traits && (
                <p className="text-center font-trait text-xl uppercase tracking-wide">{card.traits}</p>
              )}
              {card.text && (
                <CardText text={card.text} className="font-card text-[17px] leading-relaxed" />
              )}
              {card.flavor && (
                <CardText
                  text={card.flavor}
                  className="font-flavor text-base font-bold italic text-muted"
                />
              )}
            </div>
          </div>
        )}

        {card.illustrator && (
          <p className="text-xs text-subtle">Ilustración: {card.illustrator}</p>
        )}
      </div>
    </div>
  );
}
