import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to locally persisted file database when Supabase is not configured
const LOCAL_DB_PATH = path.join(process.cwd(), "database_fallback.json");

// Helper to initialize local backup database
const initLocalDb = () => {
  if (!fs.existsSync(LOCAL_DB_PATH)) {
    const defaultData = {
      sekolah_db: [
        { id: "id-sek-satu", kecamatan: "KEC. BULUKUMPA", nama_sekolah: "SDN 58 TANETE" },
        { id: "id-sek-dua", kecamatan: "KEC. BULUKUMPA", nama_sekolah: "SDN 59 TANETE" }
      ],
      pengguna_db: [
        { role: "Admin Dinas", identifier: "admin", password: "ammatoa" },
        { role: "Sekolah", identifier: "KEC. BULUKUMPA|SDN 58 TANETE", password: "dikerja" },
        { role: "Sekolah", identifier: "KEC. BULUKUMPA|SDN 59 TANETE", password: "dikerja" }
      ],
      gtk_data: [
        {
          id: "ID178069900785899",
          kecamatan: "KEC. BULUKUMPA",
          sekolah: "SDN 58 TANETE",
          nama: "IRA INDIRA, S.Pd., M.Pd",
          nip: "197601152002122005",
          status_pegawai: "PNS",
          nik: "7302075501760004",
          golongan: "IV/b",
          tmt_golongan: "2023-04-01",
          jabatan: "Guru Ahli Madya",
          pendidikan: "S2",
          beban_tugas: "Guru Kelas SD",
          tmt_kepsek: "",
          sertifikasi: "Ya",
          mapel: "Guru Kelas SD",
          no_hp: "6281342685961",
          created_at: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultData, null, 2), "utf8");
  }
};

initLocalDb();

// Read and write helpers for fallback DB
const readLocalDb = () => {
  try {
    initLocalDb();
    const raw = fs.readFileSync(LOCAL_DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.log("Note: error reading local db file:", err);
    return { sekolah_db: [], pengguna_db: [], gtk_data: [] };
  }
};

const writeLocalDb = (data: any) => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.log("Note: error writing local db file:", err);
  }
};

// Supabase Lazy Initialization
let supabaseClient: any = null;
const isSupabaseConfigured = () => {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
};

const getSupabase = () => {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseClient) {
    let url = process.env.SUPABASE_URL!.trim();
    // Sanitize trailing slashes or endpoint suffix
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    if (url.includes("/rest/v1")) {
      url = url.split("/rest/v1")[0];
    }
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }

    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false
      }
    });
  }
  return supabaseClient;
};

// ==========================================
// API ENDPOINTS
// ==========================================

// Endpoint to inspect if Supabase is active
app.get("/api/db-status", (req, res) => {
  const active = isSupabaseConfigured();
  res.json({
    status: active ? "connected" : "fallback",
    message: active 
      ? "Terhubung ke Supabase Production Database" 
      : "Menggunakan database lokal demo (database_fallback.json). Sila masukkan variabel lingkungan SUPABASE_URL & SUPABASE_ANON_KEY di panel Secrets AI Studio untuk beralih ke klaster Supabase riil.",
    url: process.env.SUPABASE_URL || "Belum Dikonfigurasi"
  });
});

// authentication endpoint
app.post("/api/login", async (req, res) => {
  const { role, identifier, password } = req.body;
  if (!role || !identifier || !password) {
    return res.status(400).json({ success: false, message: "Kredensial tidak lengkap!" });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("pengguna_db")
        .select("*")
        .eq("role", role)
        .eq("identifier", identifier)
        .eq("password", String(password))
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return res.json({ success: true, role, identifier });
      }
    } catch (err: any) {
      console.log("Supabase login status check (falling back to local if not seeded/configured):", err?.message || err);
      // Fallback on error if requested
    }
  }

  // Backup Local look-up
  const db = readLocalDb();
  const found = db.pengguna_db.find(
    (u: any) => u.role === role && u.identifier === identifier && String(u.password) === String(password)
  );

  if (found) {
    return res.json({ success: true, role, identifier });
  }

  return res.json({ success: false, message: "Username/Sekolah atau Password salah!" });
});

