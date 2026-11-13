// Rota '/login' que serve como página de login/registo do utilizador
// VIEW desacoplada: comunica exclusivamente com o API Gateway (/api/auth)

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiAuthGet, apiAuthPost } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar se o utilizador já está logado
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const data = await apiAuthGet();
        if (data?.user?.username) {
          localStorage.setItem("studysprint_username", data.user.username);
          localStorage.setItem("studysprint_user_id", data.user.id);
          router.push("/perfil");
        }
      } catch (err) {
        console.error("Erro ao verificar autenticação prévia:", err);
      }
    }

    checkExistingAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password) {
      setErrorMsg("Por favor, preenche todos os campos.");
      setLoading(false);
      return;
    }

    try {
      const action = isRegister ? "register" : "login";
      const result = await apiAuthPost({
        action,
        username: cleanUsername,
        password,
      });

      if (result.error) {
        setErrorMsg(result.error);
        setLoading(false);
        return;
      }

      if (result.success && result.user) {
        localStorage.setItem("studysprint_username", result.user.username);
        localStorage.setItem("studysprint_user_id", result.user.id);
        if (result.user.abGroup) {
          localStorage.setItem("studysprint_ab_group", result.user.abGroup);
        }
        router.push("/perfil");
      }
    } catch (err) {
      console.error("Erro na autenticação via API Gateway:", err);
      setErrorMsg("Ocorreu um erro no servidor. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Cabeçalho */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {isRegister ? "Criar Conta Simples" : "Entrar no StudySprint"}
          </h1>
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {isRegister
              ? "Apenas username e palavra-passe. Sem emails ou dados pessoais."
              : "Acede ao teu histórico e mantém a tua sequência diária."}
          </p>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: aluno_focado"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Palavra-passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading
              ? "A processar..."
              : isRegister
                ? "Concluir Registo"
                : "Iniciar Sessão"}
          </button>
        </form>

        {/* Alternância entre Login e Registo */}
        <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
            }}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isRegister
              ? "Já tens conta criada? Clica para entrar"
              : "Ainda não tens conta? Cria uma em segundos"}
          </button>
        </div>
      </div>
    </div>
  );
}
