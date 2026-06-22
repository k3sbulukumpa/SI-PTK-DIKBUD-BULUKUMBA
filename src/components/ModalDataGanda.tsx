import React, { useState, useEffect } from "react";
import { GtkItem } from "../types";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Loader2, Trash2 } from "lucide-react";

interface ModalDataGandaProps {
  gtkData: GtkItem[];
  isOpen: boolean;
  onClose: () => void;
  onRefreshDataList: () => void;
}

interface DuplicateGroupItem extends GtkItem {
  _score: number;
  _autoCheck: boolean;
}

export const ModalDataGanda: React.FC<ModalDataGandaProps> = ({
  gtkData,
  isOpen,
  onClose,
  onRefreshDataList
}) => {
  const [duplicateList, setDuplicateList] = useState<DuplicateGroupItem[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [cleaning, setCleaning] = useState(false);

  // Scan and identify duplicate records when modal opens or dataset changes
  useEffect(() => {
    if (!isOpen) return;

    // 1. Group by NIK and Normalized Name
    const counts: Record<string, number> = {};
    gtkData.forEach(d => {
      const nik = String(d.NIK || "").trim();
      const name = String(d.Nama || "").trim().toLowerCase();
      if (nik.length === 16 && name) {
        const key = `${nik}|${name}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const duplicateKeys = Object.keys(counts).filter(k => counts[k] > 1);

    // 2. Filter elements belonging to duplicate groups
    const rawDuplicates = gtkData.filter(d => {
      const nik = String(d.NIK || "").trim();
      const name = String(d.Nama || "").trim().toLowerCase();
      if (nik.length === 16 && name) {
        const key = `${nik}|${name}`;
        return duplicateKeys.includes(key);
      }
      return false;
    });

    // 3. Compute completeness Score and set autoCheck
    const groups: Record<string, DuplicateGroupItem[]> = {};
    rawDuplicates.forEach(d => {
      let score = 0;
      const targetFields: (keyof GtkItem)[] = [
        "Nama", "Sekolah", "Kecamatan", "Status_Pegawai", "NIP", "Golongan", 
        "TMT_Golongan_Formatted", "Jabatan", "Pendidikan", "Beban_Tugas", 
        "Sertifikasi", "Mapel", "No_HP"
      ];
      targetFields.forEach(f => {
        const val = String(d[f] || "").trim();
        if (val && val !== "-") {
          score++;
        }
      });

      const key = `${String(d.NIK).trim()}|${String(d.Nama).trim().toLowerCase()}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push({
        ...d,
        _score: score,
        _autoCheck: false
      });
    });

    // For each group, determine the highest scorer to preserve; auto-check the rest
    const finalList: DuplicateGroupItem[] = [];
    const autoCheckedIds: string[] = [];

    Object.keys(groups).forEach(key => {
      const group = groups[key];
      if (group.length > 1) {
        // Find maximum score index
        let maxScore = -1;
        let bestIndex = 0;
        group.forEach((item, idx) => {
          if (item._score > maxScore) {
            maxScore = item._score;
            bestIndex = idx;
          }
        });

        // Mark everyone else for autoCheck
        group.forEach((item, idx) => {
          if (idx !== bestIndex) {
            item._autoCheck = true;
            autoCheckedIds.push(item.ID);
          }
          finalList.push(item);
        });
      }
    });

    // Sort list by NIK sequence and descending scores
    finalList.sort((a, b) => {
      const keyA = `${a.NIK}|${a.Nama.toLowerCase()}`;
      const keyB = `${b.NIK}|${b.Nama.toLowerCase()}`;
      if (keyA !== keyB) return keyA.localeCompare(keyB);
      return b._score - a._score;
    });

    setDuplicateList(finalList);
    setCheckedIds(autoCheckedIds);
  }, [isOpen, gtkData]);

  if (!isOpen) return null;

  const handleToggleCheck = (id: string) => {
    if (checkedIds.includes(id)) {
      setCheckedIds(checkedIds.filter(x => x !== id));
    } else {
      setCheckedIds([...checkedIds, id]);
    }
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setCheckedIds(duplicateList.map(item => item.ID));
    } else {
      setCheckedIds([]);
    }
  };

  const handleCleanDuplicates = async () => {
    if (checkedIds.length === 0) {
      alert("Silakan centang setidaknya satu data yang ingin dihapus.");
      return;
    }

    if (!window.confirm(`Hapus ${checkedIds.length} data ganda terpilih secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setCleaning(true);
    let successCount = 0;

    try {
      // Loop sequence and delete records based on checkedIds
      for (const id of checkedIds) {
        const resp = await fetch("/api/gtk/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        const d = await resp.json();
        if (d.success) successCount++;
      }

      alert(`Sukses membersihkan data ganda. ${successCount} baris telah dihapus.`);
      onRefreshDataList();
    } catch (err) {
      console.error(err);
      alert("Terjadi kendala jaringan saat menghapus data.");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex justify-between items-center text-white">
          <h3 className="text-sm font-extrabold flex items-center gap-2 uppercase tracking-widest text-purple-400">
            <AlertTriangle className="h-5 w-5 text-purple-400 animate-pulse" />
            <span>Kelola Data Ganda (NIK &amp; Nama Identik)</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-6 pb-0">
          <div className="text-xs text-purple-450 bg-purple-950/20 p-4 rounded-lg border border-purple-900/30 flex gap-3">
            <AlertCircle className="h-6 w-6 text-purple-400 flex-shrink-0 animate-bounce" />
            <div>
              <span className="font-bold">Informasi Sistem Data Ganda:</span> <br />
              Sistem memindai seluruh database dan mendeteksi data di bawah ini memiliki <b>NIK (16 Digit) dan Nama yang sama</b> di sekolah yang sama atau berbeda. Sistem secara otomatis telah mencentang data yang <b>kurang lengkap</b> (skor kelengkapan terendah). Anda dapat menyesuaikan checkbox kemudian mengklik "Hapus Terpilih secara Massal".
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 flex-grow overflow-y-auto">
          {duplicateList.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-3" />
              <p className="font-extrabold text-lg text-white">Database Bersih!</p>
              <p className="text-xs text-zinc-500 mt-1">Tidak ditemukan data ganda atau duplikasi NIK di dalam sistem.</p>
            </div>
          ) : (
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-400 break-words border-collapse">
                  <thead className="bg-zinc-850/60 text-zinc-400 font-bold border-b border-zinc-800">
                    <tr>
                      <th className="p-3 text-center w-10">
                        <input
                          type="checkbox"
                          onChange={handleToggleAll}
                          checked={checkedIds.length === duplicateList.length && duplicateList.length > 0}
                          className="w-4 h-4 text-purple-500 rounded border-zinc-800 bg-zinc-950"
                        />
                      </th>
                      <th className="p-3">NIK &amp; Status Kelengkapan</th>
                      <th className="p-3">Nama Lengkap</th>
                      <th className="p-3">Sekolah Asal</th>
                      <th className="p-3">Kecamatan</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Skor Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-805/30">
                    {duplicateList.map((item, index) => {
                      const isChecked = checkedIds.includes(item.ID);
                      const isHighestScore = !item._autoCheck;

                      return (
                        <tr 
                          key={`${item.ID || 'dup'}-${index}`} 
                          className={`hover:bg-zinc-805/30 transition ${isHighestScore ? "bg-zinc-900/40" : "bg-purple-950/10"}`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCheck(item.ID)}
                              className="w-4 h-4 text-purple-500 rounded border-zinc-800 bg-zinc-950"
                            />
                          </td>
                          <td className="p-3 font-semibold text-zinc-200">
                            <span>{item.NIK}</span>
                            {isHighestScore ? (
                              <span className="text-[9px] text-emerald-400 bg-emerald-950/20 font-bold px-1.5 py-0.5 rounded border border-emerald-900/30 block mt-1 w-max">LENIH LENGKAP</span>
                            ) : (
                              <span className="text-[9px] text-red-450 bg-red-950/20 font-bold px-1.5 py-0.5 rounded border border-red-900/30 block mt-1 w-max">KURANG LENGKAP</span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-zinc-150">{item.Nama}</td>
                          <td className="p-3 text-zinc-350 font-semibold">{item.Sekolah}</td>
                          <td className="p-3 text-zinc-450 font-semibold">{item.Kecamatan}</td>
                          <td className="p-3">
                            <span className="bg-sky-500/10 text-sky-450 border border-sky-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                              {item.Status_Pegawai}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-400 font-mono">
                            {item._score}/13 fields
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="bg-zinc-900/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-t border-zinc-800/80 gap-3">
          <span className="text-xs font-bold text-zinc-500">
            Terpilih: <span className="text-purple-400 font-black">{checkedIds.length}</span> / {duplicateList.length} data ganda
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="bg-zinc-800 border border-zinc-750 text-zinc-300 px-5 py-2 rounded-lg text-xs font-bold hover:bg-zinc-70 transition tracking-widest uppercase text-[10px] flex-1 sm:flex-none cursor-pointer"
            >
              Tutup
            </button>
            {duplicateList.length > 0 && (
              <button
                onClick={handleCleanDuplicates}
                disabled={cleaning || checkedIds.length === 0}
                className="bg-red-650 hover:bg-red-700 text-white font-extrabold uppercase tracking-widest py-2 px-5 rounded-lg text-[10px] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-1 sm:flex-none"
              >
                {cleaning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Membersihkan...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Terpilih ({checkedIds.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
