/**
 * GOOGLE APPS SCRIPT BACKEND (Code.gs)
 * Untuk Aplikasi SI PTK Dikbud Kab. Bulukumba
 * 
 * CARA PENGGUNAAN:
 * 1. Di Google Drive, buatlah sebuah Spreadsheet baru.
 * 2. Klik menu 'Ekstensi' > 'Apps Script'.
 * 3. Hapus seluruh kode default di editor, lalu paste kode ini.
 * 4. Buat file baru di Apps Script dengan nama 'Page.html' (dan isi dengan konten dari berkas 'dist/index.html' setelah dicompile).
 * 5. Klik 'Terapkan' (Deploy) > 'Penerapan Baru' (New Deployment).
 * 6. Pilih Jenis: 'Aplikasi Web' (Web App).
 * 7. Konfigurasi: 
 *    - Jalankan sebagai: 'Saya' (Me - Email Anda).
 *    - Siapa yang memiliki akses: 'Siapa saja' (Anyone) -> agar kepala sekolah & admin dinas bisa akses.
 * 8. Klik Terapkan, berikan izin akses (Authorize) jika diminta.
 * 9. Salin URL Aplikasi Web yang diberikan demi mengakses sistem informasi ptk Anda.
 */

// ISI DENGAN ID SPREADSHEEET JIKA BERJALAN STANDALONE. 
// Contoh: var SPREADSHEET_ID = "1aBcDeFgHiJkLmNoPqRsTuVwXyZ";
// Kosongkan "" jika Script ini dibuka melalui menu 'Ekstensi > Apps Script' di Google Sheets terkait.
var SPREADSHEET_ID = "";

/**
 * Serves the compiled single-file HTML inside the Apps Script Frame
 */
