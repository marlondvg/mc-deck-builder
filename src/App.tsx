import { Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import CardsPage from "./pages/CardsPage";
import CardDetailPage from "./pages/CardDetailPage";
import CollectionPage from "./pages/CollectionPage";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<CardsPage />} />
          <Route path="/card/:code" element={<CardDetailPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="*"
            element={<p className="py-20 text-center text-slate-500">Page not found.</p>}
          />
        </Routes>
      </main>
    </div>
  );
}
