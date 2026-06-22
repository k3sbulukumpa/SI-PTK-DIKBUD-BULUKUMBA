import React, { useState } from "react";
import { DbStatus } from "../types";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy, Terminal } from "lucide-react";

interface DbAlertProps {
  status: DbStatus | null;
  onRefresh: () => void;
}

export const DbAlert: React.FC<DbAlertProps> = ({ status, onRefresh }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!status) return null;

  const isLocal = status.status === "fallback";

  const sqlCode = `-- 1. Table: sekolah_db (Database Sekolah)
CREATE TABLE IF NOT EXISTS sekolah_db (
    id TEXT PRIMARY KEY,
    kecamatan TEXT NOT NULL,
    nama_sekolah TEXT NOT NULL
);

-- 2. Table: pengguna_db (Database Kredensial Pengguna)
CREATE TABLE IF NOT EXISTS pengguna_db (
    role TEXT NOT NULL,
    identifier TEXT PRIMARY KEY, -- 'admin' atau 'Kecamatan|Nama Sekolah'
    password TEXT NOT NULL
);

-- 3. Table: gtk_data (Database Personel GTK)
CREATE TABLE IF NOT EXISTS gtk_data (
    id TEXT PRIMARY KEY,
    kecamatan TEXT NOT NULL,
    sekolah TEXT NOT NULL,
    nama TEXT NOT NULL,
    nip TEXT,
    status_pegawai TEXT NOT NULL,
    nik TEXT NOT NULL,
    golongan TEXT,
    tmt_golongan TEXT,
    tmt_kgb_terakhir TEXT,
    jabatan TEXT,
    pendidikan TEXT NOT NULL,
    beban_tugas TEXT NOT NULL,
    tmt_kepsek TEXT,
    sertifikasi TEXT DEFAULT 'Belum',
    mapel TEXT,
    no_hp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed defaults
INSERT INTO sekolah_db (id, kecamatan, nama_sekolah) VALUES
('id-sek-satu', 'KEC. BULUKUMPA', 'SDN 58 TANETE'),
('id-sek-dua', 'KEC. BULUKUMPA', 'SDN 59 TANETE')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pengguna_db (role, identifier, password) VALUES
('Admin Dinas', 'admin', 'ammatoa'),
('Sekolah', 'KEC. BULUKUMPA|SDN 58 TANETE', 'dikerja'),
('Sekolah', 'KEC. BULUKUMPA|SDN 59 TANETE', 'dikerja')
ON CONFLICT (identifier) DO NOTHING;

-- 4. NONAKTIFKAN Row Level Security (RLS) di Supabase agar bisa tulis/baca
ALTER TABLE sekolah_db DISABLE ROW LEVEL SECURITY;
ALTER TABLE pengguna_db DISABLE ROW LEVEL SECURITY;
ALTER TABLE gtk_data DISABLE ROW LEVEL SECURITY;

-- Berikan hak akses penuh ke role anon dan service_role
GRANT ALL ON TABLE sekolah_db TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE pengguna_db TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE gtk_data TO postgres, anon, authenticated, service_role;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-b ${isLocal ? "bg-amber-950/20 border-amber-500/10 text-amber-300" : "bg-emerald-950/20 border-emerald-500/10 text-emerald-300"} px-4 py-2.5 border-stone-850 shadow-sm`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-semibold">
        <div className="flex items-center gap-2.5">
          {isLocal ? (
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0" />
          )}
          <div>
            <span className="font-extrabold uppercase tracking-wide text-[10px] px-1.5 py-0.5 rounded bg-black/30 mr-1.5">
              {isLocal ? "OFFLINE DEMO" : "SUPABASE AKTIF"}
            </span>{" "}
            <span className="text-stone-300">{status.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition duration-150 cursor-pointer ${isLocal ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"} border border-transparent`}
          >
            Pindai Koneksi
          </button>
          
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[11px] underline font-semibold cursor-pointer opacity-80 hover:opacity-100"
          >
            {isLocal ? "Petunjuk Setup" : "Lihat SQL Setup"} {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-7xl mx-auto mt-4 p-4 rounded-xl bg-stone-900 border border-stone-800 text-stone-100 font-sans shadow-xl text-xs">
          <div className="flex justify-between items-center mb-3 border-b border-stone-800 pb-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-500 font-mono font-bold">
              <Terminal className="h-4 w-4" />
              <span>SETUP TABEL DI SQL EDITOR SUPABASE</span>
            </div>
            <button
              onClick={copySqlToClipboard}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-stone-800 border border-stone-700 hover:bg-stone-750 text-xs text-stone-300 hover:text-white transition cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{copied ? "Tersalin!" : "Salin SQL"}</span>
            </button>
          </div>

          <p className="text-stone-400 text-xs leading-relaxed mb-3">
            Agar database Supabase real berfungsi, buat tabel di bawah ini di <b>SQL Editor Supabase Anda</b>, kemudian masukkan kredensial di panel <b>Secrets</b> Google AI Studio sebagai berikut: <br />
            <code className="text-amber-400 px-1 py-0.5 bg-stone-950 rounded border border-stone-800 font-mono">SUPABASE_URL</code> dan{" "}
            <code className="text-amber-400 px-1 py-0.5 bg-stone-950 rounded border border-stone-800 font-mono">SUPABASE_SERVICE_ROLE_KEY</code> (atau <code className="text-amber-400 px-1 py-0.5 bg-stone-950 rounded border border-stone-800 font-mono">SUPABASE_ANON_KEY</code>).
          </p>

          <p className="text-rose-400 text-xs leading-relaxed mb-3 font-semibold">
            ⚠️ PENTING: Jika data tidak tersimpan atau tidak berubah, pastikan perintah <code className="text-rose-300 font-mono">DISABLE ROW LEVEL SECURITY</code> di bawah ini telah dijalankan pada SQL Editor Supabase untuk memperbolehkan aplikasi menyimpan data.
          </p>

          <pre className="text-[11px] font-mono p-3 rounded bg-black text-emerald-400 border border-stone-800 overflow-x-auto max-h-56 leading-relaxed">
            {sqlCode}
          </pre>
        </div>
      )}
    </div>
  );
};

