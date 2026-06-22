import { GtkItem } from "./types";

// Format date String from YYYY-MM-DD to Indonesian full-date text
export function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[0], 10);
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    if (!isNaN(d) && m >= 0 && m < 12 && !isNaN(y)) {
      return `${d} ${months[m]} ${y}`;
    }
  }
  return dateStr;
}

// Format raw HP/WA number to normalized local screen view (prefix 0)
export function formatHpDisplay(rawHp: string): string {
  const hpStr = String(rawHp || "").trim();
  if (hpStr.startsWith("62")) {
    return "0" + hpStr.substring(2);
  }
  return hpStr;
}

export function getPangkatLengkap(golongan: string): string {
  const pangkatMap: Record<string, string> = {
    "II/a": "Pengatur Muda, II/a",
    "II/b": "Pengatur Muda Tingkat I, II/b",
    "II/c": "Pengatur, II/c",
    "II/d": "Pengatur Tingkat I, II/d",
    "III/a": "Penata Muda, III/a",
    "III/b": "Penata Muda Tingkat I, III/b",
    "III/c": "Penata, III/c",
    "III/d": "Penata Tingkat I, III/d",
    "IV/a": "Pembina, IV/a",
    "IV/b": "Pembina Tingkat I, IV/b",
    "IV/c": "Pembina Utama Muda, IV/c",
    "IV/d": "Pembina Utama Madya, IV/d",
    "IV/e": "Pembina Utama, IV/e"
  };
  return pangkatMap[golongan] || golongan || "";
}