function doGet() {
  return HtmlService.createTemplateFromFile("Page")
    .evaluate()
    .setTitle("SI PTK DIKBUD BULUKUMBA")
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * UNIFIED API GATEWAY
 * Berfungsi sebagai router penerima panggilan fetch() ter-interupsi dari client React.
 */
function api_handler(path, method, payloadStr) {
  var payload = {};
  if (payloadStr) {
    try {
      payload = JSON.parse(payloadStr);
    } catch(e) {
      // payload tidak valid atau kosong
    }
  }

  try {
    if (path === "/api/db-status") {
      var ss;
      if (SPREADSHEET_ID) {
        ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      } else {
        ss = SpreadsheetApp.getActiveSpreadsheet();
      }
      return {
        status: "connected",
        message: "Terhubung ke Database Google Spreadsheet (" + ss.getName() + " - Google Apps Script)",
        url: ss.getUrl()
      };
    } 
    
    if (path === "/api/dropdown-data") {
      return getDropdownData();
    }
    
    if (path === "/api/login") {
      return login(payload);
    }
    
    if (path === "/api/change-password") {
      return changePassword(payload);
    }
    
    if (path === "/api/gtk/list") {
      return getGtkList(payload);
    }
    
    if (path === "/api/gtk/save") {
      return saveGtk(payload);
    }
    
    if (path === "/api/gtk/delete") {
      return deleteGtk(payload);
    }
    
    if (path === "/api/admin/get-password") {
      return adminGetPassword(payload);
    }
    
    if (path === "/api/admin/change-password") {
      return adminChangePassword(payload);
    }
    
    if (path === "/api/school/save") {
      return schoolSave(payload);
    }
    
    if (path === "/api/school/delete") {
      return schoolDelete(payload);
    }

    return { success: false, message: "Endpoint tidak ditemukan di script server: " + path };
  } catch (error) {
    return { success: false, message: "Kendala Server Apps Script: " + error.message };
  }
}

/**
 * HELPER: Mendapatkan Sheet berdasarkan nama (membuat tab dan menyuntikkan template jika kosong/belum ada)
 */
function getSheetByName(name) {
  var ss;
  if (SPREADSHEET_ID) {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    var headers = [];
    if (name === "sekolah_db") {
      headers = ["id", "kecamatan", "nama_sekolah"];
    } else if (name === "pengguna_db") {
      headers = ["role", "identifier", "password"];
    } else if (name === "gtk_data") {
      headers = [
        "id", "kecamatan", "sekolah", "nama", "nip", "status_pegawai",
        "nik", "golongan", "tmt_golongan", "jabatan", "pendidikan",
        "beban_tugas", "tmt_kepsek", "sertifikasi", "mapel", "no_hp",
        "tmt_kgb_terakhir", "created_at"
      ];
    }
    
    if (headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#ed7d31").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }
    
    // Seed data demo awal
    if (name === "sekolah_db") {
      sheet.appendRow(["id-sek-satu", "KEC. BULUKUMPA", "SDN 58 TANETE"]);
      sheet.appendRow(["id-sek-dua", "KEC. BULUKUMPA", "SDN 59 TANETE"]);
    } else if (name === "pengguna_db") {
      sheet.appendRow(["Admin Dinas", "admin", "ammatoa"]);
      sheet.appendRow(["Sekolah", "KEC. BULUKUMPA|SDN 58 TANETE", "dikerja"]);
      sheet.appendRow(["Sekolah", "KEC. BULUKUMPA|SDN 59 TANETE", "dikerja"]);
    } else if (name === "gtk_data") {
      sheet.appendRow([
        "ID178069900785899", "KEC. BULUKUMPA", "SDN 58 TANETE", "IRA INDIRA, S.Pd., M.Pd", "197601152002122005", "PNS",
        "7302075501760004", "IV/b", "2023-04-01", "Guru Ahli Madya", "S2",
        "Guru Kelas SD", "", "Ya", "Guru Kelas SD", "6281342685961", "2024-04-01", new Date().toISOString()
      ]);
    }
  }
  return sheet;
}

/**
 * HELPER: Membaca Database Sheet sebagai kumpulan Object JSON
 */
function readSheetObjects(sheetName) {
  var sheet = getSheetByName(sheetName);
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];
  
  var headers = values[0];
  var list = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    var emptyRow = true;
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        // Format ke standar YYYY-MM-DD untuk input date UI
        var year = val.getFullYear();
        var month = ("0" + (val.getMonth() + 1)).slice(-2);
        var date = ("0" + val.getDate()).slice(-2);
        val = year + "-" + month + "-" + date;
      }
      obj[headers[j]] = val;
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        emptyRow = false;
      }
    }
    if (!emptyRow) {
      list.push(obj);
    }
  }
  return list;
}

/**
 * HELPER: Upsert Object ke Sheet (Berdasarkan identifier kolom Primary Key)
 */
function upsertSheetObject(sheetName, obj, keyField) {
  var sheet = getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var targetRowIdx = -1;
  var keyVal = String(obj[keyField] || "").trim();
  
  var colIdx = headers.indexOf(keyField);
  if (colIdx !== -1 && values.length > 1) {
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][colIdx]).trim() === keyVal) {
        targetRowIdx = i + 1; // 1-indexed range
        break;
      }
    }
  }
  
  var rowData = [];
  for (var j = 0; j < headers.length; j++) {
    var headerName = headers[j];
    var value = obj[headerName] !== undefined ? obj[headerName] : "";
    rowData.push(value);
  }
  
  if (targetRowIdx !== -1) {
    sheet.getRange(targetRowIdx, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

/**
 * HELPER: Menghapus data sheet berdasarkan key
 */
function deleteSheetObject(sheetName, keyValue, keyField) {
  var sheet = getSheetByName(sheetName);
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return false;
  
  var headers = values[0];
  var colIdx = headers.indexOf(keyField);
  if (colIdx === -1) return false;
  
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][colIdx]).trim() === String(keyValue).trim()) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

