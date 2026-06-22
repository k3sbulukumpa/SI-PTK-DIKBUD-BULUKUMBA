import React from "react";
import { UserSession } from "../types";
import { KeyRound, LogOut, ShieldAlert, ShieldCheck, Users } from "lucide-react";

interface HeaderProps {
  session: UserSession;
  onLogout: () => void;
  onOpenChangePassword: () => void;
  onOpenManagePasswords: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  onOpenChangePassword,
  onOpenManagePasswords
}) => {
  const isDinas = session.role === "Admin Dinas";
  const labelKecamatan = isDinas ? "Admin Kabupaten" : session.identifier.split("|")[1];

  return (
    <header className="bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-9 h-9 bg-emerald-500 rounded flex items-center justify-center text-zinc-950 p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none flex items-center gap-1.5">SI PTK DIKBUD</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1"> KABUPATEN BULUKUMBA </p>
          </div>
        </div>

        {/* User Badges & Action Buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
          
          {/* Badge */}
          <div className={`text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 ${
            isDinas 
              ? "text-purple-400 border-purple-500/20 bg-purple-500/5" 
              : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
          }`}>
            {isDinas ? (
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{isDinas ? "Admin Dinas" : `Sekolah: ${labelKecamatan}`}</span>
          </div>

          {/* Change password (School role) */}
          {!isDinas && (
            <button
              id="gantiPwdBtn"
              onClick={onOpenChangePassword}
              className="bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-750 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 transition flex items-center gap-1 cursor-pointer"
              title="Ganti Password"
            >
              <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
              <span>Ganti Password</span>
            </button>
          )}

          {/* Manage passwords (Dinas role) */}
          {isDinas && (
            <button
              id="kelolaPwdBtn"
              onClick={onOpenManagePasswords}
              className="bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-750 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-700 transition flex items-center gap-1 cursor-pointer"
              title="Kelola Password Semua Akun"
            >
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              <span>Kelola Password</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="bg-red-950/20 text-red-450 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
