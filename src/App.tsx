import { Navigate, Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import CardsPage from "./pages/CardsPage";
import CardDetailPage from "./pages/CardDetailPage";
import CollectionPage from "./pages/CollectionPage";
import DeckEditorPage from "./pages/DeckEditorPage";
import DecksPage from "./pages/DecksPage";
import LoginPage from "./pages/LoginPage";
import NewDeckPage from "./pages/NewDeckPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <Routes>
          <Route path="/" element={<DecksPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/card/:code" element={<CardDetailPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/decks" element={<Navigate to="/" replace />} />
          <Route path="/decks/new" element={<NewDeckPage />} />
          <Route path="/decks/:id" element={<DeckEditorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="*"
            element={<p className="py-20 text-center text-muted">Página no encontrada.</p>}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