// ===============================================
// CORE IMPLEMENTATION API ROUTES
// ===============================================

/**
 * 1. Mendapatkan daftar Kecamatan dan Sekolah
 */
function getDropdownData() {
  var list = readSheetObjects("sekolah_db");
  var rawSekolahs = list.map(function(s) {
    return {
      id: s.id,
      kec: s.kecamatan,
      nama: s.nama_sekolah
    };
  });
  
  var tempKec = {};
  rawSekolahs.forEach(function(s) {
    if (s.kec) tempKec[s.kec] = true;
  });
  var rawKecamatans = Object.keys(tempKec);
  
  return {
    kecamatans: rawKecamatans.sort(),
    sekolahs: rawSekolahs.sort(function(a, b) { return a.nama.localeCompare(b.nama); })
  };
}

/**
 * 2. Login Autentikasi Pengguna
 */
function login(payload) {
  var role = payload.role;
  var identifier = payload.identifier;
  var password = String(payload.password || "").trim();
  
  if (!role || !identifier || !password) {
    return { success: false, message: "Kredensial tidak lengkap!" };
  }
  
  var users = readSheetObjects("pengguna_db");
  var matchedUser = users.find(function(u) {
    return u.role === role && String(u.identifier).trim() === String(identifier).trim() && String(u.password).trim() === password;
  });
  
  if (matchedUser) {
    return { success: true, role: role, identifier: identifier };
  }
  return { success: false, message: "Username/Sekolah atau Password salah!" };
}

/**
 * 3. Ubah Password Pengguna tingkat Sekolah
 */
function changePassword(payload) {
  var identifier = payload.identifier;
  var oldPass = String(payload.oldPass || "").trim();
  var newPass = String(payload.newPass || "").trim();
  
  if (!identifier || !oldPass || !newPass) {
    return { success: false, message: "Parameter tidak lengkap." };
  }
  
  var users = readSheetObjects("pengguna_db");
  var matchedIndex = users.findIndex(function(u) {
    return u.role === "Sekolah" && String(u.identifier).trim() === String(identifier).trim() && String(u.password).trim() === oldPass;
  });
  
  if (matchedIndex !== -1) {
    users[matchedIndex].password = newPass;
    upsertSheetObject("pengguna_db", users[matchedIndex], "identifier");
    return { success: true, message: "Password berhasil diubah di database spreadsheet." };
  }
  return { success: false, message: "Password lama tidak sesuai!" };
}

/**
 * 4. Ambil dan lakukan Kalkulasi Analisis seluruh Data GTK Pendidik
 */
