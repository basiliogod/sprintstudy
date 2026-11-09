// Rota '/login' que serve como página de login do utilizador
// Formulário de login ou register com username e senha

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Função utilitária para encriptar password no browser
async function hashPassword(plainTextPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainTextPassword);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar se o utilizador já está logado com username
  useEffect(() => {
    async function checkExistingAuth() {
      const storedUser = localStorage.getItem("studysprint_username");
      if (storedUser) {
        router.push("/perfil");
        return;
      }

      // Se já existir conta associada ao auth.uid() atual
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("username")
          .eq("id", session.user.id)
          .maybeSingle();

        if (userData?.username) {
          localStorage.setItem("studysprint_username", userData.username);
          router.push("/perfil");
        }
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
      // Encriptar a password com SHA-256
      const hashedPassword = await hashPassword(password);

      if (isRegister) {
        // --- FLUXO DE REGISTO ---
        // Verificar se o username já está em uso
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (existingUser) {
          setErrorMsg("Este username já está escolhido. Escolhe outro.");
          setLoading(false);
          return;
        }

        // Obter ou criar sessão anónima do utilizador atual
        let {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          const { data: authData } = await supabase.auth.signInAnonymously();
          session = authData?.session;
        }

        const currentUserId = session?.user?.id;
        const abGroup =
          localStorage.getItem("studysprint_ab_group") ||
          (Math.random() < 0.5 ? "A" : "B");

        // Atualizar ou inserir na tabela users
        const { error: upsertError } = await supabase.from("users").upsert({
          id: currentUserId,
          username: cleanUsername,
          password: hashedPassword,
          ab_group: abGroup,
        });

        if (upsertError) {
          throw upsertError;
        }

        localStorage.setItem("studysprint_username", cleanUsername);
        router.push("/perfil");
      } else {
        // --- FLUXO DE LOGIN ---
        const { data: userFound, error: loginError } = await supabase
          .from("users")
          .select("id, username, password, ab_group")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (loginError || !userFound) {
          setErrorMsg("Utilizador não encontrado.");
          setLoading(false);
          return;
        }

        // Comparar o hash da password introduzida com o hash na base de dados
        if (userFound.password !== hashedPassword) {
          setErrorMsg("Palavra-passe incorreta.");
          setLoading(false);
          return;
        }

        // Guardar a sessão localmente
        localStorage.setItem("studysprint_username", userFound.username);
        localStorage.setItem("studysprint_user_id", userFound.id);
        if (userFound.ab_group) {
          localStorage.setItem("studysprint_ab_group", userFound.ab_group);
        }

        router.push("/perfil");
      }
    } catch (err) {
      console.error("Erro na autenticação:", err);
      setErrorMsg("Ocorreu um erro. Tenta novamente.");
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
