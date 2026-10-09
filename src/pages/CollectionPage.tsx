import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function CollectionPage() {
  const { username } = useAuth();
  if (!username) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-display text-5xl uppercase tracking-wide sm:text-6xl">Mi colección</h1>
      <p className="text-muted">
        Next step: pick the packs you own here (saved in localStorage for now).
      </p>
    </div>
  );
}
