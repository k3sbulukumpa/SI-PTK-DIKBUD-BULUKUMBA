import React, { useMemo } from "react";
import { GtkItem, UserSession, School } from "../types";
import { 
  Users, Award, Calendar, AlertTriangle, ShieldCheck, 
  MapPin, GraduationCap, ArrowUpRight, CheckSquare, Sparkles 
} from "lucide-react";

interface DashboardViewProps {
  gtkList: GtkItem[];
  session: UserSession;
  kecamatans: string[];
  schools: School[];
  onNavigateToData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  gtkList,
  session,
  kecamatans,
  schools,
  onNavigateToData
}) => {
  const isDinas = session.role === "Admin Dinas";
  const labelKecamatan = isDinas ? "Kabupaten Bulukumba" : session.identifier.split("|")[1];

  // 1. Calculations for General Stats
  const totalPTK = gtkList.length;

  // Filter only Teachers & Principals as requiring certification
  const certifiedEligibleList = useMemo(() => {
    return gtkList.filter(item => {
      const t = item.Beban_Tugas || "";
      return [
        "Kepala Sekolah",
        "PLT. Kepala Sekolah",
        "Guru Kelas",
        "Guru Kelas TK",
        "Guru BK"
      ].includes(t) || t.startsWith("Guru Mapel") || t.startsWith("Guru");
    });
  }, [gtkList]);

  const certifiedCount = useMemo(() => {
    return certifiedEligibleList.filter(item => item.Sertifikasi === "Ya").length;
  }, [certifiedEligibleList]);

  const certifiedPercentage = useMemo(() => {
    const totalCap = certifiedEligibleList.length;
    if (totalCap === 0) return 0;
    return Math.round((certifiedCount / totalCap) * 100);
  }, [certifiedEligibleList, certifiedCount]);

  // 2. Calculations for Kepegawaian Status
  const statusStats = useMemo(() => {
    const stats = { pns: 0, pppk: 0, pppkpw: 0, honorer: 0 };
    gtkList.forEach(item => {
      const s = item.Status_Pegawai;
      if (s === "PNS") stats.pns++;
      else if (s === "PPPK") stats.pppk++;
      else if (s === "PPPKPW") stats.pppkpw++;
      else if (s === "Honorer") stats.honorer++;
    });
    return stats;
  }, [gtkList]);

  // Max value to scale Status bar chart
  const maxStatusCount = useMemo(() => {
    const vals = Object.values(statusStats) as number[];
    return Math.max(...vals, 1);
  }, [statusStats]);

  // 3. Calculation for Beban Tugas (Budget representation)
  const bebanStats = useMemo(() => {
    const stats: Record<string, number> = {
      "Guru Kelas": 0,
      "Guru Mapel": 0,
      "Kepala Sekolah": 0,
      "Lainnya / Staf": 0
    };
    gtkList.forEach(item => {
      const t = item.Beban_Tugas || "";
      if (t.startsWith("Guru Kelas")) {
        stats["Guru Kelas"]++;
      } else if (t.startsWith("Guru Mapel") || t === "Guru PAI" || t === "Guru PJOK" || t === "Guru Bahasa Inggris") {
        stats["Guru Mapel"]++;
      } else if (t === "Kepala Sekolah" || t === "PLT. Kepala Sekolah") {
        stats["Kepala Sekolah"]++;
      } else {
        stats["Lainnya / Staf"]++;
      }
    });
    return stats;
  }, [gtkList]);

  // 4. Calculations for Warnings (Subscriptions representation)
  const alertStats = useMemo(() => {
    const today = new Date();
    const stats = {
      telatPangkat: 0,
      pensiun: 0,
      pensiunMendekati: 0,
      kepsekLama: 0,
      akanKgb: 0,
      telatKgb: 0
    };

    gtkList.forEach(item => {
      const allowed = ["PNS", "PPPK", "PPPKPW"];
      if (item.isPensiun && allowed.includes(item.Status_Pegawai)) {
        stats.pensiun++;
      } else if (item.isMendekatiPensiun && !item.isPensiun && allowed.includes(item.Status_Pegawai)) {
        stats.pensiunMendekati++;
      }

      if (item.telatNaikPangkat && item.Status_Pegawai === "PNS") {
        stats.telatPangkat++;
      }

      if (item.Status_Pegawai === "PNS") {
        if (item.telatKgb) stats.telatKgb++;
        if (item.akanKgb) stats.akanKgb++;
      }

      const isKepsek = item.Beban_Tugas === "Kepala Sekolah" || item.Beban_Tugas === "PLT. Kepala Sekolah";
      if (isKepsek && item.TMT_Kepsek_Formatted) {
        try {
          const tmtK = new Date(item.TMT_Kepsek_Formatted);
          const years = today.getFullYear() - tmtK.getFullYear();
          if (years >= 8) {
            stats.kepsekLama++;
          }
        } catch (e) {}
      }
    });

    return stats;
  }, [gtkList]);

  // 5. Kecamatan distribution (All Transactions top list representation)
  const topKecDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    gtkList.forEach(item => {
      const kec = item.Kecamatan || "Lainnya";
      map[kec] = (map[kec] || 0) + 1;
    });

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [gtkList]);

  return (
    <div className="space-y-6 animate-fade-in text-[#d4cdcb]">
      
      {/* Upper Grid: Cards + All Transactions + Report */}
      <div className={`grid grid-cols-1 ${isDinas ? "lg:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
        
        {/* Card 1: Cards Widget (Stunning Metallic Copper Debit Card vibe) */}
        <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[250px] relative overflow-hidden group">
          
          {/* Accent light shine highlight */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-[#f25c05]/20 to-transparent rounded-full blur-3xl pointer-events-none transition-all duration-300 group-hover:bg-[#f25c05]/30"></div>
          
          <div className="flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold text-stone-550 uppercase tracking-widest">Jumlah Keseluruhan</p>
              <h3 className="text-lg font-black text-white tracking-tight mt-1">PENDIDIK DAN TENAGA KEPENDIDIKAN</h3>
            </div>
            <button 
              onClick={onNavigateToData}
              className="w-8 h-8 rounded-full bg-[#27211e] hover:bg-[#342a26] border border-[#3e322d] flex items-center justify-center text-[#f25c05] transition cursor-pointer"
              title="Kelola Data"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {/* Copper Metallic Card Core */}
          <div className="bg-gradient-to-r from-[#de5203] via-[#ff6f12] to-[#b83e00] text-white p-5 rounded-xl mt-4 shadow-lg flex flex-col justify-between min-h-[140px] border border-[#ff8e45]/20 relative">
            {/* Holographic Chip Decor */}
            <div className="absolute top-4 right-4 w-9 h-7 bg-gradient-to-br from-amber-300/60 to-amber-650/40 rounded-md border border-white/20 filter saturate-150 backdrop-blur-sm shadow-sm flex items-center justify-center">
              <div className="grid grid-cols-3 gap-0.5 w-6 h-4 opacity-50">
                <div className="border border-white/10 rounded-sm"></div>
                <div className="border border-white/10 rounded-sm"></div>
                <div className="border border-white/10 rounded-sm"></div>
                <div className="border border-white/10 rounded-sm"></div>
                <div className="border border-white/10 rounded-sm flex items-center justify-center"></div>
                <div className="border border-white/10 rounded-sm"></div>
              </div>
            </div>

            <div>
              <p className="text-3xl font-black mt-1 font-mono tracking-tight text-white drop-shadow-sm flex items-baseline gap-1">
                {totalPTK.toLocaleString("id-ID")}
                <span className="text-xs font-bold text-orange-200">PTK</span>
              </p>
            </div>

            <div className="flex justify-between items-end mt-4">
              <div>
                <span className="text-[8px] font-extrabold block text-orange-200 uppercase tracking-widest">Wilayah Kerja</span>
                <span className="text-xs font-black tracking-wide text-white drop-shadow-sm">{labelKecamatan}</span>
              </div>
              <div className="flex gap-1">
                {/* Two overlapping circles like Mastercard (Orange/Gold & Yellow) */}
                <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-sm z-10 border border-white/10"></div>
                <div className="w-8 h-8 rounded-full bg-amber-400/80 -ml-4 z-0 border border-amber-300/15"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: All Transactions (Vibrant Kecamatan Top Listings) */}
        {isDinas && (
          <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[250px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#f25c05]" />
                <span>Kecamatan Terpadat</span>
              </h3>
              <span className="text-[10px] font-extrabold text-[#f25c05] bg-[#de5203]/10 px-2 py-0.5 rounded border border-[#de5203]/20 uppercase">
                {topKecDistribution.length} Kecamatan
              </span>
            </div>

            <div className="space-y-3.5 flex-grow max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
              {topKecDistribution.map((kec, index) => {
                // Avatars colored distinct in range
                const colors = ["bg-[#de5203]", "bg-amber-600", "bg-yellow-600"];
                const txtColors = ["text-[#de5203]", "text-amber-500", "text-yellow-500"];
                const avatarBg = colors[index] || "bg-[#322521] border border-stone-800";
                const textCol = txtColors[index] || "text-stone-400";
                return (
                  <div key={kec.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#231a17]/50 border border-[#2d2420]/50 hover:bg-[#27201d] transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-black text-stone-200 uppercase tracking-wide truncate max-w-[130px] sm:max-w-[200px]">{kec.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black ${textCol} font-mono`}>{kec.count.toLocaleString("id-ID")} PTK</p>
                    </div>
                  </div>
                );
              })}
              {topKecDistribution.length === 0 && (
                <div className="py-8 text-center text-stone-550 text-xs">Belum ada data kecamatan terdata.</div>
              )}
            </div>
          </div>
        )}

        {/* Card 3: Report (Sleek Vertical Percentage Capsule Bars for Kepegawaian Status) */}
        <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[250px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-[#f25c05]" />
              <span>Rasio Pegawai</span>
            </h3>
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Filter: Status</span>
          </div>

          {/* Vertical Capsular Column Chart */}
          <div className="grid grid-cols-4 gap-4 py-2 flex-grow items-end min-h-[140px] px-2">
            {[
              { label: "PNS", count: statusStats.pns, bg: "from-[#ef4444] to-[#f97316]" },
              { label: "PPPK", count: statusStats.pppk, bg: "from-[#3b82f6] to-[#06b6d4]" },
              { label: "PPPKPW", count: statusStats.pppkpw, bg: "from-[#a855f7] to-[#ec4899]" },
              { label: "Honorer", count: statusStats.honorer, bg: "from-amber-500 to-amber-700" }
            ].map((col) => {
              const pct = maxStatusCount > 0 ? Math.round((col.count / maxStatusCount) * 100) : 0;
              const actualPctTotal = totalPTK > 0 ? Math.round((col.count / totalPTK) * 100) : 0;
              return (
                <div key={col.label} className="flex flex-col items-center group relative h-full justify-end">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-[#27211e] text-white border border-[#3d312a] text-[10px] font-bold px-2 py-1 rounded shadow-xl z-20 pointer-events-none whitespace-nowrap">
                    {col.count.toLocaleString("id-ID")} Orang ({actualPctTotal}%)
                  </div>

                  {/* Vertical container tube */}
                  <div className="w-5 sm:w-6 h-36 bg-[#251e1b] rounded-full overflow-hidden flex flex-col justify-end border border-[#322924] shadow-inner relative">
                    <div 
                      className="w-full rounded-full bg-[#f25c05]" 
                      style={{ 
                        height: `${Math.max(pct, 4)}%`,
                        transition: "height 1s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    ></div>
                  </div>

                  <span className="text-[10px] font-black text-stone-400 mt-2 tracking-tighter uppercase">{col.label}</span>
                  <span className="text-[8px] font-extrabold text-[#f25c05] font-mono mt-0.5">{actualPctTotal}%</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Lower Grid: Budget + Subscriptions + Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 4: Budget (Breakdown Kategori Jabatan/Beban Tugas) */}
        <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5 animate-pulse-slow">
              <CheckSquare className="h-4 w-4 text-[#f25c05]" />
              <span>Beban Tugas Pokok</span>
            </h3>
          </div>

          <div className="space-y-3 flex-grow">
            {[
              { name: "Guru Kelas", count: bebanStats["Guru Kelas"], desc: "Guru Kelas SD & TK" },
              { name: "Guru Mapel", count: bebanStats["Guru Mapel"], desc: "PAI, PJOK, B. Inggris dsb" },
              { name: "Kepala Sekolah", count: bebanStats["Kepala Sekolah"], desc: "Definitif & PLT" },
              { name: "Lainnya / Staf", count: bebanStats["Lainnya / Staf"], desc: "Operator, TU & Penjaga" }
            ].map((task) => {
              const isSelected = task.count > 0;
              return (
                <div key={task.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#231a17]/30 border border-[#2d2420]/40 transition hover:border-[#de5203]/40">
                  <div className="flex items-center gap-3">
                    {/* Simulated Checkbox from image */}
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      isSelected 
                        ? "bg-[#f25c05]/20 border-[#f25c05] text-[#f25c05]" 
                        : "border-[#3a2d27] bg-[#1a1412]"
                    }`}>
                      {isSelected && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-200">{task.name}</p>
                      <p className="text-[10px] text-stone-550 font-semibold">{task.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-stone-100 font-mono">
                      {task.count.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 5: Subscriptions (Pensiun & Peringatan Terkini) */}
        <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-[#f25c05]" />
              <span>PERINGATAN</span>
            </h3>
            <span className="text-[10px] font-extrabold text-[#f25c05] bg-[#de5203]/10 px-2 py-0.5 rounded border border-[#de5203]/20">Alert</span>
          </div>

          <div className="space-y-3 flex-grow">
            {[
              { name: "PNS Pensiun", count: alertStats.pensiun, tmt: "Memasuki Usia BUP", color: "text-red-400" },
              { name: "Mendekati Pensiun", count: alertStats.pensiunMendekati, tmt: "Sisa Usia <= 1 Tahun", color: "text-[#f25c05]" },
              { name: "Telat Naik Pangkat", count: alertStats.telatPangkat, tmt: "Belum naik > 4 Tahun", color: "text-amber-500" },
              { name: "Telat KGB", count: alertStats.telatKgb, tmt: "Belum KGB > 2 Tahun", color: "text-red-500" },
              { name: "Akan KGB (<= 3 Bln)", count: alertStats.akanKgb, tmt: "Mendekati batas 2 Tahun", color: "text-amber-400" },
              { name: "Kepsek > 8 Tahun", count: alertStats.kepsekLama, tmt: "Prioritas evaluasi dinas", color: "text-indigo-400" }
            ].map((alertItem) => {
              const active = alertItem.count > 0;
              return (
                <div key={alertItem.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[#231a17]/30 border border-[#2d2420]/40 transition hover:bg-[#251e1c]">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                      active ? "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse" : "bg-stone-850/30 border-stone-800 text-stone-500"
                    }`}>
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-stone-200">{alertItem.name}</p>
                      <p className="text-[10px] text-stone-550 font-semibold">{alertItem.tmt}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-black font-mono ${active ? alertItem.color : "text-stone-500"}`}>
                      {alertItem.count} Orang
                    </p>
                    <span className="text-[9px] font-medium text-stone-550">Alert</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 6: Savings (Sertifikasi Guru Circular gauge with inner stats) */}
        <div className="bg-[#1c1715] rounded-2xl border border-[#2d2420] p-6 shadow-xl flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#f25c05]" />
              <span>Sertifikasi Guru</span>
            </h3>
            <span className="text-[10px] text-stone-500 font-semibold uppercase tracking-widest">Ratio</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 py-4 flex-grow justify-center">
            
            {/* Elegant SVG Semi-Donut (3/4 circle progress) */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#27211e" 
                  strokeWidth="11" 
                  fill="transparent" 
                />
                {/* Colored Progress */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#f25c05" 
                  strokeWidth="11" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 - (251.2 * certifiedPercentage) / 100}
                  strokeLinecap="round"
                  fill="transparent" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Central Text */}
              <div className="absolute text-center">
                <p className="text-2xl font-black text-white font-mono">{certifiedPercentage}%</p>
                <p className="text-[8px] font-extrabold text-[#f25c05] uppercase tracking-wider">Sertifikasi</p>
              </div>
            </div>

            {/* Side breakdown info */}
            <div className="space-y-2 text-center sm:text-left">
              <div>
                <p className="text-[9px] font-extrabold text-stone-500 uppercase tracking-widest">Total Sertifikasi</p>
                <p className="text-sm font-black text-stone-100 font-mono mt-0.5">{certifiedCount} Orang</p>
              </div>
              <div className="border-t border-[#2d2420] pt-1.5">
                <p className="text-[9px] font-extrabold text-stone-500 uppercase tracking-widest">Belum Sertifikasi</p>
                <p className="text-sm font-black text-stone-300 font-mono mt-0.5">{(certifiedEligibleList.length - certifiedCount).toLocaleString("id-ID")} Orang</p>
              </div>
            </div>

          </div>

          <div className="bg-[#241a16] border border-[#3e2e26]/40 p-3 rounded-xl flex items-center gap-2 mt-2 leading-snug">
            <Sparkles className="h-4 w-4 text-[#f25c05] flex-shrink-0" />
            <p className="text-[10px] font-semibold text-stone-400">
              Rasio guru bersertifikasi di {labelKecamatan} mencapai <span className="text-white font-bold">{certifiedPercentage}%</span> dari total kekuatan guru & kepala sekolah.
            </p>
          </div>
        </div>

      </div>

      {/* Advisory Footer Match: Financial Advice block from image styled as Guidance */}
      <div className="p-5 rounded-2xl bg-[#1c1715] border border-[#2d2420] shadow-xl">
        <h4 className="text-[11px] font-extrabold text-[#f25c05] uppercase tracking-widest flex items-center gap-1.5 mb-2">
          <ShieldCheck className="h-4 w-4" />
          <span>CATATAN</span>
        </h4>
        <p className="text-xs font-semibold text-stone-400 leading-relaxed italic border-l-2 border-[#f25c05] pl-3">
          "Pelihara keutuhan data Pendidik dan Tenaga Kependidikan Kabupaten Bulukumba. Pastikan setiap kenaikan golongan ruang, masa kerja berkala, dan penugasan Kepala Sekolah dimutakhirkan secara periodik."
        </p>
      </div>

    </div>
  );
};
