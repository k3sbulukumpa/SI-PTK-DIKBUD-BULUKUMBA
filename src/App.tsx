import { useState, useEffect, useMemo } from "react";
import { School, GtkItem, UserSession, DbStatus } from "./types";
import { DbAlert } from "./components/DbAlert";
import { LoginView } from "./components/LoginView";
import { Header } from "./components/Header";
import { ModalSchool } from "./components/ModalSchool";
import { ModalGtk } from "./components/ModalGtk";
import { ModalManagePasswords } from "./components/ModalManagePasswords";
import { ModalDataGanda } from "./components/ModalDataGanda";
import { ModalChangePassword } from "./components/ModalChangePassword";
import { ModalCetakOptions } from "./components/ModalCetakOptions";
import { DashboardView } from "./components/DashboardView";
import { formatTanggalIndo, formatHpDisplay, getPangkatLengkap, printLaporan, exportExcelSekolah, exportExcelDinas } from "./utils";

// Lucide icon imports
import { 
  Plus, Search, RefreshCw, FileSpreadsheet, Printer, Copy, Settings,
  AlertTriangle, CheckCircle, HelpCircle, Phone, Award, GraduationCap,
  Calendar, Layers, FilterX, HelpCircle as HelpIcon, ArrowUpDown,
  LayoutDashboard, LogOut, Menu, X, KeyRound, Users as UsersIcon, ShieldCheck,
  MessageCircle, ChevronLeft, ChevronRight
} from "lucide-react";

