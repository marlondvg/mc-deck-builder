import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

const inputClass =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-marvel focus:ring-2 focus:ring-marvel/20";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    // Mock login: no password check until the backend exists.
    login(username.trim());
    navigate("/");
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-10 max-w-sm space-y-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
    >
      <h1 className="font-display text-3xl tracking-wide">Log in</h1>
      <label className="block space-y-1 text-sm font-medium">
        Username
        <input
          className={inputClass}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Password
        <input
          type="password"
          className={inputClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-marvel py-2 font-semibold text-white hover:bg-marvel-dark"
      >
        Log in
      </button>
      <p className="text-xs text-slate-400">
        Temporary: any username works until the backend is connected.
      </p>
    </form>
  );
}
