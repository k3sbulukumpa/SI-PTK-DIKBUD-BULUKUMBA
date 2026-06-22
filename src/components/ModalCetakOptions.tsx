import React, { useState } from "react";
import { X, Printer } from "lucide-react";
import { formatTanggalIndo } from "../utils";

interface ModalCetakOptionsProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCetak: (config: CetakConfig) => void;
}

export interface CetakConfig {
  judul: string;
  tanggal: string;
  jabatan: string;
  nama: string;
  nip: string;
}

export const ModalCetakOptions: React.FC<ModalCetakOptionsProps> = ({
  isOpen,
  onClose,
  onSubmitCetak
}) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const defaultDateStr = `${yyyy}-${mm}-${dd}`;

  const [judul, setJudul] = useState("LAPORAN DATA PENDIDIK DAN TENAGA KEPENDIDIKAN (PTK)");
  const [tanggal, setTanggal] = useState(defaultDateStr);
  const [jabatan, setJabatan] = useState("Kepala Dinas Pendidikan dan Kebudayaan");
  const [nama, setNama] = useState("ANDI BUYUNG SAPUTRA, S.STP. M.M");
  const [nip, setNip] = useState("19811110 200012 1 012");

  if (!isOpen) return null;

  const handleCetakSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCetak({
      judul,
      tanggal: formatTanggalIndo(tanggal),
      jabatan,
      nama: nama.toUpperCase(),
      nip
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-zinc-900 px-5 py-3.5 text-white font-bold flex justify-between items-center text-xs uppercase tracking-widest border-b border-zinc-800">
          <span className="flex items-center gap-1.5"><Printer className="h-4.5 w-4.5 text-emerald-450" /> Pengaturan Cetak Laporan</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCetakSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Judul / Kop Dokumen</label>
            <input
              type="text"
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white font-semibold focus:border-emerald-505/50 font-sans"
              required
            />
          </div>

           <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Tanggal Tanda Tangan</label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white font-semibold focus:border-emerald-505/50 font-sans cursor-pointer"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Jabatan Penandatangan</label>
            <input
              type="text"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white font-semibold focus:border-emerald-505/50 font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nama Pejabat</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value.toUpperCase())}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white font-semibold focus:border-emerald-505/50 uppercase font-sans"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">NIP Pejabat</label>
            <input
              type="text"
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white font-semibold focus:border-emerald-505/50 font-mono"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-805">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 text-zinc-300 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-555 text-white px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
