import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function CollectionPage() {
  const { username } = useAuth();
  if (!username) return <Navigate to="/login" replace />;

  return (
    <div className="space-y-2">
      <h1 className="font-display text-4xl tracking-wide">Mi colección</h1>
      <p className="text-slate-500">
        Next step: pick the packs you own here (saved in localStorage for now).
      </p>
    </div>
  );
}
