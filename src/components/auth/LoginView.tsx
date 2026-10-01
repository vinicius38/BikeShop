import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkshop } from '../../context/WorkshopContext';
import bannerBg from '../../assets/images/banner_tech_bg_1790641621007.jpg';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { workshopName, tradeName, logoUrl } = useWorkshop();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(username, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique usuário e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040915] text-[#F8F8F8] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Graphic */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${bannerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#040915] via-[#040915]/90 to-[#040915]/60" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-[#0B1424] border border-[#1F2E45] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-xl bg-[#121E30] border border-[#1F2E45] mx-auto overflow-hidden flex items-center justify-center shadow-lg">
            <img
              src={logoUrl}
              alt={workshopName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight uppercase">
            {workshopName}
          </h1>
          <p className="text-xs text-[#ACB0B0] font-mono">{tradeName}</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Usuário / Login
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#ACB0B0] absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#ACB0B0] uppercase mb-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#ACB0B0] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#121E30] border border-[#1F2E45] text-white placeholder-[#ACB0B0] outline-hidden focus:border-[#EF7410]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[#EF7410] hover:bg-[#EF7410]/90 text-white font-bold text-xs shadow-lg shadow-[#EF7410]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Acessar Sistema Oficina <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
