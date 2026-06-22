-- SQL Script to set up tables in Supabase for SI PTK DIKBUD --

-- 1. Table: sekolah_db (Database Sekolah)
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

-- Insert Seed Data (Default Accounts & sample schools to match Google Sheets structure)

-- Seed Sekolah_db
INSERT INTO sekolah_db (id, kecamatan, nama_sekolah) VALUES
('id-sek-satu', 'KEC. BULUKUMPA', 'SDN 58 TANETE'),
('id-sek-dua', 'KEC. BULUKUMPA', 'SDN 59 TANETE')
ON CONFLICT (id) DO NOTHING;

-- Seed Pengguna_db
INSERT INTO pengguna_db (role, identifier, password) VALUES
('Admin Dinas', 'admin', 'ammatoa'),
('Sekolah', 'KEC. BULUKUMPA|SDN 58 TANETE', 'dikerja'),
('Sekolah', 'KEC. BULUKUMPA|SDN 59 TANETE', 'dikerja')
ON CONFLICT (identifier) DO NOTHING;

-- Seed Gtk_data (Sample record from user prompt)
INSERT INTO gtk_data (id, kecamatan, sekolah, nama, nip, status_pegawai, nik, golongan, tmt_golongan, jabatan, pendidikan, beban_tugas, tmt_kepsek, sertifikasi, mapel, no_hp) VALUES
('ID178069900785899', 'KEC. BULUKUMPA', 'SDN 58 TANETE', 'IRA INDIRA, S.Pd., M.Pd', '197601152002122005', 'PNS', '7302075501760004', 'IV/b', '2023-04-01', 'Guru Ahli Madya', 'S2', 'Guru Kelas', '', 'Ya', 'Guru Kelas SD', '6281342685961')
ON CONFLICT (id) DO NOTHING;

-- 4. Disable Row Level Security (RLS) to ensure full read/write access for SI PTK
ALTER TABLE IF EXISTS sekolah_db DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pengguna_db DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gtk_data DISABLE ROW LEVEL SECURITY;

-- Grant permissions to public roles just in case
GRANT ALL ON TABLE sekolah_db TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE pengguna_db TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE gtk_data TO postgres, anon, authenticated, service_role;