function getGtkList(payload) {
  var role = payload.role;
  var identifier = payload.identifier;
  
  var list = readSheetObjects("gtk_data");
  var mappedList = list.map(function(d, index) {
    return {
      ID: d.id || d.nik || ("gtk-" + index),
      Kecamatan: d.kecamatan || "",
      Sekolah: d.sekolah || "",
      Nama: d.nama || "",
      NIP: d.nip || "",
      Status_Pegawai: d.status_pegawai || "",
      NIK: d.nik || "",
      Golongan: d.golongan || "",
      TMT_Golongan_Formatted: d.tmt_golongan || "",
      TMT_KGB_Terakhir_Formatted: d.tmt_kgb_terakhir || "",
      Jabatan: d.jabatan || "",
      Pendidikan: d.pendidikan || "",
      Beban_Tugas: d.beban_tugas || "",
      TMT_Kepsek_Formatted: d.tmt_kepsek || "",
      Sertifikasi: d.sertifikasi || "Belum",
      Mapel: d.mapel || "",
      No_HP: d.no_hp || ""
    };
  });
  
  // Filter berdasarkan identitas jika yang login adalah User tingkat Sekolah
  if (role === "Sekolah" && identifier) {
    var parts = identifier.split("|");
    var kec = parts[0] || "";
    var sek = parts[1] || "";
    mappedList = mappedList.filter(function(item) {
      return item.Kecamatan === kec && item.Sekolah === sek;
    });
  }
  
  var today = new Date();
  var processedList = mappedList.map(function(item, idx) {
    var isPensiun = false;
    var isMendekatiPensiun = false;
    var telatNaikPangkat = false;
    
    // 1. Perhitungan Keterlambatan Naik Golongan / Pangkat (> 4 Tahun)
    if (item.TMT_Golongan_Formatted) {
      try {
        var tmtDate = new Date(item.TMT_Golongan_Formatted);
        if (!isNaN(tmtDate.getTime())) {
          var diffYears = (today.getTime() - tmtDate.getTime()) / (1000 * 3600 * 24 * 365.25);
          if (diffYears > 4) telatNaikPangkat = true;
        }
      } catch (e) {}
    }
    
    // 2. Perhitungan Batas Umur Pensiun (PNS & PPPK) berdasarkan tahun lahir dari NIP (kolom NIP mengandung struktur YYYYMMDD)
    var nipStr = String(item.NIP || "").trim();
    if (nipStr.length >= 8 && (item.Status_Pegawai === "PNS" || item.Status_Pegawai.indexOf("PPPK") !== -1)) {
      var year = parseInt(nipStr.substring(0, 4), 10);
      var month = parseInt(nipStr.substring(4, 6), 10) - 1;
      var day = parseInt(nipStr.substring(6, 8), 10);
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        var batasUmur = 58;
        var isGuru = (item.Beban_Tugas && (item.Beban_Tugas.indexOf("Guru") !== -1 || item.Beban_Tugas.indexOf("Kepala Sekolah") !== -1));
        if (isGuru) {
          batasUmur = 60; // Batas usia pensiun fungsional guru
        }
        
        var pensionDate = new Date(year + batasUmur, month, day);
        var timeDiff = pensionDate.getTime() - today.getTime();
        var daysDiff = timeDiff / (1000 * 3600 * 24);
        
        if (daysDiff <= 0) {
          isPensiun = true;
        } else if (daysDiff <= 365) {
          isMendekatiPensiun = true;
        }
      }
    }
    
    // 3. Perhitungan Jadwal KGB (Kenaikan Gaji Berkala) - Setiap 2 tahun untuk PNS
    var telatKgb = false;
    var akanKgb = false;
    var kgbWarningMessage = "";
    
    if (item.Status_Pegawai === "PNS" && item.TMT_KGB_Terakhir_Formatted) {
      try {
        var lastKgbDate = new Date(item.TMT_KGB_Terakhir_Formatted);
        if (!isNaN(lastKgbDate.getTime())) {
          var nextKgbDate = new Date(lastKgbDate);
          nextKgbDate.setFullYear(lastKgbDate.getFullYear() + 2);
          
          var timeDiffKgb = nextKgbDate.getTime() - today.getTime();
          var daysDiffKgb = timeDiffKgb / (1000 * 3600 * 24);
          
          if (daysDiffKgb < 0) {
            telatKgb = true;
            kgbWarningMessage = "Telat KGB";
          } else if (daysDiffKgb <= 91) {
            akanKgb = true;
            var remainingMonths = Math.ceil(daysDiffKgb / 30.415);
            if (remainingMonths > 0 && remainingMonths <= 3) {
              kgbWarningMessage = remainingMonths + " Bulan lagi KGB";
            } else {
              kgbWarningMessage = "Segera KGB";
            }
          }
        }
      } catch (e) {}
    }
    
    return {
      ID: item.ID,
      Kecamatan: item.Kecamatan,
      Sekolah: item.Sekolah,
      Nama: item.Nama,
      NIP: item.NIP,
      Status_Pegawai: item.Status_Pegawai,
      NIK: item.NIK,
      Golongan: item.Golongan,
      TMT_Golongan_Formatted: item.TMT_Golongan_Formatted,
      TMT_KGB_Terakhir_Formatted: item.TMT_KGB_Terakhir_Formatted,
      Jabatan: item.Jabatan,
      Pendidikan: item.Pendidikan,
      Beban_Tugas: item.Beban_Tugas,
      TMT_Kepsek_Formatted: item.TMT_Kepsek_Formatted,
      Sertifikasi: item.Sertifikasi,
      Mapel: item.Mapel,
      No_HP: item.No_HP,
      rowNumber: idx + 2,
      isPensiun: isPensiun,
      isMendekatiPensiun: isMendekatiPensiun,
      telatNaikPangkat: telatNaikPangkat,
      telatKgb: telatKgb,
      akanKgb: akanKgb,
      kgbWarningMessage: kgbWarningMessage
    };
  });
  
  return processedList;
}

