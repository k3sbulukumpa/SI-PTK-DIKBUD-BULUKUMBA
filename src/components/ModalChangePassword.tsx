import React, { useState } from "react";
import { UserSession } from "../types";
import { X, Loader2, KeyRound, Check } from "lucide-react";

interface ModalChangePasswordProps {
  session: UserSession;
  isOpen: boolean;
  onClose: () => void;
}

export const ModalChangePassword: React.FC<ModalChangePasswordProps> = ({
  session,
  isOpen,
  onClose
}) => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    if (!oldPass.trim() || !newPass.trim()) {
      setErrorText("Semua kolom password wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: session.identifier,
          oldPass,
          newPass
        })
      });
      const data = await resp.json();

      if (data.success) {
        setSuccessText(data.message || "Password berhasil diperbarui!");
        setOldPass("");
        setNewPass("");
      } else {
        setErrorText(data.message || "Gagal memperbarui password.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex justify-between items-center text-white">
          <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest text-emerald-400">
            <KeyRound className="h-4.5 w-4.5" />
            <span>Ubah Password Admin</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorText && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/35 text-red-400 text-xs font-semibold">
              {errorText}
            </div>
          )}

          {successText && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-450 animate-pulse" />
              <span>{successText}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Password Lama</label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Masukkan password lama"
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700/80 focus:border-emerald-505/50 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Password Baru</label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Masukkan password baru"
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700/80 focus:border-emerald-505/50 font-semibold"
              required
            />
          </div>

          <div className="pt-3 flex gap-2 border-t border-zinc-805/40">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 py-2.5 px-4 rounded-lg text-xs font-semibold hover:bg-zinc-750 transition uppercase tracking-widest text-[10px] font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-555 text-white font-extrabold uppercase tracking-widest py-2.5 px-4 rounded-lg text-[10px] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Simpan</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
