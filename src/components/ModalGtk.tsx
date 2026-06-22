import React, { useState, useEffect } from "react";
import { GtkItem, School } from "../types";
import { X, Loader2, Save } from "lucide-react";

interface ModalGtkProps {
  schools: School[];
  kecamatans: string[];
  isOpen: boolean;
  onClose: () => void;
  gtkToEdit: GtkItem | null;
  viewerRole: "Admin Dinas" | "Sekolah";
  viewerIdentifier: string;
  onSaveSuccess: () => void;
}

export const ModalGtk: React.FC<ModalGtkProps> = ({
  schools,
  kecamatans,
  isOpen,
  onClose,
  gtkToEdit,
  viewerRole,
  viewerIdentifier,
  onSaveSuccess
}) => {
  const isDinas = viewerRole === "Admin Dinas";

  // Form Field States
  const [rowNumber, setRowNumber] = useState("");
  const [id, setId] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [sekolah, setSekolah] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [statusPegawai, setStatusPegawai] = useState<"PNS" | "PPPK" | "PPPKPW" | "Honorer" | "">("");
  const [nip, setNip] = useState("");
  const [golongan, setGolongan] = useState("");
  const [tmtGolongan, setTmtGolongan] = useState("");
  const [tmtKgbTerakhir, setTmtKgbTerakhir] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [pendidikan, setPendidikan] = useState("");
  const [bebanTugas, setBebanTugas] = useState("");
  
  // Dynamic mapel types
  const [jenisMapel, setJenisMapel] = useState("");
  const [jenisMapelLainnya, setJenisMapelLainnya] = useState("");
  
  // Kepsek details
  const [tmtKepsek, setTmtKepsek] = useState("");
  
  // Sertifikasi details
  const [sertifikasi, setSertifikasi] = useState<"Ya" | "Belum">("Belum");
  const [mapelSertifikasi, setMapelSertifikasi] = useState("");
  const [mapelSertifikasiLainnya, setMapelSertifikasiLainnya] = useState("");
  
  // Kontak
  const [noHp, setNoHp] = useState("");

  // UX states
  const [loading, setLoading] = useState(false);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);

  // Reset or fill form when modal opens or edits
  useEffect(() => {
    if (!isOpen) return;

    if (gtkToEdit) {
      // Setup edit values
      setRowNumber(String(gtkToEdit.rowNumber || ""));
      setId(gtkToEdit.ID || "");
      setKecamatan(gtkToEdit.Kecamatan);
      setSekolah(gtkToEdit.Sekolah);
      setNama(gtkToEdit.Nama);
      setNik(gtkToEdit.NIK);
      setStatusPegawai(gtkToEdit.Status_Pegawai);
      setNip(gtkToEdit.NIP);
      setGolongan(gtkToEdit.Golongan);
      setTmtGolongan(gtkToEdit.TMT_Golongan_Formatted);
      setTmtKgbTerakhir(gtkToEdit.TMT_KGB_Terakhir_Formatted || "");
      setJabatan(gtkToEdit.Jabatan);
      setPendidikan(gtkToEdit.Pendidikan);
      setNoHp(gtkToEdit.No_HP ? String(gtkToEdit.No_HP).replace(/^62/, "0") : "");
      
      // Parse Beban Tugas
      let dbBeban = gtkToEdit.Beban_Tugas || "";
      if (dbBeban === "Guru PAI") dbBeban = "Guru Mapel - PAI";
      if (dbBeban === "Guru PJOK") dbBeban = "Guru Mapel - PJOK";
      if (dbBeban === "Guru Bahasa Inggris") dbBeban = "Guru Mapel - Bahasa Inggris";

      if (dbBeban.startsWith("Guru Mapel - ")) {
        setBebanTugas("Guru Mapel");
        const jenis = dbBeban.replace("Guru Mapel - ", "");
        const predefined = ["PAI", "PJOK", "Bahasa Inggris", "IPA", "IPS", "Seni Budaya", "Informatika", "Bahasa Indonesia", "PKn", "Prakarya", "BK"];
        if (predefined.includes(jenis)) {
          setJenisMapel(jenis);
          setJenisMapelLainnya("");
        } else {
          setJenisMapel("Lainnya");
          setJenisMapelLainnya(jenis);
        }
      } else {
        setBebanTugas(dbBeban);
        setJenisMapel("");
        setJenisMapelLainnya("");
      }

      setTmtKepsek(gtkToEdit.TMT_Kepsek_Formatted || "");
      setSertifikasi(gtkToEdit.Sertifikasi || "Belum");

      const predefinedMapels = [
        "", "Guru Kelas SD", "Guru Kelas TK", "PAI", "PJOK", "Bahasa Inggris",
        "Seni Budaya", "Bahasa Indonesia", "Informatika", "IPS", "IPA",
        "Pendidikan Pancasila", "Matematika", "Bimbingan dan Konseling",
        "Geografi", "Ekonomi", "Sosiologi", "Antropologi",
        "Fisika", "Kimia", "Biologi", "Sejarah"
      ];
      if (predefinedMapels.includes(gtkToEdit.Mapel)) {
        setMapelSertifikasi(gtkToEdit.Mapel);
        setMapelSertifikasiLainnya("");
      } else {
        setMapelSertifikasi(gtkToEdit.Mapel ? "Lainnya" : "");
        setMapelSertifikasiLainnya(gtkToEdit.Mapel || "");
      }
    } else {
      // Clear forms for standard creation
      setRowNumber("");
      setId("");
      setNama("");
      setNik("");
      setStatusPegawai("");
      setNip("");
      setGolongan("");
      setTmtGolongan("");
      setTmtKgbTerakhir("");
      setJabatan("");
      setPendidikan("");
      setBebanTugas("");
      setJenisMapel("");
      setJenisMapelLainnya("");
      setTmtKepsek("");
      setSertifikasi("Belum");
      setMapelSertifikasi("");
      setMapelSertifikasiLainnya("");
      setNoHp("");

      if (isDinas) {
        setKecamatan("");
        setSekolah("");
      } else {
        // Preset with current School context
        const [schKec, schName] = viewerIdentifier.split("|");
        setKecamatan(schKec);
        setSekolah(schName);
      }
    }
  }, [isOpen, gtkToEdit, viewerIdentifier, isDinas]);

  // Adjust school options inside dynamic selectors
  useEffect(() => {
    if (kecamatan) {
      setFilteredSchools(schools.filter(s => s.kec === kecamatan));
    } else {
      setFilteredSchools([]);
    }
  }, [kecamatan, schools]);

  const handleStatusChange = (val: "PNS" | "PPPK" | "PPPKPW" | "Honorer" | "") => {
    setStatusPegawai(val);
    if (val === "Honorer" || val === "PPPKPW") {
      setGolongan("");
      setTmtGolongan("");
      setTmtKgbTerakhir("");
      if (val === "Honorer") setJabatan("");
    } else if (val === "PPPK") {
      setGolongan("IX");
      setTmtKgbTerakhir("");
    } else if (val === "PNS") {
      setGolongan("");
    }
  };

  const isTeacher = ["Kepala Sekolah", "PLT. Kepala Sekolah", "Guru Kelas", "Guru Kelas TK", "Guru Mapel", "Guru BK"].includes(bebanTugas);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Data validations
    if (!nama.trim()) return alert("Nama Lengkap wajib diisi.");
    if (nik.length !== 16) return alert("NIK wajib terdiri dari 16 digit angka.");
    if (!statusPegawai) return alert("Pilih Status Kepegawaian.");

    if (["PNS", "PPPK", "PPPKPW"].includes(statusPegawai) && nip.length !== 18) {
      return alert("NIP wajib 18 digit untuk PNS/PPPK.");
    }

    let finalBeban = bebanTugas;
    if (bebanTugas === "Guru Mapel") {
      const jMapel = jenisMapel === "Lainnya" ? jenisMapelLainnya : jenisMapel;
      if (!jMapel) return alert("Tentukan Jenis Mapel.");
      finalBeban = `Guru Mapel - ${jMapel}`;
    }

    let finalMapel = "";
    if (isTeacher && sertifikasi === "Ya") {
      finalMapel = mapelSertifikasi === "Lainnya" ? mapelSertifikasiLainnya : mapelSertifikasi;
      if (!finalMapel) return alert("Isi Mapel Sertifikasi.");
    }

    let cleanHp = noHp.trim();
    if (cleanHp.startsWith("0")) {
      cleanHp = "62" + cleanHp.substring(1);
    }

    setLoading(true);

    const payload = {
      id,
      kecamatan,
      sekolah,
      nama,
      nik,
      statusPegawai,
      nip,
      golongan,
      tmtGolongan: (statusPegawai === "Honorer" || statusPegawai === "PPPKPW") ? "" : tmtGolongan,
      tmtKgbTerakhir: statusPegawai === "PNS" ? tmtKgbTerakhir : "",
      jabatan: (statusPegawai === "Honorer") ? "" : jabatan,
      pendidikan,
      bebanTugas: finalBeban,
      tmtKepsek: bebanTugas === "Kepala Sekolah" ? tmtKepsek : "",
      sertifikasi: isTeacher ? sertifikasi : "Belum",
      mapel: finalMapel,
      hp: cleanHp,
      rowNumber
    };

    try {
      const resp = await fetch("/api/gtk/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        alert(data.message);
        onSaveSuccess();
        onClose();
      } else {
        alert(data.message || "Gagal menyimpan data Personnel.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kegagalan koneksi saat menyimpan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="bg-zinc-900 px-6 py-4 flex justify-between items-center text-white border-b border-zinc-800">
          <h3 className="text-base font-bold text-white tracking-tight">
            {gtkToEdit ? "Edit Data Personel PTK" : "Tambah Data Personel PTK"}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="px-6 py-5 overflow-y-auto max-h-[70vh] space-y-4">
            
            {/* Dynamic location selecting (Dinas level select, school preset) */}
            {isDinas ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/80">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Kecamatan</label>
                  <select
                    value={kecamatan}
                    onChange={(e) => {
                      setKecamatan(e.target.value);
                      setSekolah("");
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-350 focus:border-emerald-505/50 font-semibold"
                    required
                  >
                    <option value="">-- PILIH KECAMATAN --</option>
                    {kecamatans.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Sekolah</label>
                  <select
                    value={sekolah}
                    onChange={(e) => setSekolah(e.target.value)}
                    disabled={!kecamatan}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-350 focus:border-emerald-505/50 font-semibold disabled:bg-zinc-900/40 disabled:text-zinc-650"
                    required
                  >
                    <option value="">-- PILIH SEKOLAH --</option>
                    {filteredSchools.map(s => (
                      <option key={s.id} value={s.nama}>{s.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-950/15 p-3 rounded-lg text-xs border border-emerald-900/35 text-emerald-450 font-semibold uppercase tracking-wide">
                Pendaftaran data baru otomatis disinkronkan untuk: <span className="text-white block mt-0.5">{sekolah} ({kecamatan})</span>
              </div>
            )}

            {/* Identitas utama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Nama Lengkap (Beserta Gelar)</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-emerald-555 font-semibold placeholder:text-zinc-700"
                  placeholder="Contoh: IRA INDIRA, S.Pd., M.Pd"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">NIK (16 Digit)</label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, "").substring(0, 16))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-emerald-555 font-mono placeholder:text-zinc-700"
                  placeholder="Contoh: 7302XXXXXXXXXXXX"
                  maxLength={16}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Status Kepegawaian</label>
                <select
                  value={statusPegawai}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 focus:border-emerald-555 font-semibold"
                  required
                >
                  <option value="">-- PILIH STATUS --</option>
                  <option value="PNS">PNS</option>
                  <option value="PPPK">PPPK</option>
                  <option value="PPPKPW">PPPKPW</option>
                  <option value="Honorer">Honorer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">NIP (18 Digit)</label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value.replace(/\D/g, "").substring(0, 18))}
                  disabled={statusPegawai === "Honorer" || !statusPegawai}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-emerald-555 font-mono placeholder:text-zinc-700 disabled:bg-zinc-900/40 disabled:text-zinc-650"
                  placeholder="PNS/PPPK 18 Digit murni"
                  maxLength={18}
                />
              </div>
            </div>

            {/* Pangkat & Jabatan (Conditional) */}
            {statusPegawai && statusPegawai !== "Honorer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-800 pt-3 bg-zinc-950/20 p-3 rounded-lg border border-zinc-850/50">
                
                {statusPegawai === "PNS" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Pangkat/Gol. Ruang</label>
                      <select
                        value={golongan}
                        onChange={(e) => setGolongan(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                        required
                      >
                        <option value="">-- Pilih --</option>
                        {["II/a", "II/b", "II/c", "II/d", "III/a", "III/b", "III/c", "III/d", "IV/a", "IV/b", "IV/c", "IV/d", "IV/e"].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">TMT Pangkat/Golongan</label>
                      <input
                        type="date"
                        value={tmtGolongan}
                        onChange={(e) => setTmtGolongan(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 font-semibold cursor-pointer"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">TMT KGB TERAKHIR</label>
                      <input
                        type="date"
                        value={tmtKgbTerakhir}
                        onChange={(e) => setTmtKgbTerakhir(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 font-semibold cursor-pointer"
                      />
                    </div>
                  </>
                )}

                {statusPegawai === "PPPK" && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Tingkatan PPPK (I - XVII)</label>
                      <select
                        value={golongan}
                        onChange={(e) => setGolongan(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                        required
                      >
                        {["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII"].map(g => (
                          <option key={g} value={g}>Golongan {g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">TMT Golongan</label>
                      <input
                        type="date"
                        value={tmtGolongan}
                        onChange={(e) => setTmtGolongan(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 font-semibold cursor-pointer"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Jabatan Fungsional</label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                    required
                  >
                    <option value="">-- Pilih --</option>
                    <option value="Guru Ahli Pertama">Guru Ahli Pertama</option>
                    <option value="Guru Ahli Muda">Guru Ahli Muda</option>
                    <option value="Guru Ahli Madya">Guru Ahli Madya</option>
                    <option value="Guru Ahli Utama">Guru Ahli Utama</option>
                    <option value="Operator Layanan Operasional">Operator Layanan Operasional</option>
                    <option value="Pengelola Layanan Operasional">Pengelola Layanan Operasional</option>
                    <option value="Penata Layanan Operasional">Penata Layanan Operasional</option>
                  </select>
                </div>
              </div>
            )}

            {/* Pendidikan & Beban Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-800 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Pendidikan Terakhir</label>
                <select
                  value={pendidikan}
                  onChange={(e) => setPendidikan(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                  required
                >
                  <option value="">-- Pilih --</option>
                  {["SD", "SMP", "SMA", "D1", "D2", "D3", "D4", "S1", "S2", "S3"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Beban Tugas</label>
                <select
                  value={bebanTugas}
                  onChange={(e) => setBebanTugas(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                  required
                >
                  <option value="">-- Pilih --</option>
                  <option value="Kepala Sekolah">Kepala Sekolah</option>
                  <option value="PLT. Kepala Sekolah">PLT. Kepala Sekolah</option>
                  <option value="Guru Kelas">Guru Kelas</option>
                  <option value="Guru Kelas TK">Guru Kelas TK</option>
                  <option value="Guru Mapel">Guru Mapel</option>
                  <option value="Guru BK">Guru BK</option>
                  <option value="Kepala Tata Usaha (TU)">Kepala Tata Usaha (TU)</option>
                  <option value="Staf Administrasi (TU)">Staf Administrasi (TU)</option>
                  <option value="Laboran">Laboran</option>
                  <option value="Pustakawan">Pustakawan</option>
                  <option value="Operator Sekolah">Operator Sekolah</option>
                  <option value="Bujang Sekolah">Bujang Sekolah</option>
                  <option value="Petugas Kebersihan">Petugas Kebersihan</option>
                  <option value="Satpam">Satpam</option>
                </select>
              </div>
            </div>

            {/* Sub-beban conditional arrays (TMT Kepsek, Mapel, Jenis Mapel) */}
            {bebanTugas === "Kepala Sekolah" && (
              <div className="animate-fade-in">
                <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">TMT Jabatan Kepala Sekolah</label>
                <input
                  type="date"
                  value={tmtKepsek}
                  onChange={(e) => setTmtKepsek(e.target.value)}
                  onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                  onFocus={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 font-semibold cursor-pointer"
                  required
                />
              </div>
            )}

            {bebanTugas === "Guru Mapel" && (
              <div className="p-3 bg-amber-950/15 rounded-lg border border-amber-900/40 flex gap-4 text-xs font-medium animate-fade-in">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Jenis Mapel</label>
                  <select
                    value={jenisMapel}
                    onChange={(e) => setJenisMapel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-zinc-350 font-semibold font-bold"
                    required
                  >
                    <option value="">-- Pilih --</option>
                    {["PAI", "PJOK", "Bahasa Inggris", "IPA", "IPS", "Seni Budaya", "Informatika", "Bahasa Indonesia", "PKn", "Prakarya", "BK", "Lainnya"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {jenisMapel === "Lainnya" && (
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Isi Mapel Lainnya</label>
                    <input
                      type="text"
                      value={jenisMapelLainnya}
                      onChange={(e) => setJenisMapelLainnya(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-xs text-white focus:border-emerald-555 font-semibold"
                      placeholder="Contoh: Muatan Lokal"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* Sertifikasi Details */}
            {isTeacher && (
              <div className="border-t border-zinc-800 pt-3 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Perolehan Sertifikasi</label>
                  <select
                    value={sertifikasi}
                    onChange={(e) => setSertifikasi(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                    required
                  >
                    <option value="Belum">Belum Sertifikasi</option>
                    <option value="Ya">Sudah Sertifikasi ('Ya')</option>
                  </select>
                </div>

                {sertifikasi === "Ya" && (
                  <div className="flex-1 flex gap-2 animate-fade-in">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Mata Pelajaran Sertifikasi</label>
                      <select
                        value={mapelSertifikasi}
                        onChange={(e) => setMapelSertifikasi(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-350 font-semibold"
                        required
                      >
                        <option value="">-- Pilih --</option>
                        {["Guru Kelas SD", "Guru Kelas TK", "PAI", "PJOK", "Bahasa Inggris", "Seni Budaya", "Bahasa Indonesia", "Informatika", "IPS", "IPA", "Pendidikan Pancasila", "Matematika", "Bimbingan dan Konseling", "Geografi", "Ekonomi", "Sosiologi", "Antropologi", "Fisika", "Kimia", "Biologi", "Sejarah", "Lainnya"].map(mapel => (
                          <option key={mapel} value={mapel}>{mapel}</option>
                        ))}
                      </select>
                    </div>
                    {mapelSertifikasi === "Lainnya" && (
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Mata Pelajaran Lain</label>
                        <input
                          type="text"
                          value={mapelSertifikasiLainnya}
                          onChange={(e) => setMapelSertifikasiLainnya(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:border-emerald-555 font-semibold"
                          placeholder="Masukkan nama mapel"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* WhatsApp Kontak */}
            <div className="border-t border-zinc-800 pt-3">
              <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">No. HP / WhatsApp (Aktif)</label>
              <input
                id="gtk-phone-input"
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 085xxxxxxxxx"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-xs text-white focus:border-emerald-555 font-mono placeholder:text-zinc-700"
                required
              />
            </div>

          </div>

          {/* Controls */}
          <div className="bg-zinc-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-zinc-800/80">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="bg-zinc-850/80 border border-zinc-750 text-zinc-300 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-zinc-750 transition tracking-wider cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-555 text-white px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Data</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