// Download Excel table for single school (DUK format)
export function exportExcelSekolah(filteredGtk: GtkItem[], namaSekolah: string) {
  let tableHTML = '<table style="border-collapse: collapse;">';
  
  tableHTML += `
    <thead>
      <tr><td colspan="14" style="text-align:center; font-weight:bold; font-size:14pt;">PEMERINTAH KABUPATEN BULUKUMBA</td></tr>
      <tr><td colspan="14" style="text-align:center; font-weight:bold; font-size:16pt;">DINAS PENDIDIKAN DAN KEBUDAYAAN</td></tr>
      <tr><td colspan="14" style="text-align:center; font-weight:bold; font-size:16pt; border-bottom: 3px solid #000000;">UPT SPF ${namaSekolah}</td></tr>
      <tr><td colspan="14"></td></tr>
      <tr><td colspan="14" style="text-align:center; font-weight:bold; font-size:12pt;">DAFTAR URUT KEPANGKATAN PENDIDIK DAN TENAGA KEPENDIDIKAN</td></tr>
      <tr><td colspan="14"></td></tr>
      
      <tr>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">No</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Nama Lengkap</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">NIP</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">NIK</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Pangkat/ Gol.Ruang</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">TMT Pangkat/ Gol.Ruang</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Jabatan</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Pendidikan Terakhir</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">TMT Kepsek</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Beban Tugas</th>
        <th colspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Sertifikasi</th>
        <th rowspan="3" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">KET</th>
      </tr>
      <tr>
        <th colspan="2" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Status</th>
        <th rowspan="2" style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Mapel Sertifikasi</th>
      </tr>
      <tr>
        <th style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Ya</th>
        <th style="border: 1px solid #000; background-color: #ed7d31; font-weight: bold; text-align: center; vertical-align: middle;">Tdk</th>
      </tr>
    </thead>
    <tbody>
  `;

  filteredGtk.forEach((item, index) => {
    const isYa = item.Sertifikasi === "Ya" ? "v" : "";
    const isBelum = item.Sertifikasi !== "Ya" ? "v" : "";
    const mapelSert = item.Sertifikasi === "Ya" ? item.Mapel : "";

    let pangkatStr = getPangkatLengkap(item.Golongan);
    if (item.Status_Pegawai === "PPPKPW") {
      pangkatStr = "";
    } else if (item.Status_Pegawai === "PPPK") {
      pangkatStr = item.Golongan || "";
    }

    const tmtGolStr = item.TMT_Golongan_Formatted ? "&nbsp;" + formatTanggalIndo(item.TMT_Golongan_Formatted) : "-";
    const tmtKepsekStr = item.TMT_Kepsek_Formatted ? "&nbsp;" + formatTanggalIndo(item.TMT_Kepsek_Formatted) : "-";

    let bebanTugasCetak = item.Beban_Tugas || "";
    if (bebanTugasCetak.startsWith("Guru Mapel - ")) {
      bebanTugasCetak = bebanTugasCetak.replace("Guru Mapel - ", "Guru ");
    }

    tableHTML += "<tr>";
    tableHTML += `<td style="border: 1px solid #000; text-align: center;">${index + 1}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${item.Nama || "-"}</td>`;
    tableHTML += `<td style="border: 1px solid #000; mso-number-format:'\\@';">${item.NIP || ""}</td>`;
    tableHTML += `<td style="border: 1px solid #000; mso-number-format:'\\@';">${item.NIK || ""}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${pangkatStr}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${tmtGolStr}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${item.Jabatan || ""}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${item.Pendidikan || ""}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${tmtKepsekStr}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${bebanTugasCetak}</td>`;
    tableHTML += `<td style="border: 1px solid #000; text-align: center; font-weight: bold;">${isYa}</td>`;
    tableHTML += `<td style="border: 1px solid #000; text-align: center; font-weight: bold;">${isBelum}</td>`;
    tableHTML += `<td style="border: 1px solid #000;">${mapelSert}</td>`;
    tableHTML += `<td style="border: 1px solid #000;"></td>`;
    tableHTML += "</tr>";
  });

  // Tanda tangan
  const kepsek = filteredGtk.find(gtk => gtk.Beban_Tugas === "Kepala Sekolah" || gtk.Beban_Tugas === "PLT. Kepala Sekolah");
  const ttdNama = kepsek ? kepsek.Nama : "..........................";
  const ttdNip = kepsek ? (kepsek.NIP || "..........................") : "..........................";
  
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const today = new Date();
  const ttdTanggal = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  tableHTML += `
    <tr><td colspan="14"></td></tr>
    <tr>
      <td colspan="11"></td>
      <td colspan="3" style="text-align: left;">Bulukumba, ${ttdTanggal}</td>
    </tr>
    <tr>
      <td colspan="11"></td>
      <td colspan="3" style="text-align: left;">Kepala Sekolah</td>
    </tr>
    <tr><td colspan="14"></td></tr>
    <tr><td colspan="14"></td></tr>
    <tr>
      <td colspan="11"></td>
      <td colspan="3" style="text-align: left; font-weight: bold;">${ttdNama}</td>
    </tr>
    <tr>
      <td colspan="11"></td>
      <td colspan="3" style="text-align: left;">NIP. ${ttdNip}</td>
    </tr>
  `;

  tableHTML += "</tbody></table>";

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>DUK PTK</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${tableHTML}
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `DUK_PTK_${namaSekolah.replace(/\s+/g, "_")}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download Excel table for Dinas (Admin Dinas format)
export function exportExcelDinas(filteredGtk: GtkItem[]) {
  let tableHTML = '<table border="1"><thead><tr>';
  
  const headers = [
    "No", "Kecamatan", "Sekolah", "Nama Lengkap", "NIK", "No HP / WA",
    "Status Kepegawaian", "NIP", "Pangkat/Gol", "TMT Golongan", 
    "Pendidikan Terakhir", "Jabatan", "Beban Tugas", "TMT Kepala Sekolah", 
    "Status Sertifikasi", "Mapel Sertifikasi"
  ];
  
  headers.forEach(h => {
    tableHTML += `<th style="background-color: #f2f2f2; font-weight: bold; text-align: center;">${h}</th>`;
  });
  tableHTML += "</tr></thead><tbody>";

  filteredGtk.forEach((item, index) => {
    let rawHp = formatHpDisplay(item.No_HP);

    let pangkatExcel = getPangkatLengkap(item.Golongan);
    if (item.Status_Pegawai === "PPPKPW") {
      pangkatExcel = "";
    } else if (item.Status_Pegawai === "PPPK") {
      pangkatExcel = item.Golongan || "";
    }

    let bebanExcel = item.Beban_Tugas || "";
    if (bebanExcel.startsWith("Guru Mapel - ")) {
      bebanExcel = bebanExcel.replace("Guru Mapel - ", "Guru ");
    }

    tableHTML += "<tr>";
    tableHTML += `<td>${index + 1}</td>`;
    tableHTML += `<td>${item.Kecamatan || "-"}</td>`;
    tableHTML += `<td>${item.Sekolah || "-"}</td>`;
    tableHTML += `<td>${item.Nama || "-"}</td>`;
    tableHTML += `<td style="mso-number-format:'\\@';">${item.NIK || ""}</td>`;
    tableHTML += `<td style="mso-number-format:'\\@';">${rawHp}</td>`;
    tableHTML += `<td>${item.Status_Pegawai || "-"}</td>`;
    tableHTML += `<td style="mso-number-format:'\\@';">${item.NIP || ""}</td>`;
    tableHTML += `<td>${pangkatExcel || "-"}</td>`;
    tableHTML += `<td>${formatTanggalIndo(item.TMT_Golongan_Formatted) || "-"}</td>`;
    tableHTML += `<td>${item.Pendidikan || "-"}</td>`;
    tableHTML += `<td>${item.Jabatan || "-"}</td>`;
    tableHTML += `<td>${bebanExcel || "-"}</td>`;
    tableHTML += `<td>${formatTanggalIndo(item.TMT_Kepsek_Formatted) || "-"}</td>`;
    tableHTML += `<td>${item.Sertifikasi || "-"}</td>`;
    tableHTML += `<td>${item.Mapel || "-"}</td>`;
    tableHTML += "</tr>";
  });
  tableHTML += "</tbody></table>";

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Data PTK Filtered</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${tableHTML}
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Data_PTK_Dikbud_${Date.now()}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Print beautifully formatted PDF layout from a new tab window
export function printLaporan(
  filteredGtk: GtkItem[],
  viewerRole: "Admin Dinas" | "Sekolah",
  viewerIdentifier: string,
  configAdmin?: {
    judul: string;
    tanggal: string;
    jabatan: string;
    nama: string;
    nip: string;
  }
) {
  const isDinas = viewerRole === "Admin Dinas";
  const namaSekolah = isDinas ? "KABUPATEN BULUKUMBA" : viewerIdentifier.split("|")[1];

  let judulCetak = "DAFTAR URUT KEPANGKATAN PENDIDIK DAN TENAGA KEPENDIDIKAN";
  let ttdTanggal = "";
  let ttdJabatan = "Kepala Sekolah";
  let ttdNama = "..........................";
  let ttdNip = "..........................";

  const today = new Date();
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  if (isDinas && configAdmin) {
    judulCetak = configAdmin.judul;
    ttdTanggal = configAdmin.tanggal;
    ttdJabatan = configAdmin.jabatan;
    ttdNama = configAdmin.nama;
    ttdNip = configAdmin.nip;
  } else {
    const kepsek = filteredGtk.find(g => g.Beban_Tugas === "Kepala Sekolah" || g.Beban_Tugas === "PLT. Kepala Sekolah");
    if (kepsek) {
      ttdNama = kepsek.Nama;
      ttdNip = kepsek.NIP || "..........................";
    }
    ttdTanggal = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup terblokir! Harap izinkan popup di browser Anda untuk mencetak.");
    return;
  }

  let html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>Laporan_PTK_${namaSekolah.replace(/\s+/g, "_")}</title>
      <style>
        @page { size: 33cm 21cm; margin: ${isDinas ? "10mm" : "12mm 10mm 2mm 10mm"}; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #000; margin: 0; padding: 0 0 10px 0; }
        
        .kop-surat { border-bottom: 3px solid black; padding-bottom: ${isDinas ? "10px" : "5px"}; margin-bottom: 2px; text-align: center; }
        .kop-wrapper { display: inline-block; position: relative; text-align: center; }
        .kop-logo { position: absolute; right: 100%; top: 0; margin-right: 15px; width: 60px; height: auto; }
        .kop-text { text-align: center; line-height: 1.2; }
        
        .kop-text h1 { margin: 0; font-size: 15px; font-weight: normal; }
        .kop-text h2 { margin: 0; font-size: 17px; font-weight: bold; }
        .kop-text h3 { margin: 0; font-size: 17px; font-weight: bold; text-transform: uppercase; }
        .kop-garis-bawah { border-top: 1px solid black; margin-bottom: ${isDinas ? "20px" : "10px"}; }
        .judul-laporan { text-align: center; font-size: 12px; font-weight: bold; margin-bottom: ${isDinas ? "15px" : "8px"}; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-top: ${isDinas ? "10px" : "5px"}; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; break-inside: avoid; }
        th, td { border: 1px solid #000; padding: 2.5px 3.5px; text-align: center; vertical-align: middle; word-wrap: break-word; }
        th { background-color: #ed7d31; font-weight: bold; font-size: 9.5px; color: #fff; }
        td { font-size: 9px; }
        .text-left { text-align: left; }
        .info-text { font-size: 9.5px; color: #444; margin-bottom: 5px; text-align: right; }
        .ttd-wrapper { display: flex; justify-content: flex-end; margin-top: ${isDinas ? "35px" : "10px"}; page-break-inside: avoid; break-inside: avoid; }
        .ttd-box { width: 300px; text-align: left; }
        .ttd-box p { margin: 0; padding: 1.5px 0; font-size: 11px; }
        .ttd-space { height: 60px; }
        
        .footer-pdf {
          position: fixed;
          bottom: 0;
          left: 0;
          font-size: 9px;
          color: #9ca3af;
          font-style: italic;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      
      <div class="footer-pdf">Laporan ini dicetak melalui Aplikasi SI PTK Dikbud Kab. Bulukumba</div>

      ${isDinas ? `
      <div class="kop-surat">
        <div class="kop-wrapper">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/Lambang_Kabupaten_Bulukumba.svg" class="kop-logo" style="width: 65px; margin-right: 20px;" alt="Logo Bulukumba" />
          <div class="kop-text">
            <h1 style="font-size: 17px; margin-bottom: 4px;">PEMERINTAH KABUPATEN BULUKUMBA</h1>
            <h2 style="font-size: 21px; font-weight: bold; margin-bottom: 6px;">DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
            <p style="font-size: 12.5px; margin: 0;">Alamat: Gedung Ammatoa Lt. 1 Jalan Jenderal Sudirman, Bulukumba 92511</p>
          </div>
        </div>
      </div>
      <div class="kop-garis-bawah"></div>
      ` : `
      <div class="kop-surat">
        <div class="kop-wrapper">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/50/Lambang_Kabupaten_Bulukumba.svg" class="kop-logo" style="width: 50px; margin-right: 15px; top: 1px;" alt="Logo Bulukumba" />
          <div class="kop-text">
            <h1>PEMERINTAH KABUPATEN BULUKUMBA</h1>
            <h2>DINAS PENDIDIKAN DAN KEBUDAYAAN</h2>
            <h3>UPT SPF ${namaSekolah}</h3>
          </div>
        </div>
      </div>
      <div class="kop-garis-bawah"></div>
      `}

      <div class="judul-laporan">${judulCetak}</div>
      
      <div class="info-text">
        Total Data: ${filteredGtk.length} Personel
      </div>

      <table>
        <thead>
          <tr>
            <th rowspan="3" style="width: 1%; white-space: nowrap;">No</th>
            <th rowspan="3" style="width: 1%; white-space: nowrap;">Nama Lengkap</th>
            ${isDinas ? '<th rowspan="3" width="4%">Status</th>' : ""}
            <th rowspan="3" style="width: 1%; white-space: nowrap;">NIP</th>
            <th rowspan="3" style="width: 1%; white-space: nowrap;">NIK</th>
            ${isDinas ? '<th rowspan="3" width="10%">Lokasi Tugas</th>' : ""}
            <th rowspan="3" width="6%">Pangkat/<br>Gol.Ruang</th>
            <th rowspan="3" width="6%">TMT<br>Pangkat</th>
            <th rowspan="3" width="8%">Jabatan</th>
            <th rowspan="3" width="5%">Pendidikan<br>Terakhir</th>
            <th rowspan="3" width="5%">TMT<br>Kepsek</th>
            <th rowspan="3" width="8%">Beban<br>Tugas</th>
            <th colspan="3">Sertifikasi</th>
            ${isDinas ? '<th rowspan="3" style="width: 1%; white-space: nowrap;">NO. HP</th>' : ""}
            <th rowspan="3" style="width: auto;">KET</th>
          </tr>
          <tr>
            <th colspan="2">Status</th>
            <th rowspan="2" width="8%">Mapel Sertifikasi</th>
          </tr>
          <tr>
            <th style="width: 1%;">Ya</th>
            <th style="width: 1%;">Tdk</th>
          </tr>
        </thead>
        <tbody>
  `;

  filteredGtk.forEach((item, index) => {
    const isYa = item.Sertifikasi === "Ya" ? "v" : "";
    const isBelum = item.Sertifikasi !== "Ya" ? "v" : "";
    const mapelSert = item.Sertifikasi === "Ya" ? item.Mapel : "";
    const noHp = item.No_HP ? item.No_HP.replace(/^62/, "0") : "";

    let pangkatStr = getPangkatLengkap(item.Golongan);
    if (item.Status_Pegawai === "PPPKPW") {
      pangkatStr = "";
    } else if (item.Status_Pegawai === "PPPK") {
      pangkatStr = item.Golongan || "";
    }

    const tmtGolStr = formatTanggalIndo(item.TMT_Golongan_Formatted);
    const tmtKepsekStr = formatTanggalIndo(item.TMT_Kepsek_Formatted);

    let bebanTugasCetak = item.Beban_Tugas || "";
    if (bebanTugasCetak.startsWith("Guru Mapel - ")) {
      bebanTugasCetak = bebanTugasCetak.replace("Guru Mapel - ", "Guru ");
    }

    html += `
      <tr>
        <td>${index + 1}</td>
        <td class="text-left" style="white-space: nowrap;">${item.Nama}</td>
        ${isDinas ? `<td>${item.Status_Pegawai || ""}</td>` : ""}
        <td style="white-space: nowrap;">${item.NIP || ""}</td>
        <td style="white-space: nowrap;">${item.NIK || ""}</td>
        ${isDinas ? `<td><strong>${item.Sekolah}</strong><br><span style="font-size:8px;color:#444;">${item.Kecamatan}</span></td>` : ""}
        <td style="white-space: nowrap;">${pangkatStr}</td>
        <td style="white-space: nowrap;">${tmtGolStr}</td>
        <td>${item.Jabatan || ""}</td>
        <td>${item.Pendidikan || ""}</td>
        <td style="white-space: nowrap;">${tmtKepsekStr}</td>
        <td>${bebanTugasCetak}</td>
        <td><strong>${isYa}</strong></td>
        <td><strong>${isBelum}</strong></td>
        <td>${mapelSert}</td>
        ${isDinas ? `<td style="white-space: nowrap;">${noHp}</td>` : ""}
        <td></td>
      </tr>
    `;
  });

  const colSpanTotal = isDinas ? 17 : 14;
  const ttdPadding = isDinas ? "30px" : "15px";
  const ttdSpace = isDinas ? "70px" : "50px";

  html += `
          <tr>
            <td colspan="${colSpanTotal}" style="border: none; padding-top: ${ttdPadding};">
              <div class="ttd-wrapper">
                <div class="ttd-box">
                  <p>Bulukumba, ${ttdTanggal}</p>
                  <p>${ttdJabatan}</p>
                  <div style="height: ${ttdSpace};"></div>
                  <p><strong style="font-size: 13px;">${ttdNama}</strong></p>
                  <p>NIP ${isDinas ? ":" : "."} ${ttdNip}</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <script>
        window.onload = function() { window.print(); };
      <\/script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

