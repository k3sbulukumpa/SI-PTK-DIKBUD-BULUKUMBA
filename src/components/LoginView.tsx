import React, { useState, useEffect } from "react";
import { School, UserSession } from "../types";
import { GraduationCap, ShieldAlert, KeyRound, Building, Landmark, Loader2 } from "lucide-react";

interface LoginProps {
  schools: School[];
  kecamatans: string[];
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginProps> = ({ schools, kecamatans, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<"sekolah" | "dinas">("sekolah");
  
  // School Admin state
  const [selectedKec, setSelectedKec] = useState("");
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [passwordSekolah, setPasswordSekolah] = useState("");

  // Dinas Admin state
  const [usernameDinas, setUsernameDinas] = useState("");
  const [passwordDinas, setPasswordDinas] = useState("");

  // Shared UX State
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  // Trigger school filter when kecamatan changes
  useEffect(() => {
    if (selectedKec) {
      const filtered = schools.filter(s => s.kec === selectedKec);
      setFilteredSchools(filtered);
    } else {
      setFilteredSchools([]);
    }
    setSelectedSchool("");
  }, [selectedKec, schools]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setLoading(true);

    let payload = {};
    if (activeTab === "sekolah") {
      if (!selectedKec || !selectedSchool) {
        setErrorText("Harap pilih Kecamatan dan Sekolah!");
        setLoading(false);
        return;
      }
      payload = {
        role: "Sekolah",
        identifier: `${selectedKec}|${selectedSchool}`,
        password: passwordSekolah
      };
    } else {
      if (!usernameDinas || !passwordDinas) {
        setErrorText("Harap isi Username dan Password!");
        setLoading(false);
        return;
      }
      payload = {
        role: "Admin Dinas",
        identifier: usernameDinas,
        password: passwordDinas
      };
    }

    try {
      const resp = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success) {
        onLoginSuccess({
          role: data.role,
          identifier: data.identifier
        });
      } else {
        setErrorText(data.message || "Gagal masuk! Periksa kembali kredensial Anda.");
      }
    } catch (err) {
      console.error("Login failure:", err);
      setErrorText("Terjadi masalah jaringan saat menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="flex-grow flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat min-h-[85vh] animate-fade-in"
      style={{
        backgroundImage: "linear-gradient(rgba(9, 9, 11, 0.85), rgba(9, 9, 11, 0.95)), url('https://assets.promediateknologi.id/crop/0x0:0x0/x/photo/p3/325/2025/12/20/gedung-ammatoa-full-colors-2232671363.jpeg')"
      }}
    >
      <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800/80 max-w-md w-full overflow-hidden transition-all duration-300 shadow-black/80">
        
        {/* Logo and Titles */}
        <div className="p-8 text-center bg-zinc-900/30 border-b border-zinc-800 relative">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/5/50/Lambang_Kabupaten_Bulukumba.svg" 
            alt="Logo Kabupaten Bulukumba" 
            className="h-16 w-auto mx-auto mb-4 drop-shadow-md animate-bounce-slow"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-black text-white tracking-tight">SI PTK DIKBUD</h2>
          <p className="text-[10px] font-bold mt-2 uppercase tracking-widest text-[#d47c00]">SISTEM INFORMASI Pendidik &amp; Tenaga Kependidikan</p>
          <p className="text-[9px] font-semibold text-zinc-500 mt-1 uppercase">Dinas Pendidikan dan Kebudayaan Kab. Bulukumba</p>
        </div>

        {/* Form Container */}
        <div className="p-8">
          
          {/* Custom Tabs */}
          <div className="flex mb-6 bg-zinc-950 p-1 rounded-xl border border-zinc-800/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab("sekolah");
                setErrorText("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "sekolah"
                  ? "bg-zinc-800 font-bold border border-zinc-700/50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <Building className="h-3.5 w-3.5" style={{ color: activeTab === "sekolah" ? "#d47600" : undefined }} />
              <span style={{ color: activeTab === "sekolah" ? "#d47600" : undefined }}>Admin Sekolah</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dinas");
                setErrorText("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === "dinas"
                  ? "bg-zinc-800 font-bold border border-zinc-700/50 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <Landmark className="h-3.5 w-3.5" style={{ color: activeTab === "dinas" ? "#d47600" : undefined }} />
              <span style={{ color: activeTab === "dinas" ? "#d47600" : undefined }}>Admin Dinas</span>
            </button>
          </div>

          {/* Validation Alert */}
          {errorText && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 text-xs font-semibold flex items-start gap-2 animate-shake">
              <ShieldAlert className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {activeTab === "sekolah" ? (
              <>
                {/* Kecamatan Select */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Kecamatan</label>
                  <select
                    id="loginKecamatan"
                    value={selectedKec}
                    onChange={(e) => setSelectedKec(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 outline-none transition font-medium"
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecamatans.map((kec) => (
                      <option key={kec} value={kec}>{kec}</option>
                    ))}
                  </select>
                </div>

                {/* Sekolah Select */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Nama Sekolah</label>
                  <select
                    id="loginSekolah"
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    disabled={!selectedKec}
                    className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 outline-none transition disabled:bg-zinc-900/40 disabled:text-zinc-650 font-medium"
                    required
                  >
                    <option value="">-- Pilih Sekolah --</option>
                    {filteredSchools.map((sch) => (
                      <option key={sch.id} value={sch.nama}>{sch.nama}</option>
                    ))}
                  </select>
                </div>

                {/* Password input */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      id="loginPwdSekolah"
                      value={passwordSekolah}
                      onChange={(e) => setPasswordSekolah(e.target.value)}
                      placeholder="Masukkan password admin sekolah"
                      className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-emerald-500/50 outline-none transition font-medium"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Dinas Username */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    id="loginUsername"
                    value={usernameDinas}
                    onChange={(e) => setUsernameDinas(e.target.value)}
                    placeholder="Masukkan username dinas"
                    className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500/50 outline-none transition font-medium"
                    required
                  />
                </div>

                {/* Dinas Password */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                      <KeyRound className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      id="loginPwdDinas"
                      value={passwordDinas}
                      onChange={(e) => setPasswordDinas(e.target.value)}
                      placeholder="Masukkan password dinas"
                      className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-emerald-500/50 outline-none transition font-medium"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full text-xs font-extrabold py-3 px-4 rounded-xl text-white shadow-lg transition-all flex items-center justify-center gap-2 duration-200 uppercase tracking-widest cursor-pointer mt-6 border border-zinc-700/50 bg-[#ed6900] hover:bg-[#d45e00] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>MENGOTENTIKASI...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
