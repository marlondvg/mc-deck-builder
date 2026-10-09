import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

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
      className="panel mx-auto mt-10 flex max-w-[440px] flex-col gap-5 rounded-[20px] p-10 shadow-[8px_8px_0_#141414]"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>
        <p className="text-[15px] text-muted">Entra para ver tu colección y tus mazos.</p>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Usuario</span>
        <input
          className="field h-[50px] w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="tu_usuario"
          autoComplete="username"
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.12em] text-muted">Contraseña</span>
        <input
          type="password"
          className="field h-[50px] w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>
      <button type="submit" className="btn-primary h-[52px] text-[17px]">
        Entrar
      </button>
      <p className="text-xs text-subtle">
        Temporal: cualquier usuario funciona hasta conectar el backend.
      </p>
    </form>
  );
}
