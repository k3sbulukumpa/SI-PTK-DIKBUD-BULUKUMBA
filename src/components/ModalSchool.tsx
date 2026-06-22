import React, { useState, useEffect } from "react";
import { School } from "../types";
import { X, Search, Loader2, Plus, Edit, Trash2, Undo } from "lucide-react";

interface ModalSchoolProps {
  schools: School[];
  kecamatans: string[];
  isOpen: boolean;
  onClose: () => void;
  onRefreshSchools: () => void;
}

export const ModalSchool: React.FC<ModalSchoolProps> = ({
  schools,
  kecamatans,
  isOpen,
  onClose,
  onRefreshSchools
}) => {
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [kecamatanInput, setKecamatanInput] = useState("");
  const [schoolNameInput, setSchoolNameInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  if (!isOpen) return null;

  // Form Reset
  const handleResetForm = () => {
    setEditingSchoolId(null);
    setKecamatanInput("");
    setSchoolNameInput("");
    setErrorText("");
    setSuccessText("");
  };

  const handleEdit = (sch: School) => {
    setEditingSchoolId(sch.id);
    setKecamatanInput(sch.kec);
    setSchoolNameInput(sch.nama);
    setErrorText("");
    setSuccessText("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");
    setLoading(true);

    if (!kecamatanInput || !schoolNameInput) {
      setErrorText("Pilih Kecamatan dan isi Nama Sekolah!");
      setLoading(false);
      return;
    }

    const payload = {
      id: editingSchoolId,
      kecamatan: kecamatanInput,
      namaSekolah: schoolNameInput
    };

    try {
      const resp = await fetch("/api/school/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        setSuccessText(data.message || "Data sekolah berhasil disimpan.");
        handleResetForm();
        onRefreshSchools();
      } else {
        setErrorText(data.message || "Gagal menyimpan data sekolah.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Gagal menyimpan data karena kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sch: School) => {
    if (!window.confirm(`Hapus sekolah "${sch.nama}"? Menghapus akan membatalkan otentikasi login sekolah ini.`)) {
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/school/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sch.id })
      });
      const data = await resp.json();

      if (data.success) {
        setSuccessText(data.message || "Sekolah berhasil dihapus.");
        onRefreshSchools();
      } else {
        setErrorText(data.message || "Gagal menghapus sekolah.");
      }
    } catch (err) {
      console.error(err);
      setErrorText("Gagal menghapus sekolah karena kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSchoolsList = schools.filter(s => {
    const text = (s.kec + " " + s.nama).toLowerCase();
    return text.includes(searchFilter.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-zinc-900 px-6 py-4 flex justify-between items-center text-white border-b border-zinc-800">
          <h3 className="text-base font-bold flex items-center gap-2">Kelola Data Sekolah</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col md:flex-row gap-6 overflow-y-auto">
          
          {/* Left panel: Form */}
          <div className="w-full md:w-2/5 border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-6">
            <h4 className="font-bold text-white mb-4 text-xs uppercase tracking-widest text-emerald-400">
              {editingSchoolId ? "Edit Sekolah" : "Tambah Sekolah Baru"}
            </h4>

            {errorText && (
              <div className="mb-4 p-3 bg-red-950/20 text-red-450 border border-red-900/30 text-xs font-semibold rounded-lg">
                {errorText}
              </div>
            )}

            {successText && (
              <div className="mb-4 p-3 bg-emerald-950/20 text-emerald-450 border border-emerald-900/30 text-xs font-semibold rounded-lg">
                {successText}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Kecamatan</label>
                <select
                  value={kecamatanInput}
                  onChange={(e) => setKecamatanInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-350 rounded-lg p-2.5 text-xs focus:border-emerald-505/50 font-bold"
                  required
                >
                  <option value="">-- PILIH KECAMATAN --</option>
                  {kecamatans.map((kec) => (
                    <option key={kec} value={kec}>{kec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Nama Sekolah</label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value.toUpperCase())}
                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-lg p-2.5 text-xs focus:border-emerald-505/50 font-semibold uppercase"
                  placeholder="Contoh: SDN 58 TANETE"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 font-extrabold uppercase tracking-widest text-white py-2 px-4 rounded-lg text-[10px] hover:bg-emerald-555 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{editingSchoolId ? "Simpan" : "Tambah"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-zinc-800 border border-zinc-700 text-zinc-300 py-2 px-3 rounded-lg text-xs hover:bg-zinc-750 transition cursor-pointer"
                  title="Reset form"
                >
                  <Undo className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right panel: Lists */}
          <div className="w-full md:w-3/5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">Daftar Sekolah ({schools.length})</h4>
              
              {/* Search filter inside school editor */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Cari sekolah..."
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-emerald-505/50 w-44 font-semibold"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-[50vh] border border-zinc-800 rounded-lg divide-y divide-zinc-805/40">
              {filteredSchoolsList.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-600 font-medium">
                  Tidak ada sekolah yang cocok dengan pencarian.
                </div>
              ) : (
                filteredSchoolsList.map((sch) => (
                  <div key={sch.id} className="p-3 flex items-center justify-between hover:bg-zinc-805/30 transition text-xs font-medium border-b border-zinc-805/40">
                    <div>
                      <span className="font-bold text-zinc-200 block text-sm">{sch.nama}</span>
                      <span className="text-[10px] text-zinc-500">{sch.kec}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(sch)}
                        className="p-1.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
                        title="Edit nama"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sch)}
                        className="p-1.5 rounded bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-900/30 transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
