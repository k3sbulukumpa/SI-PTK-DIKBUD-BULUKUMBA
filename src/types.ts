export interface School {
  id: string;
  kec: string;
  nama: string;
}

export interface GtkItem {
  ID: string;
  Kecamatan: string;
  Sekolah: string;
  Nama: string;
  NIP: string;
  Status_Pegawai: 'PNS' | 'PPPK' | 'PPPKPW' | 'Honorer';
  NIK: string;
  Golongan: string;
  TMT_Golongan_Formatted: string;
  Jabatan: string;
  Pendidikan: string;
  Beban_Tugas: string;
  TMT_Kepsek_Formatted: string;
  Sertifikasi: 'Ya' | 'Belum';
  Mapel: string;
  No_HP: string;
  rowNumber?: number;
  isPensiun?: boolean;
  isMendekatiPensiun?: boolean;
  telatNaikPangkat?: boolean;
  TMT_KGB_Terakhir_Formatted?: string;
  telatKgb?: boolean;
  akanKgb?: boolean;
  kgbWarningMessage?: string;
}

export interface UserSession {
  role: 'Admin Dinas' | 'Sekolah';
  identifier: string; // 'admin' or 'Kecamatan|Nama Sekolah'
}

export interface DbStatus {
  status: 'connected' | 'fallback';
  message: string;
  url: string;
}