/**
 * 5. Menyimpan Baru atau Memperbarui Record Data GTK
 */
function saveGtk(payload) {
  var id = payload.id;
  var kecamatan = payload.kecamatan;
  var sekolah = payload.sekolah;
  var nama = payload.nama;
  var nik = payload.nik;
  var statusPegawai = payload.statusPegawai;
  var nip = payload.nip || "";
  var golongan = payload.golongan || "";
  var tmtGolongan = payload.tmtGolongan || "";
  var jabatan = payload.jabatan || "";
  var pendidikan = payload.pendidikan;
  var bebanTugas = payload.bebanTugas;
  var tmtKepsek = payload.tmtKepsek || "";
  var sertifikasi = payload.sertifikasi || "Belum";
  var mapel = payload.mapel || "";
  var hp = payload.hp;
  var tmtKgbTerakhir = payload.tmtKgbTerakhir || "";
  
  if (!kecamatan || !sekolah || !nama || !nik || !statusPegawai || !pendidikan || !bebanTugas || !hp) {
    return { success: false, message: "Kriteria data wajib tidak lengkap!" };
  }
  
  // Format nomor WhatsApp / Gsm ke format 62xxx
  var formattedHp = String(hp).trim();
  if (formattedHp.indexOf("0") === 0) {
    formattedHp = "62" + formattedHp.substring(1);
  }
  
  var finalId = id || ("ID-GTK-" + new Date().getTime() + String(Math.floor(Math.random() * 1000)));
  
  var cleanDateVal = function(val) {
    if (!val) return "";
    return String(val).trim();
  };
  
  var dbRow = {
    id: finalId,
    kecamatan: kecamatan,
    sekolah: sekolah,
    nama: nama,
    nip: nip,
    status_pegawai: statusPegawai,
    nik: nik,
    golongan: golongan,
    tmt_golongan: cleanDateVal(tmtGolongan),
    jabatan: jabatan,
    pendidikan: pendidikan,
    beban_tugas: bebanTugas,
    tmt_kepsek: cleanDateVal(tmtKepsek),
    sertifikasi: sertifikasi,
    mapel: mapel,
    no_hp: formattedHp,
    tmt_kgb_terakhir: cleanDateVal(tmtKgbTerakhir),
    created_at: new Date().toISOString()
  };
  
  upsertSheetObject("gtk_data", dbRow, "id");
  return { success: true, message: "Data GTK berhasil disimpan ke Spreadsheet." };
}

/**
 * 6. Menghapus Record Data GTK
 */
function deleteGtk(payload) {
  var id = payload.id;
  if (!id) {
    return { success: false, message: "ID PTK harus diberikan." };
  }
  
  var success = deleteSheetObject("gtk_data", id, "id");
  if (success) {
    return { success: true, message: "Data GTK berhasil dihapus dari Google Sheets." };
  }
  return { success: false, message: "Data tidak ditemukan atau gagal dihapus." };
}

/**
 * 7. Mengambil password bagi Admin Dinas (Fasilitas Lupa Password)
 */
