// Barra de navegação simples (Home, Perfil, Login)
// VIEW desacoplada: sincroniza estado de utilizador com o API Gateway (/api/auth)

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiAuthGet } from '@/lib/apiClient';

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('studysprint_username');
    if (storedUsername) {
      setUsername(storedUsername);
    }

    // Valida também com o API Gateway
    apiAuthGet()
      .then((data) => {
        if (data?.user?.username) {
          setUsername(data.user.username);
          localStorage.setItem('studysprint_username', data.user.username);
        } else {
          setUsername(null);
          localStorage.removeItem('studysprint_username');
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navLinks = [
    { name: 'Timer', href: '/' },
    { name: 'Perfil', href: '/perfil' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10 p-1">
            <Image
              src="/assets/logo.svg"
              alt="StudySprint Logo"
              width={28}
              height={28}
              priority
              className="object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Sprint<span className="text-indigo-600 dark:text-indigo-400">Study</span>
          </span>
        </Link>

        {/* Links de Navegação */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-100 text-indigo-600 dark:bg-zinc-800 dark:text-indigo-400'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Botão de Login / Estado do Utilizador */}
          {username ? (
            <Link
              href="/perfil"
              className="ml-2 flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              @{username}
            </Link>
          ) : (
            <Link
              href="/login"
              className={`ml-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === '/login'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
              }`}
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
