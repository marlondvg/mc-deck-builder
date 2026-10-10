import { Link, useParams } from "react-router-dom";
import { useCard } from "../api/hooks";
import CardDetails from "../components/CardDetails";

// Stand-alone page for direct links (/card/:code). From the card browser,
// cards open in a modal instead so the filters are kept.
export default function CardDetailPage() {
  const { code } = useParams();
  const { data: card, isLoading, isError } = useCard(code);

  if (isLoading) return <p className="py-20 text-center text-muted">Cargando carta…</p>;
  if (isError || !card) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted">No se encontró esa carta.</p>
        <Link to="/cards" className="mt-3 inline-block font-bold text-petrol hover:underline">
          ← Volver a las cartas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/cards" className="text-sm font-bold text-petrol hover:underline">
        ← Volver a las cartas
      </Link>
      <CardDetails card={card} />
    </div>
  );
}