// Update password directly (School role)
app.post("/api/change-password", async (req, res) => {
  const { identifier, oldPass, newPass } = req.body;
  if (!identifier || !oldPass || !newPass) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: userRecord, error: selectErr } = await supabase
        .from("pengguna_db")
        .select("*")
        .eq("role", "Sekolah")
        .eq("identifier", identifier)
        .eq("password", String(oldPass))
        .maybeSingle();

      if (selectErr) throw selectErr;
      if (!userRecord) {
        return res.json({ success: false, message: "Password lama tidak sesuai!" });
      }

      const { error: updateErr } = await supabase
        .from("pengguna_db")
        .update({ password: String(newPass) })
        .eq("identifier", identifier);

      if (updateErr) throw updateErr;
      return res.json({ success: true, message: "Password berhasil diubah." });
    } catch (err: any) {
      console.log("Supabase password change info / fallback state:", err?.message || err);
    }
  }

  // Fallback Local
  const db = readLocalDb();
  const index = db.pengguna_db.findIndex(
    (u: any) => u.role === "Sekolah" && u.identifier === identifier && String(u.password) === String(oldPass)
  );

  if (index !== -1) {
    db.pengguna_db[index].password = String(newPass);
    writeLocalDb(db);
    return res.json({ success: true, message: "Password berhasil diubah (Local Database)." });
  }

  return res.json({ success: false, message: "Password lama tidak sesuai!" });
});

// GetDropdownData (Kecamatan list and Sekolah list)
app.get("/api/dropdown-data", async (req, res) => {
  const supabase = getSupabase();
  let rawKecamatans: string[] = [];
  let rawSekolahs: any[] = [];

  if (supabase) {
    try {
      const { data: sekolahs, error } = await supabase
        .from("sekolah_db")
        .select("*");

      if (error) throw error;
      if (sekolahs) {
        rawSekolahs = sekolahs.map(s => ({ id: s.id, kec: s.kecamatan, nama: s.nama_sekolah }));
        rawKecamatans = Array.from(new Set(sekolahs.map((s: any) => s.kecamatan)));
      }
    } catch (e: any) {
      console.log("Supabase fetch schools notice (using local file fallback since tables are not yet seeded in user Supabase):", e?.message || e);
    }
  }

  if (rawSekolahs.length === 0) {
    const db = readLocalDb();
    rawSekolahs = db.sekolah_db.map((s: any) => ({ id: s.id, kec: s.kecamatan, nama: s.nama_sekolah }));
    rawKecamatans = Array.from(new Set(db.sekolah_db.map((s: any) => s.kecamatan)));
  }

  res.json({
    kecamatans: rawKecamatans.sort(),
    sekolahs: rawSekolahs.sort((a, b) => a.nama.localeCompare(b.nama))
  });
});