export default function App() {
  // Session details
  const [session, setSession] = useState<UserSession | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "data">("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Dropdown datasets
  const [schools, setSchools] = useState<School[]>([]);
  const [kecamatans, setKecamatans] = useState<string[]>([]);

  // Primary operational datasets
  const [gtkList, setGtkList] = useState<GtkItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters state (Primary filtering)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJenjang, setFilterJenjang] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState("");
  const [filterSekolah, setFilterSekolah] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBeban, setFilterBeban] = useState("");
  const [filterMapel, setFilterMapel] = useState("");
  const [filterKondisi, setFilterKondisi] = useState("");
  const [filterSertifikasi, setFilterSertifikasi] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Auto reset page when search bounds or other filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterJenjang, filterKecamatan, filterSekolah, filterStatus, filterBeban, filterMapel, filterKondisi, filterSertifikasi]);

  // Modals state triggers
  const [openSchoolModal, setOpenSchoolModal] = useState(false);
  const [openGtkModal, setOpenGtkModal] = useState(false);
  const [openManagePasswordsModal, setOpenManagePasswordsModal] = useState(false);
  const [openDataGandaModal, setOpenDataGandaModal] = useState(false);
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  const [openCetakOptionsModal, setOpenCetakOptionsModal] = useState(false);

  // Selected item state for editing
  const [selectedGtkItem, setSelectedGtkItem] = useState<GtkItem | null>(null);
  const [gtkToDelete, setGtkToDelete] = useState<GtkItem | null>(null);

  // Load configuration dropdowns and DB status
  const fetchMetadata = async () => {
    try {
      const dbResp = await fetch("/api/db-status");
      const dbData = await dbResp.json();
      setDbStatus(dbData);

      const dropResp = await fetch("/api/dropdown-data");
      const dropData = await dropResp.json();
      setSchools(dropData.sekolahs || []);
      setKecamatans(dropData.kecamatans || []);
    } catch (err) {
      console.error("Error loading setup indices:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Retrieve teacher listings of current active session context
  const handleReloadGtkList = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const resp = await fetch("/api/gtk/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: session.role,
          identifier: session.identifier
        })
      });
      const data = await resp.json();
      if (Array.isArray(data)) {
        setGtkList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      handleReloadGtkList();
    }
  }, [session]);

  const handleLogout = () => {
    // Reset all filter states to prevent lingering values
    setSearchTerm("");
    setFilterJenjang("");
    setFilterKecamatan("");
    setFilterSekolah("");
    setFilterStatus("");
    setFilterBeban("");
    setFilterMapel("");
    setFilterSertifikasi("");
    setFilterKondisi("");
    setCurrentPage(1);

    setSession(null);
    setGtkList([]);
    setActiveTab("dashboard");
  };

  // Perform a soft-scanning alert for school admins if duplicates are found in local state
  useEffect(() => {
    if (session && session.role === "Sekolah" && gtkList.length > 0) {
      const seen = new Set<string>();
      const duplicates = new Set<string>();

      gtkList.forEach(item => {
        const name = String(item.Nama || "").trim().toLowerCase();
        const nik = String(item.NIK || "").trim();
        if (nik.length === 16 && name) {
          const key = `${nik}|${name}`;
          if (seen.has(key)) {
            duplicates.add(item.Nama);
          } else {
            seen.add(key);
          }
        }
      });

      if (duplicates.size > 0) {
        const docNames = Array.from(duplicates).join(", ");
        alert(`Peringatan Data Ganda!\n\nSistem mendeteksi adanya data PTK ganda (NIK dan Nama identik) atas nama:\n\n${docNames}\n\nHarap hubungi Admin Dinas atau periksa records Anda.`);
      }
    }
  }, [gtkList, session]);

  // Handle GTK Item deleting state trigger
  const handleDeleteGtk = (item: GtkItem) => {
    setGtkToDelete(item);
  };

  // Handle GTK Item deleting confirmation
  const handleConfirmDeleteGtk = async () => {
    if (!gtkToDelete) return;
    const item = gtkToDelete;
    setGtkToDelete(null);
    try {
      const resp = await fetch("/api/gtk/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.ID })
      });
      const data = await resp.json();
      if (data.success) {
        alert(data.message || "Data berhasil dihapus.");
        handleReloadGtkList();
      } else {
        alert(data.message || "Gagal menghapus data.");
      }
    } catch (err) {
      console.error(err);
      alert("Hubungan server terputus.");
    }
  };

  // Filter computation logic (Natural matching & scoring cascades)
  const filteredAndSortedGtkList = useMemo(() => {
    let result = [...gtkList];

    // Filter by text search
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(item => {
        return (
          item.Nama.toLowerCase().includes(s) ||
          (item.NIP && item.NIP.includes(s)) ||
          item.NIK.includes(s)
        );
      });
    }

    // Filter by academic level (Jenjang) matching
    const isDinas = session?.role === "Admin Dinas";

    if (isDinas && filterJenjang) {
      result = result.filter(item => {
        const sName = (item.Sekolah || "").toUpperCase();
        if (filterJenjang === "TK") return sName.includes("TK ") || sName.includes("TKN");
        if (filterJenjang === "SD") return sName.includes("SD ") || sName.includes("SDN");
        if (filterJenjang === "SMP") return sName.includes("SMP");
        return true;
      });
    }

    // Filter by Kecamatan
    if (isDinas && filterKecamatan) {
      result = result.filter(item => item.Kecamatan === filterKecamatan);
    }

    // Filter by Sekolah
    if (isDinas && filterSekolah) {
      result = result.filter(item => item.Sekolah === filterSekolah);
    }

    // Filter by status pegawai
    if (isDinas && filterStatus) {
      if (filterStatus === "PPPK_ALL") {
        result = result.filter(item => item.Status_Pegawai === "PPPK" || item.Status_Pegawai === "PPPKPW");
      } else {
        result = result.filter(item => item.Status_Pegawai === filterStatus);
      }
    }

    // Filter by beban tugas
    if (isDinas && filterBeban) {
      if (filterBeban === "Kepsek_ALL") {
        result = result.filter(item => item.Beban_Tugas === "Kepala Sekolah" || item.Beban_Tugas === "PLT. Kepala Sekolah");
      } else if (filterBeban === "Guru Kelas") {
        result = result.filter(item => item.Beban_Tugas === "Guru Kelas" || item.Beban_Tugas === "Guru Kelas TK");
      } else if (filterBeban === "Guru Mapel") {
        result = result.filter(item => {
          const b = item.Beban_Tugas || "";
          return b.startsWith("Guru Mapel - ") || b === "Guru PAI" || b === "Guru PJOK" || b === "Guru Bahasa Inggris";
        });
      } else {
        result = result.filter(item => item.Beban_Tugas === filterBeban);
      }
    }

    // Filter by mapel specific
    if (isDinas && filterMapel) {
      result = result.filter(item => {
        const b = item.Beban_Tugas || "";
        if (filterMapel === "PAI" && (b === "Guru PAI" || b === "Guru Mapel - PAI")) return true;
        if (filterMapel === "PJOK" && (b === "Guru PJOK" || b === "Guru Mapel - PJOK")) return true;
        if (filterMapel === "Bahasa Inggris" && (b === "Guru Bahasa Inggris" || b === "Guru Mapel - Bahasa Inggris")) return true;
        return b === `Guru Mapel - ${filterMapel}`;
      });
    }

    // Filter by sertifikasi
    if (isDinas && filterSertifikasi) {
      result = result.filter(item => item.Sertifikasi === filterSertifikasi);
    }

    // Filter by warning states (Kondisi)
    if (isDinas && filterKondisi) {
      const allowed = ["PNS", "PPPK", "PPPKPW"];
      if (filterKondisi === "Pensiun") {
        result = result.filter(item => item.isPensiun && allowed.includes(item.Status_Pegawai));
      } else if (filterKondisi === "Mendekati") {
        result = result.filter(item => item.isMendekatiPensiun && !item.isPensiun && allowed.includes(item.Status_Pegawai));
      } else if (filterKondisi === "TelatNaik") {
        result = result.filter(item => item.telatNaikPangkat && item.Status_Pegawai === "PNS");
      } else if (filterKondisi === "AkanKGB") {
        result = result.filter(item => item.akanKgb && item.Status_Pegawai === "PNS");
      } else if (filterKondisi === "TelatKGB") {
        result = result.filter(item => item.telatKgb && item.Status_Pegawai === "PNS");
      }
    }

    // --- LOGIKA PENGURUTAN (SORTING) ---
    const statusWeight: Record<string, number> = { "PNS": 1, "PPPK": 2, "PPPKPW": 3, "Honorer": 4 };
    const golWeight: Record<string, number> = {
      // PNS Weights
      "IV/e": 1, "IV/d": 2, "IV/c": 3, "IV/b": 4, "IV/a": 5,
      "III/d": 6, "III/c": 7, "III/b": 8, "III/a": 9,
      "II/d": 10, "II/c": 11, "II/b": 12, "II/a": 13,
      // PPPK Weights
      "XVII": 14, "XVI": 15, "XV": 16, "XIV": 17, "XIII": 18,
      "XII": 19, "XI": 20, "X": 21, "IX": 22, "VIII": 23,
      "VII": 24, "VI": 25, "V": 26, "IV": 27, "III": 28,
      "II": 29, "I": 30
    };

    result.sort((a, b) => {
      // 1. Kecamatan (A-Z)
      const kecA = (a.Kecamatan || "").toUpperCase();
      const kecB = (b.Kecamatan || "").toUpperCase();
      if (kecA !== kecB) return kecA.localeCompare(kecB);

      // 2. Sekolah
      const sekA = (a.Sekolah || "").toUpperCase();
      const sekB = (b.Sekolah || "").toUpperCase();
      if (sekA !== sekB) return sekA.localeCompare(sekB, undefined, { numeric: true, sensitivity: 'base' });

      // 3. Status Kepegawaian (PNS > PPPK > PPPKPW > Honorer)
      const s1 = statusWeight[a.Status_Pegawai] || 99;
      const s2 = statusWeight[b.Status_Pegawai] || 99;
      if (s1 !== s2) return s1 - s2;

      // 4. Pangkat / Golongan Ruang (Tertinggi ke Terendah)
      const g1 = golWeight[a.Golongan] || 99;
      const g2 = golWeight[b.Golongan] || 99;
      if (g1 !== g2) return g1 - g2;

      // 5. NIP DOB sequence
      const nipA = a.NIP || "";
      const nipB = b.NIP || "";
      const dobA = nipA.length >= 8 ? nipA.substring(0, 8) : "99999999";
      const dobB = nipB.length >= 8 ? nipB.substring(0, 8) : "99999999";
      if (dobA !== dobB) return dobA.localeCompare(dobB);

      // 6. Nama (A-Z)
      const nameA = (a.Nama || "").toLowerCase();
      const nameB = (b.Nama || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return result;
  }, [gtkList, searchTerm, filterJenjang, filterKecamatan, filterSekolah, filterStatus, filterBeban, filterMapel, filterSertifikasi, filterKondisi]);

  // Derived pagination variables
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedGtkList.length / rowsPerPage) || 1;
  }, [filteredAndSortedGtkList.length, rowsPerPage]);

  const activePage = useMemo(() => {
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = useMemo(() => {
    return (activePage - 1) * rowsPerPage;
  }, [activePage, rowsPerPage]);

  const endIndex = useMemo(() => {
    return Math.min(startIndex + rowsPerPage, filteredAndSortedGtkList.length);
  }, [startIndex, rowsPerPage, filteredAndSortedGtkList.length]);

  const paginatedGtkList = useMemo(() => {
    return filteredAndSortedGtkList.slice(startIndex, endIndex);
  }, [filteredAndSortedGtkList, startIndex, endIndex]);

  // Reset all filters in a single action
  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterJenjang("");
    setFilterKecamatan("");
    setFilterSekolah("");
    setFilterStatus("");
    setFilterBeban("");
    setFilterMapel("");
    setFilterSertifikasi("");
    setFilterKondisi("");
  };

  // Determine cascading schools based on selected Kecamatan
  const cascadingSchools = useMemo(() => {
    if (filterKecamatan) {
      return schools.filter(s => s.kec === filterKecamatan);
    }
    return schools;
  }, [filterKecamatan, schools]);

  const hasActiveFilters = 
    searchTerm || filterJenjang || filterKecamatan || filterSekolah || 
    filterStatus || filterBeban || filterMapel || filterSertifikasi || filterKondisi;

  const totalPersonnel = gtkList.length;
  const filteredCount = filteredAndSortedGtkList.length;

  // Print triggered routine
  const handleCetakLaporanSubmit = (config: any) => {
    if (session) {
      printLaporan(filteredAndSortedGtkList, session.role, session.identifier, config);
    }
  };

  const handleCetakAction = () => {
    if (filteredAndSortedGtkList.length === 0) {
      return alert("Daftar cetak kosong!");
    }
    if (session?.role === "Admin Dinas") {
      setOpenCetakOptionsModal(true);
    } else {
      // standard school direct format layout
      if (session) {
        printLaporan(filteredAndSortedGtkList, session.role, session.identifier);
      }
    }
  };

  const handleExportExcelAction = () => {
    if (filteredAndSortedGtkList.length === 0) {
      return alert("Daftar unduhan kosong!");
    }
    if (session?.role === "Admin Dinas") {
      exportExcelDinas(filteredAndSortedGtkList);
    } else {
      const namaSekolah = session?.identifier.split("|")[1] || "SEKOLAH";
      exportExcelSekolah(filteredAndSortedGtkList, namaSekolah);
    }
  };

  const handleOpenAddGtkModal = () => {
    setSelectedGtkItem(null);
    setOpenGtkModal(true);
  };

  const handleOpenEditGtkModal = (item: GtkItem) => {
    setSelectedGtkItem(item);
    setOpenGtkModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#13100e] text-[#d4cdcb] antialiased font-sans selection:bg-[#f25c05]/30 selection:text-white">
      
      {/* 1. Database Connection Alert Bar */}
      {/* <DbAlert status={dbStatus} onRefresh={fetchMetadata} /> */}

      {!session ? (
        // 2. Authentication Screen
        <LoginView 
          schools={schools} 
          kecamatans={kecamatans} 
          onLoginSuccess={setSession} 
        />
      ) : (
        // 3. Operational Workspace with Left Sidebar
        <div className="flex flex-1 relative min-h-screen overflow-hidden">
          
          {/* MOBILE SIDEBAR PANEL (DRAWER) */}
          {mobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 md:hidden transition-all duration-300"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <div 
                className="w-72 bg-[#141110] border-r border-[#27211e] h-full p-6 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  {/* Close button & brand */}
                  <div className="flex justify-between items-center pb-5 border-b border-[#2d2420]/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#1c1715] p-1.5 border border-[#2d2420] flex items-center justify-center">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/5/50/Lambang_Kabupaten_Bulukumba.svg" 
                          alt="Bulukumba logo"
                          className="h-6 w-auto"
                        />
                      </div>
                      <div>
                        <h2 className="text-xs font-black text-white tracking-widest uppercase">SI PTK DIKBUD</h2>
                        <span className="text-[8px] font-bold text-stone-550 uppercase tracking-widest block">KAB. BULUKUMBA</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileSidebarOpen(false)}
                      className="text-stone-400 hover:text-white transition p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Profile widget */}
                  <div className="p-3.5 rounded-xl bg-[#1c1715] border border-[#2d2420] flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f25c05] to-amber-500 flex items-center justify-center text-white font-black text-sm border border-[#2d2420]">
                        {session.role === "Admin Dinas" ? "AD" : (session.identifier.split("|")[1]?.substring(0, 2).toUpperCase() || "AS")}
                      </div>
                      <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-orange-500 ring-2 ring-[#1c1715]"></span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-white truncate max-w-[150px]">
                        {session.role === "Admin Dinas" ? "Admin Dinas" : (session.identifier.split("|")[1] || "Admin Sekolah")}
                      </p>
                      <span className="text-[9px] text-stone-550 font-bold block uppercase mt-0.5">{session.role}</span>
                    </div>
                  </div>

                  {/* Nav Links */}
                  <nav className="space-y-1.5 pt-4">
                    <button
                      onClick={() => {
                        setActiveTab("dashboard");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                        activeTab === "dashboard"
                          ? "bg-[#f25c05] text-white shadow-md shadow-[#f25c05]/15"
                          : "text-stone-400 hover:text-white hover:bg-[#1c1715]"
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("data");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-155 cursor-pointer ${
                        activeTab === "data"
                          ? "bg-[#f25c05] text-white shadow-md shadow-[#f25c05]/15"
                          : "text-stone-400 hover:text-white hover:bg-[#1c1715]"
                      }`}
                    >
                      <UsersIcon className="h-4 w-4" />
                      <span>Daftar PTK</span>
                    </button>

                    {/* General administration sub dividers */}
                    <div className="text-[9px] font-black text-stone-600 tracking-widest uppercase pt-5 pb-1.5 px-3">
                      Layanan &amp; Otoritas
                    </div>

                    {/* School List trigger (Dinas Admin Only) */}
                    {session.role === "Admin Dinas" && (
                      <button
                        onClick={() => {
                          setOpenSchoolModal(true);
                          setMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                      >
                        <Settings className="h-4 w-4 text-stone-500" />
                        <span>Kelola Sekolah</span>
                      </button>
                    )}

                    {/* Duplicate Scanning (Dinas Admin Only) */}
                    {session.role === "Admin Dinas" && (
                      <button
                        onClick={() => {
                          setOpenDataGandaModal(true);
                          setMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-stone-450 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                      >
                        <Copy className="h-4 w-4 text-stone-550" />
                        <span>Scan Data Ganda</span>
                      </button>
                    )}

                    {/* Manage Password (Dinas Admin Only) */}
                    {session.role === "Admin Dinas" && (
                      <button
                        onClick={() => {
                          setOpenManagePasswordsModal(true);
                          setMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-stone-450 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                      >
                        <UsersIcon className="h-4 w-4 text-stone-555" />
                        <span>Kelola Password</span>
                      </button>
                    )}

                    {/* Change Password (School user) */}
                    {session.role === "Sekolah" && (
                      <button
                        onClick={() => {
                          setOpenChangePasswordModal(true);
                          setMobileSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium text-stone-455 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                      >
                        <KeyRound className="h-4 w-4 text-stone-550" />
                        <span>Ganti Password</span>
                      </button>
                    )}
                  </nav>
                </div>

                <div className="pt-6 border-t border-[#2d2420]/50">
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#241a16] text-red-400 hover:bg-red-950/20 rounded-xl text-xs font-bold transition cursor-pointer border border-[#3e2b21]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar Akun</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP PERMANENT LEFT SIDEBAR */}
          <aside className="hidden md:flex flex-col w-64 bg-[#141110] border-r border-[#27211e] p-6 shrink-0 justify-between select-none">
            <div className="space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3 pb-6 border-b border-[#2d2420]/40">
                <div className="w-11 h-11 rounded-full bg-[#1c1715] p-2 border border-[#2d2420] flex items-center justify-center">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/5/50/Lambang_Kabupaten_Bulukumba.svg" 
                    alt="Bulukumba logo"
                    className="h-8 w-auto"
                  />
                </div>
                <div>
                  <h2 className="text-xs font-black text-white tracking-widest uppercase">SI PTK DIKBUD</h2>
                  <span className="text-[9px] font-bold text-[#f25c05] uppercase tracking-widest block mt-0.5">KAB. BULUKUMBA</span>
                </div>
              </div>

              {/* User Identity Profile (Matching layout avatar from image) */}
              <div className="my-5 p-4 rounded-xl bg-[#1c1715] border border-[#2d2420] flex items-center gap-3 shadow-md shadow-black/20">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#27211e] flex items-center justify-center text-white border border-[#2d2420] overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-[#f25c05] to-amber-500 flex items-center justify-center text-white font-black text-sm uppercase">
                      {session.role === "Admin Dinas" ? "AD" : (session.identifier.split("|")[1]?.substring(0, 2).toUpperCase() || "AS")}
                    </div>
                  </div>
                  {/* Active indicator bead */}
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-[#1c1715]"></span>
                </div>
                <div className="overflow-hidden">
                  <p 
                    className="text-xs font-black text-white truncate max-w-[130px]" 
                    title={session.role === "Admin Dinas" ? "Admin Dinas" : (session.identifier.split("|")[1] || "Admin Sekolah")}
                  >
                    {session.role === "Admin Dinas" ? "Admin Dinas" : (session.identifier.split("|")[1] || "Admin Sekolah")}
                  </p>
                </div>
              </div>

              {/* Navigation Menu Links */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-[#f25c05] text-white shadow-xl shadow-[#f25c05]/20"
                      : "text-[#7a6f69] hover:text-white hover:bg-[#1c1715]/90"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveTab("data")}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    activeTab === "data"
                      ? "bg-[#f25c05] text-white shadow-xl shadow-[#f25c05]/20"
                      : "text-[#7a6f69] hover:text-white hover:bg-[#1c1715]/90"
                  }`}
                >
                  <UsersIcon className="h-4 w-4" />
                  <span>Daftar PTK</span>
                </button>

                <div className="text-[9px] font-black text-stone-600 tracking-widest uppercase pt-6 pb-2 px-3.5 border-t border-[#2d2420]/30 mt-6">
                  Admin Utilities
                </div>

                {/* Manage Schools trigger (Dinas Only) */}
                {session.role === "Admin Dinas" && (
                  <button
                    onClick={() => setOpenSchoolModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                  >
                    <Settings className="h-4 w-4 text-stone-500" />
                    <span>Kelola Sekolah</span>
                  </button>
                )}

                {/* Scan Data Ganda (Dinas Only) */}
                {session.role === "Admin Dinas" && (
                  <button
                    onClick={() => setOpenDataGandaModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-455 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                  >
                    <Copy className="h-4 w-4 text-stone-550" />
                    <span>Scan Data Ganda</span>
                  </button>
                )}

                {/* Manage Passwords (Dinas Only) */}
                {session.role === "Admin Dinas" && (
                  <button
                    onClick={() => setOpenManagePasswordsModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-455 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                  >
                    <UsersIcon className="h-4 w-4 text-stone-550" />
                    <span>Kelola Password</span>
                  </button>
                )}

                {/* Change Password (School Only) */}
                {session.role === "Sekolah" && (
                  <button
                    onClick={() => setOpenChangePasswordModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-450 hover:text-white hover:bg-[#1c1715] transition cursor-pointer"
                  >
                    <KeyRound className="h-4 w-4 text-stone-550" />
                    <span>Ganti Password</span>
                  </button>
                )}
              </nav>
            </div>

            
          </aside>

          {/* MAIN APPLICATION CONTAINER SCREEN */}
          <div className="flex-1 flex flex-col overflow-y-auto bg-[#13100e]">
            
            {/* Styled Upper Header bar */}
            <header className="bg-[#141110] border-b border-[#27211e] px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md animate-fade-in">
              <div className="flex items-center gap-3">
                {/* Hamburger triggers on smaller screens */}
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden text-stone-300 hover:text-[#f25c05] transition p-1 cursor-pointer"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {activeTab === "dashboard" ? "Beranda Sistem" : "Daftar PTK"}
                  </h1>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 hidden sm:block">
                    Dinas Pendidikan &amp; Kebudayaan Kabupaten Bulukumba
                  </p>
                </div>
              </div>

              {/* System State Info badges */}
              <div className="flex items-center gap-3.5">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#1a1412] border border-[#2d2420] rounded-lg text-[10px] font-bold text-stone-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Supabase Sync</span>
                </div>
                
                {/* Tombol Keluar (Logout) in the top-right corner replacing the avatar */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#241a16] text-red-400 hover:bg-red-950/30 hover:text-red-300 border border-red-900/40 hover:border-red-500/30 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Keluar Aplikasi"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </header>

            {/* Render Tab Contents */}
            <main className="flex-grow p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
              
              {activeTab === "dashboard" ? (
                // A. THE PREMIUM DASHBOARD VIEW PANEL
                <DashboardView 
                  gtkList={gtkList}
                  session={session}
                  kecamatans={kecamatans}
                  schools={schools}
                  onNavigateToData={() => setActiveTab("data")}
                />
              ) : (
                // B. THE PRIMARY DUK LIST GRID & FILTERS PANEL
                <div className="space-y-6">
                  
                  {/* List Header control panel */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2d2420]/30 pb-4">
                    

                    {/* Operational triggers */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                      
                      {/* Refresh data list */}
                      <button
                        onClick={handleReloadGtkList}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1c1715] border border-[#2d2420] hover:bg-[#251e1b] hover:border-stone-700 text-stone-300 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        title="Tarik Data"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        <span>Reload</span>
                      </button>

                      {/* Export spreadsheet sheet */}
                      <button
                        onClick={handleExportExcelAction}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1c1715] border border-[#2d2420] text-amber-500 hover:bg-[#251e1b] hover:border-amber-500/20 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Unduh format spreadsheet"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Excel</span>
                      </button>

                      {/* Print PDF / DUK Options */}
                      <button
                        onClick={handleCetakAction}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1c1715] border border-[#2d2420] text-stone-300 hover:bg-[#251e1b] hover:border-stone-750 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Cetak PDF / DUK"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Cetak DUK</span>
                      </button>

                      {/* Primary Add PTK action */}
                      <button
                        onClick={handleOpenAddGtkModal}
                        className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-[#f25c05] hover:bg-[#de5203] text-white rounded-lg text-xs font-extrabold uppercase tracking-widest shadow-lg shadow-[#f25c05]/10 hover:shadow-none transition cursor-pointer ml-auto sm:ml-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah PTK</span>
                      </button>

                    </div>
                  </div>

                  {/* Filter selector layout (Admin Dinas Only matches layout, otherwise simple scoped) */}
                  {session.role === "Admin Dinas" ? (
                    <div className="bg-[#1c1715] rounded-2xl shadow-xl border border-[#2d2420] p-5 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        
                        {/* Jenny */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Mata Jenjang</label>
                          <select
                            value={filterJenjang}
                            onChange={(e) => setFilterJenjang(e.target.value)}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Jenjang</option>
                            <option value="TK">TK (Kependidikan TK)</option>
                            <option value="SD">SD (Sekolah Dasar)</option>
                            <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                          </select>
                        </div>

                        {/* Kecamatan */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Kecamatan</label>
                          <select
                            value={filterKecamatan}
                            onChange={(e) => {
                              setFilterKecamatan(e.target.value);
                              setFilterSekolah("");
                            }}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Kecamatan</option>
                            {kecamatans.map(k => (
                              <option key={k} value={k}>{k}</option>
                            ))}
                          </select>
                        </div>

                        {/* School */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Nama Sekolah</label>
                          <select
                            value={filterSekolah}
                            onChange={(e) => setFilterSekolah(e.target.value)}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black disabled:bg-[#1c1715]"
                          >
                            <option value="">Semua Sekolah</option>
                            {cascadingSchools.map(s => (
                              <option key={s.id} value={s.nama}>{s.nama}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status kepegawaian */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Status Kepegawaian</label>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Status</option>
                            <option value="PNS">PNS (Pegawai Negeri Sipil)</option>
                            <option value="PPPK">PPPK (Pekerjaan Perjanjian Kerja)</option>
                            <option value="PPPKPW">PPPKPW</option>
                            <option value="PPPK_ALL">PPPK &amp; PPPKPW</option>
                            <option value="Honorer">Honorer</option>
                          </select>
                        </div>

                        {/* Beban Tugas */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Beban Tugas</label>
                          <select
                            value={filterBeban}
                            onChange={(e) => {
                              setFilterBeban(e.target.value);
                              setFilterMapel("");
                            }}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Beban</option>
                            <option value="Kepsek_ALL">Kepala Sekolah / PLT</option>
                            <option value="Guru Kelas">Guru Kelas (SD/TK)</option>
                            <option value="Guru Mapel">Guru Mapel</option>
                            <option value="Guru BK">Guru BK</option>
                            <option value="Operator Sekolah">Operator Sekolah</option>
                            <option value="Staf Administrasi (TU)">Administrasi / Staf TU</option>
                            <option value="Bujang Sekolah">Bujang Sekolah</option>
                            <option value="Satpam">Satpam</option>
                          </select>
                        </div>

                        {/* cond Mapel */}
                        {filterBeban === "Guru Mapel" && (
                          <div className="animate-fade-in col-span-1 border-t border-[#f25c05]/10 pt-2 md:border-none md:pt-0">
                            <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Kategori Mapel</label>
                            <select
                              value={filterMapel}
                              onChange={(e) => setFilterMapel(e.target.value)}
                              className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                            >
                              <option value="">Semua Kategori Mapel</option>
                              {["PAI", "PJOK", "Bahasa Inggris", "IPA", "IPS", "Seni Budaya", "Informatika", "Bahasa Indonesia", "PKn", "Prakarya", "BK"].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Sertifikasi */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Status Sertifikasi</label>
                          <select
                            value={filterSertifikasi}
                            onChange={(e) => setFilterSertifikasi(e.target.value)}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Status Sertifikasi</option>
                            <option value="Ya">Sudah Sertifikasi</option>
                            <option value="Belum">Belum Sertifikasi</option>
                          </select>
                        </div>

                        {/* Pensions or special issues */}
                        <div>
                          <label className="block text-[9px] font-extrabold text-stone-500 uppercase tracking-widest mb-1">Analisa Khusus</label>
                          <select
                            value={filterKondisi}
                            onChange={(e) => setFilterKondisi(e.target.value)}
                            className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-black"
                          >
                            <option value="">Semua Kondisi</option>
                            <option value="Pensiun">Sudah Pensiun</option>
                            <option value="Mendekati">Mendekati Pensiun (&lt;= 1 Tahun)</option>
                            <option value="TelatNaik">Telat Naik Pangkat (&gt; 4 Tahun)</option>
                            <option value="AkanKGB">Akan KGB (&lt;= 3 Bulan)</option>
                            <option value="TelatKGB">Telat KGB (&gt; 2 Tahun)</option>
                          </select>
                        </div>

                        {/* Reset selection */}
                        <div className="flex items-end">
                          <button
                            onClick={handleResetFilters}
                            disabled={!hasActiveFilters}
                            className={`w-full py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              hasActiveFilters 
                                ? "bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-900/35" 
                                : "bg-[#181412] border-[#221c1a]/50 text-stone-650 cursor-not-allowed"
                            }`}
                          >
                            <FilterX className="h-4 w-4" />
                            <span>Reset Filters</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  ) : null}

                  {/* List presenting card frame */}
                  <div className="bg-[#1c1715] rounded-2xl shadow-xl border border-[#2d2420] overflow-hidden">
                    
                    {/* Search row inside table block */}
                    <div className="p-4 border-b border-[#2d2420] bg-[#1e1917]/20 flex flex-col sm:flex-row justify-between items-center gap-3.5">
                      <div className="relative w-full sm:max-w-md">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-500">
                          <Search className="h-4 w-4" />
                        </span>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Cari berdasarkan nama, NIP atau NIK..."
                          className="w-full bg-[#13100e] border border-[#2d2420] rounded-lg pl-9 pr-4 py-2 text-xs text-stone-300 focus:outline-none focus:border-[#f25c05]/50 font-bold"
                        />
                      </div>
                      
                      <div className="text-xs text-stone-500 font-bold">
                        Menampilkan <span className="text-[#f25c05] font-black">{filteredAndSortedGtkList.length > 0 ? startIndex + 1 : 0} - {endIndex}</span> dari <span className="text-stone-300 font-extrabold">{filteredCount}</span> ptk ({totalPersonnel} total)
                      </div>
                    </div>

                    {/* Table rendering content */}
                    {loading ? (
                      <div className="py-24 text-center text-stone-550 font-medium space-y-3">
                        <RefreshCw className="h-10 w-10 animate-spin text-[#f25c05] mx-auto" />
                        <p className="text-xs font-black uppercase tracking-widest text-[#f25c05]">Sinkronisasi Supabase kepegawaian...</p>
                      </div>
                    ) : filteredAndSortedGtkList.length === 0 ? (
                      <div className="py-20 text-center text-stone-500 space-y-3">
                        <HelpCircle className="h-12 w-12 mx-auto text-stone-700" />
                        <p className="font-extrabold text-sm text-stone-300">Tidak ada personel ditemukan</p>
                        <p className="text-xs text-stone-550">Sesuai filter pencarian / wilayah kerja Anda.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto w-full">
                        <table className="w-full text-left text-xs text-stone-400 border-collapse table-auto break-words select-text">
                          <thead className="bg-[#141110] text-stone-500 font-bold border-b border-[#2d2420]">
                            <tr>
                              <th className="p-3 text-center w-10">No</th>
                              <th className="p-3 min-w-44">Identitas &amp; Kontak</th>
                              {session.role === "Admin Dinas" && <th className="p-3 min-w-36">Lokasi Kerja Kec.</th>}
                              <th className="p-3">Kepegawaian &amp; NIP</th>
                              <th className="p-3 min-w-36">Golongan &amp; Edukasi</th>
                              <th className="p-3">Beban Tugas Pokok</th>
                              <th className="p-3">Kondisi / Deteksi</th>
                              <th className="p-3 text-center w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#2d2420]/50">
                            {paginatedGtkList.map((item, index) => {
                              const today = new Date();
                              const displayHp = formatHpDisplay(item.No_HP);
                              const waLink = `https://wa.me/62${displayHp.substring(1)}`;

                              let warnings: { text: string; severity: "yellow" | "red" }[] = [];
                              
                              // Warnings compute
                              if (["PNS", "PPPK", "PPPKPW"].includes(item.Status_Pegawai)) {
                                if (item.Beban_Tugas === "Kepala Sekolah" && item.TMT_Kepsek_Formatted) {
                                  try {
                                    const tmtK = new Date(item.TMT_Kepsek_Formatted);
                                    const dynamicYears = today.getFullYear() - tmtK.getFullYear();
                                    
                                    if (dynamicYears >= 12) {
                                      warnings.push({ text: `${dynamicYears} Th menjabat Kepsek`, severity: "red" });
                                    } else if (dynamicYears >= 8) {
                                      warnings.push({ text: `${dynamicYears} Th menjabat (Prioritas Evaluasi)`, severity: "red" });
                                    } else if (dynamicYears >= 4) {
                                      warnings.push({ text: `${dynamicYears} Th MENJADI Kepsek`, severity: "yellow" });
                                    }
                                  } catch (e) {}
                                }

                                if (item.isPensiun) {
                                  warnings.push({ text: "Sudah Memasuki Usia Pensiun", severity: "red" });
                                } else if (item.isMendekatiPensiun) {
                                  warnings.push({ text: "Mendekati Pensiun (<= 1 Th)", severity: "yellow" });
                                }

                                if (item.telatNaikPangkat && item.Status_Pegawai === "PNS") {
                                  warnings.push({ text: "Telat Naik Pangkat (> 4 Th)", severity: "red" });
                                }

                                if (item.Status_Pegawai === "PNS") {
                                  if (item.telatKgb && item.kgbWarningMessage) {
                                    warnings.push({ text: item.kgbWarningMessage, severity: "red" });
                                  } else if (item.akanKgb && item.kgbWarningMessage) {
                                    warnings.push({ text: item.kgbWarningMessage, severity: "yellow" });
                                  }
                                }
                              }

                              const isKepsek = item.Beban_Tugas === "Kepala Sekolah" || item.Beban_Tugas === "PLT. Kepala Sekolah";
                              const isDinas = session.role === "Admin Dinas";

                              let displayPangkat = getPangkatLengkap(item.Golongan) || "-";
                              if (item.Status_Pegawai === "PPPK") displayPangkat = `Golongan ${item.Golongan}`;
                              if (item.Status_Pegawai === "PPPKPW" || item.Status_Pegawai === "Honorer") displayPangkat = "-";

                              return (
                                <tr key={`${item.ID || 'gtk'}-${index}`} className="hover:bg-[#201a18]/45 transition align-top border-b border-[#2d2420]/35 bg-[#1c1715]/40 even:bg-[#1f1a18]/25">
                                  <td className="p-3 text-center font-mono text-stone-605 header-no">{startIndex + index + 1}</td>
                                  
                                  <td className="p-3">
                                    <span className={`block font-black text-sm leading-tight ${isDinas && isKepsek ? "text-[#f25c05]" : "text-stone-100"}`}>
                                      {item.Nama}
                                    </span>
                                    <span className="text-[10px] text-stone-550 font-mono block mt-1.5 font-semibold">NIK: {item.NIK}</span>
                                    {isDinas && displayHp && (
                                      <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold block mt-1.5 hover:underline w-max flex items-center gap-0.5"
                                      >
                                        <MessageCircle className="h-3 w-3 text-emerald-400" />
                                        <span>{displayHp}</span>
                                      </a>
                                    )}
                                  </td>

                                  {isDinas && (
                                    <td className="p-3">
                                      <span className="font-extrabold text-stone-200 uppercase block leading-tight">{item.Sekolah}</span>
                                      <span className="text-[10px] text-stone-500 font-bold">{item.Kecamatan}</span>
                                    </td>
                                  )}

                                  <td className="p-3">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                      item.Status_Pegawai === "PNS"
                                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                                        : item.Status_Pegawai === "PPPK" || item.Status_Pegawai === "PPPKPW"
                                        ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    }`}>
                                      {item.Status_Pegawai}
                                    </span>
                                    <span className="text-[10px] text-stone-550 font-mono block mt-2.5">{item.NIP || "No NIP/Honorer"}</span>
                                  </td>

                                  <td className="p-3">
                                    <span className="font-bold text-stone-200 block text-xs">{displayPangkat}</span>
                                    {item.TMT_Golongan_Formatted && (
                                      <span className="text-[10px] text-stone-555 block mt-0.5">TMT Pangkat: {formatTanggalIndo(item.TMT_Golongan_Formatted)}</span>
                                    )}
                                    {item.Status_Pegawai === "PNS" && item.TMT_KGB_Terakhir_Formatted && (
                                      <span className="text-[10px] text-stone-555 block mt-0.5">TMT KGB: {formatTanggalIndo(item.TMT_KGB_Terakhir_Formatted)}</span>
                                    )}
                                    <span className="text-[10px] text-stone-400 font-bold block mt-1.5 flex items-center gap-0.5">
                                      <GraduationCap className="h-3.5 w-3.5 text-stone-600" />
                                      <span>Pendidikan: {item.Pendidikan}</span>
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    <span className="font-black text-stone-100 block text-xs leading-tight">{item.Beban_Tugas || "-"}</span>
                                    <span className="text-[10px] text-stone-500 block mt-1 font-bold">{item.Jabatan || "-"}</span>
                                    {isKepsek && item.TMT_Kepsek_Formatted && (
                                      <span className="text-[10px] text-[#f25c05] font-black block mt-0.5">TMT Kepsek: {formatTanggalIndo(item.TMT_Kepsek_Formatted)}</span>
                                    )}
                                    {item.Sertifikasi === "Ya" ? (
                                      <span className="text-blue-400 font-extrabold text-[10px] block mt-1.5 flex items-center gap-0.5">
                                        <Award className="h-3 w-3 text-blue-400" />
                                        <span>Sertifikasi ({item.Mapel})</span>
                                      </span>
                                    ) : (
                                      <span className="text-stone-600 text-[10px] font-bold block mt-1.5">No Sertifikasi</span>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    {warnings.length === 0 ? (
                                      <span className="text-emerald-400 text-[10px] font-bold border border-emerald-500/25 bg-emerald-500/5 px-2 py-1 rounded">
                                        ✓ Data Aman
                                      </span>
                                    ) : (
                                      <div className="space-y-1">
                                        {warnings.map((warn, wIdx) => (
                                          <span
                                            key={wIdx}
                                            className="bg-yellow-950/40 text-yellow-300 border border-yellow-500/50 text-[9px] font-black px-1.5 py-0.5 rounded block w-max leading-tight uppercase animate-pulse"
                                          >
                                            ⚠ {warn.text}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    <div className="flex justify-center items-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditGtkModal(item)}
                                        className="text-xs font-black text-stone-300 hover:text-white bg-[#27211e] border border-[#2d2420] hover:bg-stone-800 px-2 py-1 rounded transition cursor-pointer font-sans"
                                        title="Edit data ini"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteGtk(item)}
                                        className="text-xs font-black text-red-540 hover:text-red-300 bg-red-950/15 border border-red-900/30 hover:bg-red-900/20 px-2 py-1 rounded transition cursor-pointer font-sans"
                                        title="Hapus permanen"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls Footer block styled exactly like the user image */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#141110] border-t border-[#2d2420] rounded-b-lg">
                        <div className="text-xs text-stone-550 font-bold">
                          Menampilkan <span className="text-[#f25c05] font-black">{filteredAndSortedGtkList.length > 0 ? startIndex + 1 : 0} - {endIndex}</span> dari <span className="text-stone-300 font-extrabold">{filteredCount}</span> ptk terpilih
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Previous Button */}
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={activePage === 1}
                            className="p-1.5 bg-[#13100e] border border-[#2d2420]/80 rounded-lg text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800/80 transition duration-150 cursor-pointer"
                            title="Halaman Sebelumnya"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>

                          {/* Page Info */}
                          <div className="flex items-center gap-2 text-xs text-stone-400 font-extrabold">
                            <span>Page</span>
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={currentPage}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setCurrentPage(Math.max(1, Math.min(val, totalPages)));
                                }
                              }}
                              className="w-12 bg-[#13100e] border border-[#2d2420]/80 rounded px-1.5 py-1 text-center text-stone-200 focus:outline-none focus:border-[#f25c05]/50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span>of {totalPages}</span>
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={activePage === totalPages}
                            className="p-1.5 bg-[#13100e] border border-[#2d2420]/80 rounded-lg text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-800/80 transition duration-150 cursor-pointer"
                            title="Halaman Berikutnya"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Rows per page selector exactly following the visual of the user */}
                          <div className="relative">
                            <select
                              value={rowsPerPage}
                              onChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setCurrentPage(1);
                              }}
                              className="appearance-none bg-[#13100e] border border-[#2d2420]/80 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-stone-200 focus:outline-none focus:border-[#f25c05]/40 hover:bg-stone-800/20 transition cursor-pointer"
                            >
                              <option value={50}>50 rows</option>
                              <option value={100}>100 rows</option>
                              <option value={200}>200 rows</option>
                              <option value={500}>500 rows</option>
                              <option value={1000}>1000 rows</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  </div>

                </div>
              )}

            </main>

            {/* Premium branding footer block matching the dark image workspace */}
            <footer className="bg-[#141110] border-t border-[#27211e] text-stone-550 py-6 text-center text-xs font-bold w-full">
              <div className="max-w-7xl mx-auto px-6 space-y-1.5">
                <p>© 2026 SI PTK DIKBUD — Pemerintah Kabupaten Bulukumba</p>
                <p className="text-[10px] text-stone-605 uppercase tracking-widest">SISTEM INFORMASI PENDIDIKAN DAN TENAGA KEPENDIDIKAN</p>
              </div>
            </footer>

          </div>

        </div>
      )}

      {/* Setup Modal Views (Managed cleanly remain unaltered) */}
      <ModalSchool 
        schools={schools}
        kecamatans={kecamatans}
        isOpen={openSchoolModal}
        onClose={() => setOpenSchoolModal(false)}
        onRefreshSchools={fetchMetadata}
      />

      <ModalGtk 
        schools={schools}
        kecamatans={kecamatans}
        isOpen={openGtkModal}
        onClose={() => {
          setOpenGtkModal(false);
          setSelectedGtkItem(null);
        }}
        gtkToEdit={selectedGtkItem}
        viewerRole={session?.role || ""}
        viewerIdentifier={session?.identifier || ""}
        onSaveSuccess={handleReloadGtkList}
      />

      <ModalManagePasswords 
        schools={schools}
        kecamatans={kecamatans}
        isOpen={openManagePasswordsModal}
        onClose={() => setOpenManagePasswordsModal(false)}
      />

      <ModalDataGanda 
        gtkData={gtkList}
        isOpen={openDataGandaModal}
        onClose={() => setOpenDataGandaModal(false)}
        onRefreshDataList={handleReloadGtkList}
      />

      <ModalChangePassword 
        session={session}
        isOpen={openChangePasswordModal}
        onClose={() => setOpenChangePasswordModal(false)}
      />

      <ModalCetakOptions 
        isOpen={openCetakOptionsModal}
        onClose={() => setOpenCetakOptionsModal(false)}
        onSubmitCetak={handleCetakLaporanSubmit}
      />

      {gtkToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-xl overflow-hidden bg-[#181412] border border-[#2d2420] text-stone-100 shadow-2xl p-6 relative">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertTriangle className="h-6 w-6 flex-shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">Konfirmasi Hapus</h3>
            </div>
            
            <p className="text-xs text-stone-300 leading-relaxed mb-1 font-medium">
              Apakah Anda yakin ingin menghapus data Personnel berikut secara permanen?
            </p>
            <div className="my-3.5 p-3 rounded bg-zinc-950/45 border border-[#2d2420]/50 font-sans">
              <div className="text-xs font-black text-[#f25c05]">{gtkToDelete.Nama}</div>
              <div className="text-[10px] text-stone-500 mt-1 font-bold">NIP: {gtkToDelete.NIP || "No NIP/Honorer"}</div>
              <div className="text-[10px] text-stone-500 font-bold">NIK: {gtkToDelete.NIK}</div>
              <div className="text-[10px] text-stone-450 font-bold mt-1.5 uppercase">{gtkToDelete.Sekolah}</div>
            </div>

            <p className="text-[11px] text-rose-400 font-bold leading-relaxed mb-5">
              ⚠️ Tindakan ini tidak dapat dibatalkan, data akan langsung dihapus dari Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setGtkToDelete(null)}
                className="px-4 py-2 hover:bg-stone-800 text-stone-400 hover:text-white border border-[#2d2420] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGtk}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-red-950/20 transition cursor-pointer"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
