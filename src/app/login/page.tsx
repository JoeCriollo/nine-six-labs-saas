"use client";

import { useState, useTransition } from "react";
import { login } from "@/lib/actions/auth";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const response = await login(formData);
      if (response?.error) {
        setError(response.error);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      {/* Background Image with 30% Blur Effect */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bg-login.png"
          alt="Nine Six Labs Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay to create the 30% blur and darken the background for readability */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[8px]" />
      </div>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-[#0B0B0B]/60 backdrop-blur-xl border border-[#39FF14]/20 shadow-[0_0_40px_rgba(57,255,20,0.1)]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            NINE SIX <span className="text-[#39FF14]">LABS</span>
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
            Sistema de Gestión
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/50 flex items-center gap-3 text-red-400 animate-in fade-in zoom-in duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 tracking-wider uppercase ml-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                name="email"
                required
                placeholder="admin@ninesixlabs.com"
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all duration-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 tracking-wider uppercase ml-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF] transition-all duration-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 mt-2 bg-[#39FF14] text-black font-bold rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] hover:bg-[#4dff2b] transform transition-all duration-300 active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-6 h-6 animate-spin text-black" />
            ) : (
              "INICIAR SESIÓN"
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