// Get all GTK data for tables (with dynamic analyses)
app.post("/api/gtk/list", async (req, res) => {
  const { role, identifier } = req.body;
  const supabase = getSupabase();
  let list: any[] = [];

  if (supabase) {
    try {
      let allRows: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("gtk_data")
          .select("*")
          .order("nama", { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (role === "Sekolah") {
          const [kec, sek] = (identifier || "").split("|");
          query = query.eq("kecamatan", kec).eq("sekolah", sek);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allRows = [...allRows, ...data];
          if (data.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      if (allRows.length > 0) {
        list = allRows.map((d: any, index: number) => ({
          ID: d.id || d.nik || `gtk-${index}`,
          Kecamatan: d.kecamatan,
          Sekolah: d.sekolah,
          Nama: d.nama,
          NIP: d.nip || "",
          Status_Pegawai: d.status_pegawai,
          NIK: d.nik,
          Golongan: d.golongan || "",
          TMT_Golongan_Formatted: d.tmt_golongan || "",
          TMT_KGB_Terakhir_Formatted: d.tmt_kgb_terakhir || "",
          Jabatan: d.jabatan || "",
          Pendidikan: d.pendidikan,
          Beban_Tugas: d.beban_tugas,
          TMT_Kepsek_Formatted: d.tmt_kepsek || "",
          Sertifikasi: d.sertifikasi || "Belum",
          Mapel: d.mapel || "",
          No_HP: d.no_hp
        }));
      }
    } catch (e: any) {
      console.log("Supabase fetch GTK notice (using local file fallback since table 'gtk_data' does not exist in user Supabase yet):", {
        message: e?.message || e,
        code: e?.code,
        details: e?.details,
        hint: e?.hint
      });
    }
  }

  if (list.length === 0) {
    const db = readLocalDb();
    list = db.gtk_data.map((d: any) => ({
      ID: d.id,
      Kecamatan: d.kecamatan,
      Sekolah: d.sekolah,
      Nama: d.nama,
      NIP: d.nip || "",
      Status_Pegawai: d.status_pegawai,
      NIK: d.nik,
      Golongan: d.golongan || "",
      TMT_Golongan_Formatted: d.tmt_golongan || "",
      TMT_KGB_Terakhir_Formatted: d.tmt_kgb_terakhir || "",
      Jabatan: d.jabatan || "",
      Pendidikan: d.pendidikan,
      Beban_Tugas: d.beban_tugas,
      TMT_Kepsek_Formatted: d.tmt_kepsek || "",
      Sertifikasi: d.sertifikasi || "Belum",
      Mapel: d.mapel || "",
      No_HP: d.no_hp
    }));

    if (role === "Sekolah" && identifier) {
      const [kec, sek] = identifier.split("|");
      list = list.filter((item: any) => item.Kecamatan === kec && item.Sekolah === sek);
    }
  }

  // Apply analyzes for pension and promotions dynamically
  const today = new Date();
  const processedList = list.map((item, idx) => {
    let isPensiun = false;
    let isMendekatiPensiun = false;
    let telatNaikPangkat = false;

    // Promotion calculations
    if (item.TMT_Golongan_Formatted) {
      try {
        const tmtDate = new Date(item.TMT_Golongan_Formatted);
        const diffYears = (today.getTime() - tmtDate.getTime()) / (1000 * 3600 * 24 * 365.25);
        if (diffYears > 4) telatNaikPangkat = true;
      } catch (e) {}
    }

    // Pension calculation
    const nipStr = (item.NIP || "").toString().trim();
    if (nipStr.length >= 8 && (item.Status_Pegawai === "PNS" || item.Status_Pegawai.includes("PPPK"))) {
      const year = parseInt(nipStr.substring(0, 4), 10);
      const month = parseInt(nipStr.substring(4, 6), 10) - 1;
      const day = parseInt(nipStr.substring(6, 8), 10);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        let batasUmur = 58;
        const guruKeywords = ["Guru", "Kepala Sekolah"];
        if (guruKeywords.some(kw => item.Beban_Tugas && item.Beban_Tugas.includes(kw))) {
          batasUmur = 60;
        }

        const pensionDate = new Date(year + batasUmur, month, day);
        const timeDiff = pensionDate.getTime() - today.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        if (daysDiff <= 0) {
          isPensiun = true;
        } else if (daysDiff <= 365) {
          isMendekatiPensiun = true;
        }
      }
    }

    let telatKgb = false;
    let akanKgb = false;
    let kgbWarningMessage = "";

    if (item.Status_Pegawai === "PNS" && item.TMT_KGB_Terakhir_Formatted) {
      try {
        const lastKgbDate = new Date(item.TMT_KGB_Terakhir_Formatted);
        if (!isNaN(lastKgbDate.getTime())) {
          const nextKgbDate = new Date(lastKgbDate);
          nextKgbDate.setFullYear(lastKgbDate.getFullYear() + 2);
          
          const timeDiff = nextKgbDate.getTime() - today.getTime();
          const daysDiff = timeDiff / (1000 * 3600 * 24);
          
          if (daysDiff < 0) {
            telatKgb = true;
            kgbWarningMessage = "Telat KGB";
          } else if (daysDiff <= 91) {
            akanKgb = true;
            const remainingMonths = Math.ceil(daysDiff / 30.415);
            if (remainingMonths > 0 && remainingMonths <= 3) {
              kgbWarningMessage = `${remainingMonths} Bulan lagi KGB`;
            } else {
              kgbWarningMessage = "Segera KGB";
            }
          }
        }
      } catch (e) {}
    }

    return {
      ...item,
      rowNumber: idx + 2, // Dynamic row-number to keep compatibility
      isPensiun,
      isMendekatiPensiun,
      telatNaikPangkat,
      telatKgb,
      akanKgb,
      kgbWarningMessage
    };
  });

  res.json(processedList);
});

// Save or Update GTK data
app.post("/api/gtk/save", async (req, res) => {
  const {
    id,
    kecamatan,
    sekolah,
    nama,
    nik,
    statusPegawai,
    nip,
    golongan,
    tmtGolongan,
    jabatan,
    pendidikan,
    bebanTugas,
    tmtKepsek,
    sertifikasi,
    mapel,
    hp,
    rowNumber,
    tmtKgbTerakhir
  } = req.body;

  if (!kecamatan || !sekolah || !nama || !nik || !statusPegawai || !pendidikan || !bebanTugas || !hp) {
    return res.status(400).json({ success: false, message: "Data wajib tidak lengkap!" });
  }

  // Format HP
  let formattedHp = String(hp).trim();
  if (formattedHp.startsWith("0")) {
    formattedHp = "62" + formattedHp.substring(1);
  }

  const finalId = id || "ID" + Date.now() + Math.floor(Math.random() * 1000);

  const cleanDateVal = (val: any) => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    return s === "" ? null : s;
  };

  const dbRow = {
    id: finalId,
    kecamatan,
    sekolah,
    nama,
    nip: nip || "",
    status_pegawai: statusPegawai,
    nik,
    golongan: golongan || "",
    tmt_golongan: cleanDateVal(tmtGolongan),
    jabatan: jabatan || "",
    pendidikan,
    beban_tugas: bebanTugas,
    tmt_kepsek: cleanDateVal(tmtKepsek),
    sertifikasi: sertifikasi || "Belum",
    mapel: mapel || "",
    no_hp: formattedHp,
    tmt_kgb_terakhir: cleanDateVal(tmtKgbTerakhir),
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase
        .from("gtk_data")
        .upsert(dbRow, { onConflict: "id" });

      if (error) {
        return res.status(400).json({
          success: false,
          message: `Gagal menyimpan data ke Supabase: ${error.message}. Silakan periksa apakah tabel 'gtk_data' sudah dibuat di menu SQL Editor Supabase menggunakan kode yang ada di berkas 'supabase_setup.sql'.`
        });
      }
      return res.json({ success: true, message: id ? "Data GTK berhasil diupdate di Supabase." : "Data GTK berhasil ditambahkan ke Supabase." });
    } catch (e: any) {
      console.log("Supabase upsert GTK status error:", e?.message || e);
      return res.status(500).json({
        success: false,
        message: `Terjadi kendala koneksi ke database Supabase: ${e?.message || e}`
      });
    }
  }

  // Back up local update or insert
  const db = readLocalDb();
  const existingGtkIndex = db.gtk_data.findIndex((item: any) => item.id === finalId);

  if (existingGtkIndex !== -1) {
    db.gtk_data[existingGtkIndex] = { ...db.gtk_data[existingGtkIndex], ...dbRow };
    writeLocalDb(db);
    return res.json({ success: true, message: "Data GTK berhasil diupdate (Local Database fallback)." });
  } else {
    // Check if rowNumber was passed and if we could update using rowNumber as index helper
    if (rowNumber) {
      const indexByRowNumber = parseInt(rowNumber, 10) - 2;
      if (indexByRowNumber >= 0 && indexByRowNumber < db.gtk_data.length) {
        db.gtk_data[indexByRowNumber] = { ...db.gtk_data[indexByRowNumber], ...dbRow };
        writeLocalDb(db);
        return res.json({ success: true, message: "Data GTK berhasil diupdate (Local Database fallback)." });
      }
    }
    db.gtk_data.push(dbRow);
    writeLocalDb(db);
    return res.json({ success: true, message: "Data GTK berhasil ditambahkan (Local Database fallback)." });
  }
});

// Delete GTK record
app.post("/api/gtk/delete", async (req, res) => {
  const { id, rowNumber } = req.body;
  
  if (!id && !rowNumber) {
    return res.status(400).json({ success: false, message: "ID or rowNumber parameter is required." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      let targetId = id;
      if (!targetId && rowNumber) {
        // Find matching id by row index sequence
        const { data, error } = await supabase.from("gtk_data").select("id");
        if (error) {
          return res.status(400).json({ success: false, message: `Gagal membaca list data dari Supabase: ${error.message}` });
        }
        const targetRow = data?.[parseInt(rowNumber, 10) - 2];
        if (targetRow) {
          targetId = targetRow.id;
        }
      }

      if (targetId) {
        const { data, error } = await supabase
          .from("gtk_data")
          .delete()
          .eq("id", targetId)
          .select();
        
        if (error) {
          return res.status(400).json({ success: false, message: `Gagal menghapus data dari Supabase: ${error.message}` });
        }
        
        if (!data || data.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Gagal menghapus: Data tidak ditemukan atau akses Anda dibatasi oleh Row Level Security (RLS) di Supabase. Silakan nonaktifkan RLS untuk tabel 'gtk_data' menggunakan perintah DISABLE ROW LEVEL SECURITY.`
          });
        }
        
        return res.json({ success: true, message: "Data GTK berhasil dihapus dari Supabase." });
      }
    } catch (e: any) {
      console.log("Supabase delete GTK status error:", e?.message || e);
      return res.status(500).json({ success: false, message: `Terjadi kendala koneksi saat menghapus di Supabase: ${e?.message || e}` });
    }
  }

  // Backup Local Delete
  const db = readLocalDb();
  if (id) {
    const originalLen = db.gtk_data.length;
    db.gtk_data = db.gtk_data.filter((item: any) => item.id !== id);
    if (db.gtk_data.length < originalLen) {
      writeLocalDb(db);
      return res.json({ success: true, message: "Data GTK berhasil dihapus (Local Database)." });
    }
  }

  if (rowNumber) {
    const idx = parseInt(rowNumber, 10) - 2;
    if (idx >= 0 && idx < db.gtk_data.length) {
      db.gtk_data.splice(idx, 1);
      writeLocalDb(db);
      return res.json({ success: true, message: "Data GTK berhasil dihapus (Local Database)." });
    }
  }

  return res.json({ success: false, message: "Data GTK gagal dihapus atau tidak ditemukan." });
});

// Admin-level single account password lookup
app.post("/api/admin/get-password", async (req, res) => {
  const { role, identifier } = req.body;
  if (!role || !identifier) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("pengguna_db")
        .select("password")
        .eq("role", role)
        .eq("identifier", identifier)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return res.json({ success: true, password: data.password });
      }
    } catch (e) {
      console.log("Supabase get password notice / fallback info:", e);
    }
  }

  const db = readLocalDb();
  const f = db.pengguna_db.find((u: any) => u.role === role && u.identifier === identifier);
  if (f) {
    return res.json({ success: true, password: f.password });
  }

  return res.json({ success: false, message: "Akun tersebut belum terdaftar." });
});

// Admin-level change user password
app.post("/api/admin/change-password", async (req, res) => {
  const { role, identifier, newPassword } = req.body;
  if (!role || !identifier || !newPassword) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("pengguna_db")
        .select("*")
        .eq("role", role)
        .eq("identifier", identifier)
        .maybeSingle();

      if (error) throw error;
      
      let updateError;
      if (!data) {
        // insert
        const { error: insErr } = await supabase
          .from("pengguna_db")
          .insert({ role, identifier, password: String(newPassword) });
        updateError = insErr;
      } else {
        // update
        const { error: updErr } = await supabase
          .from("pengguna_db")
          .update({ password: String(newPassword) })
          .eq("role", role)
          .eq("identifier", identifier);
        updateError = updErr;
      }

      if (updateError) throw updateError;
      return res.json({ success: true, message: `Password berhasil diperbarui!` });
    } catch (e: any) {
      console.log("Supabase admin change password notice / fallback info:", e?.message || e);
    }
  }

  const db = readLocalDb();
  const index = db.pengguna_db.findIndex((u: any) => u.role === role && u.identifier === identifier);
  if (index !== -1) {
    db.pengguna_db[index].password = String(newPassword);
    writeLocalDb(db);
  } else {
    db.pengguna_db.push({ role, identifier, password: String(newPassword) });
    writeLocalDb(db);
  }

  return res.json({ success: true, message: `Password berhasil diperbarui (Local Database fallback).` });
});

// Admin-level: save or update a school record
app.post("/api/school/save", async (req, res) => {
  const { id, kecamatan, namaSekolah } = req.body;
  if (!kecamatan || !namaSekolah) {
    return res.status(400).json({ success: false, message: "Kecamatan dan Nama Sekolah wajib diisi." });
  }

  const finalId = id || "ID-SCH-" + Date.now();
  const rawRow = {
    id: finalId,
    kecamatan: String(kecamatan).toUpperCase().trim(),
    nama_sekolah: String(namaSekolah).toUpperCase().trim()
  };

  const dbRow = {
    role: "Sekolah",
    identifier: `${rawRow.kecamatan}|${rawRow.nama_sekolah}`,
    password: "dikerja" // default password for school accounts
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. School list
      const { error: schError } = await supabase
        .from("sekolah_db")
        .upsert(rawRow, { onConflict: "id" });
      if (schError) throw schError;

      // 2. Add user credentials record
      const { data: userExist } = await supabase
        .from("pengguna_db")
        .select("*")
        .eq("identifier", dbRow.identifier)
        .maybeSingle();

      if (!userExist) {
        await supabase.from("pengguna_db").insert(dbRow);
      }

      return res.json({ success: true, message: "Data sekolah berhasil disimpan ke Supabase." });
    } catch (e: any) {
      console.log("Supabase school save notice / fallback info:", e?.message || e);
    }
  }

  // Backup Local school save
  const db = readLocalDb();
  const matchIndex = db.sekolah_db.findIndex((s: any) => s.id === finalId);

  if (matchIndex !== -1) {
    // update
    db.sekolah_db[matchIndex] = rawRow;
  } else {
    // create school and default user credential if missing
    db.sekolah_db.push(rawRow);
  }

  // default credentials
  const credentialExist = db.pengguna_db.some((u: any) => u.identifier === dbRow.identifier);
  if (!credentialExist) {
    db.pengguna_db.push(dbRow);
  }

  writeLocalDb(db);
  return res.json({ success: true, message: "Data sekolah berhasil disimpan (Local Fallback)." });
});

// Admin-level: delete a school record
app.post("/api/school/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: "ID sekolah dibutuhkan." });
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      // 1. Get info
      const { data: school, error: errSelect } = await supabase
        .from("sekolah_db")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (errSelect) throw errSelect;
      if (school) {
        const identifier = `${school.kecamatan}|${school.nama_sekolah}`;
        
        // delete credentials
        await supabase.from("pengguna_db").delete().eq("identifier", identifier);
        
        // delete school database entry
        await supabase.from("sekolah_db").delete().eq("id", id);
      }
      return res.json({ success: true, message: "Data sekolah berhasil dihapus." });
    } catch (e: any) {
      console.log("Supabase school delete notice:", e?.message || e);
    }
  }

  // Fallback Local
  const db = readLocalDb();
  const matched = db.sekolah_db.find((s: any) => s.id === id);
  if (matched) {
    const identifier = `${matched.kecamatan}|${matched.nama_sekolah}`;
    db.sekolah_db = db.sekolah_db.filter((s: any) => s.id !== id);
    db.pengguna_db = db.pengguna_db.filter((u: any) => u.identifier !== identifier);
    writeLocalDb(db);
    return res.json({ success: true, message: "Data sekolah berhasil dihapus (Local Fallback)." });
  }

  return res.json({ success: false, message: "Sekolah tidak ditemukan." });
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC FILES
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