function adminGetPassword(payload) {
  var role = payload.role;
  var identifier = payload.identifier;
  
  if (!role || !identifier) {
    return { success: false, message: "Parameter query tidak lengkap." };
  }
  
  var users = readSheetObjects("pengguna_db");
  var matchedUser = users.find(function(u) {
    return u.role === role && String(u.identifier).trim() === String(identifier).trim();
  });
  
  if (matchedUser) {
    return { success: true, password: matchedUser.password };
  }
  return { success: false, message: "Kredensial akun belum terdaftar pada spreadsheet." };
}

/**
 * 8. Mengubah password kredensial akun tertentu (Tingkat Admin Dinas)
 */
function adminChangePassword(payload) {
  var role = payload.role;
  var identifier = payload.identifier;
  var newPassword = String(payload.newPassword || "").trim();
  
  if (!role || !identifier || !newPassword) {
    return { success: false, message: "Kriteria penyetelan password belum dipenuhi." };
  }
  
  var users = readSheetObjects("pengguna_db");
  var matchedIndex = users.findIndex(function(u) {
    return u.role === role && String(u.identifier).trim() === String(identifier).trim();
  });
  
  var userRow = {
    role: role,
    identifier: identifier,
    password: newPassword
  };
  
  upsertSheetObject("pengguna_db", userRow, "identifier");
  return { success: true, message: "Sandi akun berhasil disinkronisasi ke Google Sheets!" };
}

/**
 * 9. Menambahkan atau Update Sekolah (Tingkat Admin Dinas)
 */
function schoolSave(payload) {
  var id = payload.id;
  var kecamatan = String(payload.kecamatan || "").toUpperCase().trim();
  var namaSekolah = String(payload.namaSekolah || "").toUpperCase().trim();
  
  if (!kecamatan || !namaSekolah) {
    return { success: false, message: "Nama Kecamatan dan Nama Sekolah wajib diberikan!" };
  }
  
  var finalId = id || ("ID-SCH-" + new Date().getTime());
  var rawRow = {
    id: finalId,
    kecamatan: kecamatan,
    nama_sekolah: namaSekolah
  };
  
  // Update sekolah_db
  upsertSheetObject("sekolah_db", rawRow, "id");
  
  // Buat default kredensial baru untuk sekolah jika belum terdaftar sebelumnya
  var userIdentifier = kecamatan + "|" + namaSekolah;
  var users = readSheetObjects("pengguna_db");
  var userExist = users.some(function(u) {
    return String(u.identifier).trim() === userIdentifier;
  });
  
  if (!userExist) {
    var defaultUser = {
      role: "Sekolah",
      identifier: userIdentifier,
      password: "dikerja" // Sandi standar bawaan
    };
    upsertSheetObject("pengguna_db", defaultUser, "identifier");
  }
  
  return { success: true, message: "Basis data Sekolah berhasil ditambahkan ke Spreadsheet." };
}

/**
 * 10. Menghapus Sekolah berserta Hak Akses Akunnya (Tingkat Admin Dinas)
 */
function schoolDelete(payload) {
  var id = payload.id;
  if (!id) {
    return { success: false, message: "ID Sekolah wajib diberikan!" };
  }
  
  var schools = readSheetObjects("sekolah_db");
  var matchedSchool = schools.find(function(s) {
    return s.id === id;
  });
  
  if (matchedSchool) {
    var userIdentifier = String(matchedSchool.kecamatan).trim() + "|" + String(matchedSchool.nama_sekolah).trim();
    
    // 1. Hapus Kredensial akun terkait
    deleteSheetObject("pengguna_db", userIdentifier, "identifier");
    
    // 2. Hapus referensi sekolah
    deleteSheetObject("sekolah_db", id, "id");
    
    return { success: true, message: "Data sekolah beserta hak aksesnya berhasil dicabut." };
  }
  return { success: false, message: "Data Sekolah tidak ditemukan." };
}
