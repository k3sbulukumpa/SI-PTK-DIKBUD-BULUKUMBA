import React, { useState, useEffect } from "react";
import { School } from "../types";
import { X, Loader2, KeyRound, Check } from "lucide-react";

interface ModalManagePasswordsProps {
  schools: School[];
  kecamatans: string[];
  isOpen: boolean;
  onClose: () => void;
}

export const ModalManagePasswords: React.FC<ModalManagePasswordsProps> = ({
  schools,
  kecamatans,
  isOpen,
  onClose
}) => {
  const [selectedRole, setSelectedRole] = useState<"Admin Dinas" | "Sekolah" | "">("");
  
  // School parameters
  const [schoolKec, setSchoolKec] = useState("");
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [schoolName, setSchoolName] = useState("");

  // Loaded credentials of selected target
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  useEffect(() => {
    if (schoolKec) {
      setFilteredSchools(schools.filter(s => s.kec === schoolKec));
    } else {
      setFilteredSchools([]);
    }
    setSchoolName("");
    setCurrentPassword("");
  }, [schoolKec, schools]);

  const fetchPassword = async () => {
    setErrorText("");
    setSuccessText("");
    
    let identifier = "";
    if (selectedRole === "Sekolah") {
      if (!schoolKec || !schoolName) return;
      identifier = `${schoolKec}|${schoolName}`;
    } else if (selectedRole === "Admin Dinas") {
      identifier = "admin";
    } else {
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/admin/get-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole, identifier })
      });
      const data = await resp.json();

      if (data.success) {
        setCurrentPassword(data.password);
      } else {
        setCurrentPassword("");
        setErrorText(data.message || "Gagal memuat password akun.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Gagal memuat password akun karena kendala jaringan.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger password fetch when account selection completes
  useEffect(() => {
    if (selectedRole === "Admin Dinas" || (selectedRole === "Sekolah" && schoolKec && schoolName)) {
      fetchPassword();
    } else {
      setCurrentPassword("");
    }
  }, [selectedRole, schoolKec, schoolName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    
    let identifier = "";
    if (selectedRole === "Sekolah") {
      if (!schoolKec || !schoolName) {
        setErrorText("Pilih Kecamatan dan Sekolah terlebih dahulu!");
        return;
      }
      identifier = `${schoolKec}|${schoolName}`;
    } else if (selectedRole === "Admin Dinas") {
      identifier = "admin";
    } else {
      setErrorText("Pilih jenis akun.");
      return;
    }

    if (!newPassword.trim()) {
      setErrorText("Ketik password baru yang ingin disimpan!");
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          identifier,
          newPassword
        })
      });
      const data = await resp.json();

      if (data.success) {
        setSuccessText(data.message || "Password berhasil diperbarui!");
        setCurrentPassword(newPassword);
        setNewPassword("");
      } else {
        setErrorText(data.message || "Gagal memperbarui password.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Gagal menyimpan password karena kendala jaringan.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-5 py-4 flex justify-between items-center text-white">
          <h3 className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest text-emerald-450">
            <KeyRound className="h-4.5 w-4.5" />
            <span>Kelola Password Sistem</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          {errorText && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/35 text-red-400 text-xs font-semibold animate-shake">
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
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Pilih Jenis Akun</label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as any);
                setSchoolKec("");
                setSchoolName("");
                setCurrentPassword("");
                setErrorText("");
                setSuccessText("");
              }}
              className="w-full bg-zinc-950 border border-zinc-808 rounded-lg p-2.5 text-xs text-zinc-350 focus:border-emerald-505/50 font-semibold"
              required
            >
              <option value="">-- Pilih Jenis Akun --</option>
              <option value="Admin Dinas">Admin Dinas</option>
              <option value="Sekolah">Admin Sekolah (Kecamatan/Sekolah)</option>
            </select>
          </div>

          {selectedRole === "Sekolah" && (
            <div className="space-y-4 border-t border-zinc-805/40 pt-3 animate-fade-in">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Kecamatan</label>
                <select
                  value={schoolKec}
                  onChange={(e) => setSchoolKec(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-808 rounded-lg p-2 text-zinc-350 text-xs font-semibold uppercase"
                  required
                >
                  <option value="">-- Pilih Kecamatan --</option>
                  {kecamatans.map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nama Sekolah</label>
                <select
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={!schoolKec}
                  className="w-full bg-zinc-950 border border-zinc-808 rounded-lg p-2 text-zinc-350 text-xs font-semibold uppercase disabled:bg-zinc-900/40 disabled:text-zinc-650"
                  required
                >
                  <option value="">-- Pilih Sekolah --</option>
                  {filteredSchools.map(s => (
                    <option key={s.id} value={s.nama}>{s.nama}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-805/40 pt-3">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Password Saat Ini (Lama)</label>
            <input
              type="text"
              value={loading ? "Memuat password..." : (currentPassword || "Pilih akun untuk melihat password")}
              className="w-full bg-zinc-950 border border-zinc-808 rounded-lg p-2.5 text-xs text-zinc-500 font-bold tracking-wide cursor-not-allowed"
              readOnly
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Password Baru</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru..."
              className="w-full bg-zinc-950 border border-zinc-808 rounded-lg p-2.5 text-xs text-white placeholder:text-zinc-700/80 focus:border-emerald-505/50 font-semibold"
              required
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-805/45">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-zinc-75 transition tracking-widest uppercase text-[10px] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || loading || !selectedRole}
              className="bg-emerald-600 font-extrabold uppercase tracking-widest text-white py-2 px-5 rounded-lg text-[10px] hover:bg-emerald-555 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Diperbarui...</span>
                </>
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
