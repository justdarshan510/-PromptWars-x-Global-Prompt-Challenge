"use client";

import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./providers";
import ChatWidget from "../components/ChatWidget";
import ServicesGrid from "../components/ServicesGrid";
import { X } from "lucide-react";

function DashboardContent() {
  const { t, language, setLanguage, user, login, logout } = useApp();
  const [activeTab, setActiveTab] = useState("chat");

  const [selectedCategory, setSelectedCategory] = useState("All Resources");
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { key: "chat", icon: "smart_toy", label: "AI Assistant" },
    { key: "services", icon: "account_balance", label: "Government Services" },
    { key: "report", icon: "report_problem", label: "Report Public Issues" },
    { key: "complaints", icon: "assignment", label: "My Complaints" },
    { key: "resources", icon: "library_books", label: "Resources" },
  ];

  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "ta", label: "தமிழ்" },
    { code: "bn", label: "বাংলা" },
  ];

  // Document Library Mock Data (Filtered in client)
  const docsData = [
    { title: "Comprehensive Aadhaar Guide (2024)", category: "Aadhaar", desc: "Learn about enrollment, biometric updates, and address changes. This definitive guide covers all security protocols and digital signature requirements.", size: "4.2 MB", isCritical: true, icon: "fingerprint" },
    { title: "PAN Card Application Handbook", category: "PAN Services", desc: "Step-by-step instructions for new PAN cards and correction of existing data.", size: "1.8 MB", isCritical: false, icon: "wallet" },
    { title: "Driving License Manual", category: "Education", desc: "Preparation guide for driving tests and Learner's License procedures across India.", size: "2.4 MB", isCritical: false, icon: "directions_car" },
  ];

  const awarenessData = [
    { title: "Digital Literacy Essentials", desc: "Empowering citizens to navigate digital banking...", readTime: "15 mins read", tag: "Education", icon: "computer" },
    { title: "National Health Schemes", desc: "Overview of available medical insurance and...", readTime: "Guide", tag: "Health Care", icon: "medical_services" },
    { title: "Sustainable Energy Incentives", desc: "How to apply for solar subsidies and energy-...", readTime: "Handbook", tag: "Education", icon: "lightbulb" },
    { title: "Modern Farming Techniques", desc: "A digital toolkit for smart crop management and...", readTime: "Module 05", tag: "Education", icon: "agriculture" },
  ];

  const gazettesData = [
    { date: "12", month: "MAR 24", title: "Gazette Notification: Urban Planning Amendment 2024", desc: "Regulatory changes for commercial zoning in metropolitan areas." },
    { date: "08", month: "MAR 24", title: "Digital Infrastructure Act: Implementation Orders", desc: "Official directive for fiber-optic expansion across rural districts." },
    { date: "29", month: "FEB 24", title: "Annual Economic Survey Report: Public Summary", desc: "Analysis of national economic growth and future sector projections." },
  ];

  const filteredDocs = docsData.filter(doc => {
    const matchesCategory = selectedCategory === "All Resources" || doc.category === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredAwareness = awarenessData.filter(item => {
    const matchesCategory = selectedCategory === "All Resources" || item.tag === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleAccounts, setGoogleAccounts] = useState(false);

  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to decode JWT:", error);
      return null;
    }
  };

  const handleCredentialResponse = (response: any) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      login({
        uid: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
      setShowLoginModal(false);
    }
  };

  useEffect(() => {
    if (!showLoginModal) return;

    let checkInterval = setInterval(() => {
      if (typeof window !== "undefined" && (window as any).google?.accounts?.id) {
        clearInterval(checkInterval);
        
        try {
          (window as any).google.accounts.id.initialize({
            client_id: "72175965416-8310q42mopq336v2pln3n7h58i3j8s09.apps.googleusercontent.com",
            callback: handleCredentialResponse,
            auto_select: false,
          });

          (window as any).google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { 
              theme: "outline", 
              size: "large", 
              width: 320, 
              shape: "pill",
              text: "signin_with",
              logo_alignment: "left"
            }
          );
        } catch (err) {
          console.error("Error initializing Google Identity Services:", err);
        }
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [showLoginModal]);

  const notificationsList = [
    { text: "Your streetlight complaint is marked as In Progress.", tab: "complaints", id: 1 },
    { text: "Smart suggestion: Farmer schemes matched your profile.", tab: "schemes", id: 2 },
    { text: "DigiLocker documents linked successfully.", tab: "resources", id: 3 },
  ];

  const handleNotificationClick = (tab: string) => {
    setActiveTab(tab);
    setShowNotifications(false);
  };

  const handleQuickSupport = () => {
    setActiveTab("chat");
    // Show toast or trigger auto support message in next tick
    const chatInput = document.querySelector("input[type='text']") as HTMLInputElement;
    if (chatInput) {
      chatInput.value = "Help me locate local Common Service Centres (CSC)";
      chatInput.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--background)", color: "var(--on-surface)", fontFamily: "'Inter', Arial, sans-serif" }}>
      
      {/* ── TOP NAVIGATION BAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-8 shadow-md"
        style={{ background: "var(--primary-container)" }}>
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
            style={{ background: "rgba(255,255,255,0.2)" }}>
            SB
          </div>
          <div>
            <div className="text-white font-black text-sm tracking-widest">SMART BHARAT</div>
            <div className="text-blue-200 text-[9px] font-semibold tracking-wider uppercase">AI-Powered Civic Companion</div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { key: "chat", label: "Home" },
            { key: "services", label: "Services" },
            { key: "complaints", label: "My Complaints" },
            { key: "resources", label: "Resources" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`text-xs font-semibold transition-all pb-1 ${
                activeTab === item.key
                  ? "text-white border-b-2 border-white"
                  : "text-blue-200 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 relative">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 cursor-pointer outline-none"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code} style={{ background: "#1a237e", color: "white" }}>
                {l.label}
              </option>
            ))}
          </select>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all relative"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 bg-white border rounded-2xl w-80 shadow-lg py-2.5 z-50 text-xs animate-scale-in text-gray-900"
              style={{ borderColor: "var(--outline-variant)" }}>
              <div className="px-4 pb-2 border-b font-bold text-gray-500 uppercase tracking-wider text-[10px] flex justify-between items-center">
                <span>Alerts & Notifications</span>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {notificationsList.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n.tab)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-gray-100"
                  >
                    <span className="text-gray-800 leading-snug">{n.text}</span>
                    <span className="text-[9px] text-[var(--primary)] font-bold uppercase tracking-wider mt-1 flex items-center gap-0.5">
                      View details <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full pl-3 pr-1.5 py-1 text-white">
                <span className="text-[11px] font-bold">{user.name}</span>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0)}
                  </div>
                )}
              </div>
              <button 
                onClick={logout}
                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-base">logout</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLoginModal(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 text-white rounded-lg text-[11px] font-extrabold transition-all shadow-md flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── BODY with SIDEBAR + CONTENT ── */}
      <div className="flex pt-16 flex-1">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="fixed left-0 top-16 w-60 h-[calc(100vh-64px)] flex flex-col p-4 border-r z-40"
          style={{ background: "var(--surface-container-low)", borderColor: "var(--outline-variant)" }}>
          
          <div className="mb-6 px-2">
            <h2 className="font-bold text-sm" style={{ color: "var(--primary)" }}>Citizen Portal</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>Smarter. Faster. For Every Citizen.</p>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-left transition-all text-xs font-semibold ${
                  activeTab === item.key
                    ? "font-bold translate-x-1"
                    : "hover:opacity-80"
                }`}
                style={activeTab === item.key
                  ? { background: "var(--secondary-container)", color: "var(--on-secondary-container)" }
                  : { color: "var(--on-surface-variant)" }}
              >
                <span className={`material-symbols-${activeTab === item.key ? "filled" : "outlined"} text-xl`}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1">
            <button 
              onClick={handleQuickSupport}
              className="w-full mb-3 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer"
              style={{ background: "var(--primary)", color: "var(--on-primary)" }}>
              <span className="material-symbols-outlined text-base">support_agent</span>
              Quick Support
            </button>
            
            <button 
              onClick={() => setOpenSettings(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs transition-all text-[var(--on-surface-variant)] hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-base">settings</span>
              Settings
            </button>
            <button 
              onClick={() => setOpenHelp(true)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-full text-xs transition-all text-[var(--on-surface-variant)] hover:bg-slate-100"
            >
              <span className="material-symbols-outlined text-base">help</span>
              Help & Support
            </button>
          </div>
        </aside>


        {/* ── MAIN CONTENT ── */}
        <main className="ml-60 flex-1 min-h-[calc(100vh-64px)] overflow-y-auto">
          {activeTab === "chat" && (
            <div className="max-w-5xl mx-auto px-8 py-10">
              {/* Hero Section */}
              <section className="mb-10 rounded-3xl p-10 text-center relative overflow-hidden border"
                style={{ background: "white", borderColor: "var(--outline-variant)" }}>
                <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full blur-3xl opacity-20"
                  style={{ background: "var(--primary)" }} />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10"
                  style={{ background: "var(--secondary-container)" }} />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
                    style={{ background: "var(--primary-container)" }}>
                    <span className="material-symbols-filled text-white text-4xl">smart_toy</span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black mb-2" style={{ color: "var(--primary)" }}>
                    Hello! 👋 How can I help you today?
                  </h1>
                  <p className="text-sm mb-8" style={{ color: "var(--on-surface-variant)" }}>
                    Ask about government services, schemes, documents, or report an issue.
                  </p>
                  <ChatWidget hero />
                </div>
              </section>

              {/* Quick Action Cards */}
              <section>
                <h2 className="text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: "var(--on-surface-variant)" }}>
                  Quick Actions
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: "account_balance", label: "Popular Services", sub: "Explore and apply for services", color: "var(--secondary-container)", iconColor: "var(--primary)", tab: "services" },
                    { icon: "report", label: "Report an Issue", sub: "Report civic problems in your area", color: "#ffdad6", iconColor: "#93000a", tab: "report" },
                    { icon: "assignment", label: "Track Complaints", sub: "Check real-time status", color: "var(--tertiary-fixed)", iconColor: "#001e30", tab: "complaints" },
                    { icon: "groups", label: "Schemes for You", sub: "Personalized recommendations", color: "var(--primary-fixed)", iconColor: "var(--primary)", tab: "schemes" },
                  ].map((card) => (
                    <button
                      key={card.label}
                      onClick={() => setActiveTab(card.tab)}
                      className="group card-hover text-left p-6 rounded-2xl border bg-white"
                      style={{ borderColor: "var(--outline-variant)" }}
                    >
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ background: card.color }}>
                        <span className="material-symbols-outlined text-2xl" style={{ color: card.iconColor }}>
                          {card.icon}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm mb-1" style={{ color: "var(--primary)" }}>{card.label}</h3>
                      <p className="text-xs" style={{ color: "var(--on-surface-variant)" }}>{card.sub}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--primary)" }}>
                        Open <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Government Banner */}
              <section className="mt-8 rounded-2xl p-8 relative overflow-hidden flex items-center"
                style={{ background: "var(--primary-container)" }}>
                <div className="relative z-10">
                  <span className="inline-block text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-3"
                    style={{ background: "var(--secondary-container)", color: "var(--on-secondary-container)" }}>
                    Government Update
                  </span>
                  <h2 className="text-xl font-black text-white mb-2">Digitizing Civic Engagement with BharatGPT</h2>
                  <p className="text-sm text-blue-200 max-w-xl mb-4">
                    Our AI infrastructure helps citizens access benefits in seconds. No more long queues or confusing paperwork.
                  </p>
                  <button className="bg-white text-xs font-bold px-6 py-2.5 rounded-full transition-all hover:bg-blue-50"
                    style={{ color: "var(--primary)" }}>
                    Read Mission Statement
                  </button>
                </div>
                <div className="absolute right-8 top-8 opacity-20">
                  <span className="material-symbols-outlined text-9xl text-white">account_balance</span>
                </div>
              </section>
            </div>
          )}

          {(activeTab === "services" || activeTab === "complaints" || activeTab === "report" || activeTab === "schemes") && (
            <div className="max-w-5xl mx-auto px-8 py-10">
              <ServicesGrid activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          )}

          {activeTab === "resources" && (
            <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
              {/* Header Info */}
              <div className="flex flex-col gap-0.5 border-b pb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  Citizen Portal <span className="material-symbols-outlined text-xs">chevron_right</span> Resources
                </span>
                <h1 className="text-3xl font-black text-gray-900 mt-1">Digital Resource Library</h1>
                <p className="text-xs text-gray-600">
                  Access official guides, government documents, and educational materials powered by Smart Bharat's secure repository.
                </p>
              </div>

              {/* Search & Filter Pills */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {["All Resources", "Aadhaar", "PAN Services", "Education", "Health Care"].map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        selectedCategory === category
                          ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-slate-50"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
                <div className="relative w-full md:w-80 flex items-center bg-white border border-gray-200 rounded-xl focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] shadow-sm">
                  <span className="material-symbols-outlined text-gray-400 pl-3.5 pr-2.5 text-lg">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents, guides..."
                    className="w-full bg-transparent border-none outline-none py-3 text-xs text-gray-800 placeholder-gray-400 focus:ring-0"
                  />
                </div>
              </div>

              {/* Section 1: Essential Documents */}
              <div className="space-y-4">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>description</span>
                  Essential Documents
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Big Card (Comprehensive Aadhaar Guide) */}
                  {filteredDocs.some(d => d.isCritical) ? (
                    filteredDocs.filter(d => d.isCritical).map((doc, idx) => (
                      <div key={idx} className="lg:col-span-2 bg-white border rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderColor: "var(--outline-variant)" }}>
                        <span className="absolute top-4 right-4 bg-red-50 text-red-600 px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border border-red-200">
                          Critical
                        </span>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          <div className="w-40 h-32 bg-slate-50 border rounded-xl flex items-center justify-center text-[var(--primary)] flex-shrink-0">
                            <span className="material-symbols-outlined text-5xl">fingerprint</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-gray-900 mb-1">{doc.title}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed mb-4">{doc.desc}</p>
                            <div className="flex items-center gap-4">
                              <a 
                                href={doc.title.includes("Aadhaar") ? "/aadhaar_guide.pdf" : doc.title.includes("PAN") ? "/pan_guide.pdf" : "/driving_manual.pdf"}
                                download
                                className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-95 transition-all shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">download</span>
                                Download PDF ({doc.size})
                              </a>
                              <a href="#" className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-0.5">
                                Preview Online <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {/* Right Column Stack */}
                  <div className="flex flex-col gap-6">
                    {filteredDocs.filter(d => !d.isCritical).map((doc, idx) => (
                      <div key={idx} className="bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderColor: "var(--outline-variant)" }}>
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>{doc.icon}</span>
                            <h4 className="font-bold text-xs text-gray-900">{doc.title}</h4>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-4">{doc.desc}</p>
                        </div>
                        <a 
                          href={doc.title.includes("Aadhaar") ? "/aadhaar_guide.pdf" : doc.title.includes("PAN") ? "/pan_guide.pdf" : "/driving_manual.pdf"}
                          download
                          className="w-full border border-gray-300 text-gray-700 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-slate-50 transition-all text-center"
                        >
                          <span className="material-symbols-outlined text-xs">download</span>
                          Download ({doc.size})
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Education & Awareness */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>school</span>
                    Education & Awareness
                  </h3>
                  <a href="#" className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center">
                    View All Materials <span className="material-symbols-outlined text-xs ml-0.5">chevron_right</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredAwareness.map((item, idx) => (
                    <div key={idx} className="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      style={{ borderColor: "var(--outline-variant)" }}>
                      <div className="h-28 bg-slate-50 border-b flex items-center justify-center text-[var(--primary)] relative">
                        <span className="material-symbols-outlined text-4xl">{item.icon}</span>
                        <span className="absolute top-2 left-2 bg-slate-100 border text-[9px] font-bold text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.tag}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 mb-1 leading-snug">{item.title}</h4>
                          <p className="text-[10px] text-gray-500 leading-relaxed mb-3">{item.desc}</p>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold border-t pt-2.5 mt-2">
                          <span>{item.readTime}</span>
                          <button className="text-gray-400 hover:text-[var(--primary)] transition-all">
                            <span className="material-symbols-outlined text-xs">share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Government Gazettes */}
              <div className="space-y-4 pt-2">
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 border-b pb-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>gavel</span>
                  Government Gazettes
                </h3>

                <div className="space-y-3">
                  {gazettesData.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item, idx) => (
                    <div key={idx} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
                      style={{ borderColor: "var(--outline-variant)" }}>
                      <div className="flex items-center gap-5">
                        <div className="text-center bg-slate-50 border rounded-lg px-3 py-1.5 flex flex-col justify-center min-w-[70px]">
                          <span className="text-[9px] font-bold text-gray-400 leading-none uppercase tracking-wider">{item.month}</span>
                          <span className="text-base font-black text-[var(--primary)] leading-none mt-1">{item.date}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-gray-900">{item.title}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                      <a 
                        href="/gazette_notification.pdf"
                        download
                        className="text-gray-400 hover:text-[var(--primary)] p-2 rounded-full hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">download_for_offline</span>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-3">
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-sm">
                    Load More Gazettes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer className="ml-60 py-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs border-t"
        style={{ background: "var(--primary-container)", borderColor: "rgba(255,255,255,0.1)" }}>
        <div>
          <div className="font-black tracking-wider text-white">SMART BHARAT</div>
          <p className="text-blue-200 mt-0.5">© 2025 Smart Bharat. Government of India Initiative.</p>
        </div>
        <div className="flex gap-6">
          {["Privacy Policy", "Terms of Service", "Contact", "Accessibility"].map((link) => (
            <a key={link} href="#" className="text-blue-200 hover:text-white transition-colors font-semibold">{link}</a>
          ))}
        </div>
        <div className="flex items-center gap-1 text-blue-200">
          <span className="material-symbols-outlined text-sm">verified</span>
          <span className="font-semibold">Secured by Gov. of India</span>
        </div>
      </footer>

      {/* --- OVERLAY MODAL: SETTINGS --- */}
      {openSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-xl border animate-scale-in text-gray-900">
            <div className="bg-slate-50 border-b p-5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>settings</span>
                Portal Settings
              </h3>
              <button 
                onClick={() => setOpenSettings(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-white border rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-bold text-gray-800">Language Preference</p>
                  <p className="text-[10px] text-gray-400">Select default interface language</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white border rounded-lg p-1.5 font-semibold text-gray-800 outline-none"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-bold text-gray-800">High Contrast Mode</p>
                  <p className="text-[10px] text-gray-400">Increase readability contrast</p>
                </div>
                <input type="checkbox" className="rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" />
              </div>

              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <p className="font-bold text-gray-800">Notifications</p>
                  <p className="text-[10px] text-gray-400">Receive SMS alerts for grievances</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer" />
              </div>

              <div className="pt-2 text-center text-[10px] text-gray-400 font-medium">
                Smart Bharat Client Client v1.2.0-beta
              </div>
            </div>

            <div className="bg-slate-50 border-t p-4 flex gap-3">
              <button 
                onClick={() => setOpenSettings(false)}
                className="flex-1 bg-[var(--primary)] text-white py-2 rounded-lg font-bold hover:opacity-95 transition-all text-xs"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY MODAL: HELP & SUPPORT --- */}
      {openHelp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border animate-scale-in text-gray-900">
            <div className="bg-slate-50 border-b p-5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>help</span>
                Frequently Asked Questions
              </h3>
              <button 
                onClick={() => setOpenHelp(false)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-white border rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[380px] overflow-y-auto">
              {[
                { q: "How do I check my PM-Kisan status?", a: "Go to Government Services -> PM Kisan card and click Apply / Check status. Alternatively, type 'PM Kisan status' in the AI assistant." },
                { q: "What is DigiLocker legal validity?", a: "Under Section 65A of the IT Act, documents pulled inside DigiLocker are legally equivalent to physical originals." },
                { q: "How long does municipal grievance resolution take?", a: "Pothole and water leakage grievances are typically assigned to field supervisors within 24 hours, and resolved in 3-5 working days." },
                { q: "Is there any late fee for birth registration?", a: "Birth registration is free within 21 days. Late registration (22-30 days) requires a minor late fee and local body approval." },
              ].map((faq, i) => (
                <div key={i} className="border-b pb-3 last:border-0">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full"></span>
                    {faq.q}
                  </h4>
                  <p className="text-gray-600 mt-1 pl-3 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border-t p-4 flex gap-3">
              <button 
                onClick={() => {
                  setOpenHelp(false);
                  handleQuickSupport();
                }}
                className="flex-1 bg-[var(--primary)] text-white py-2 rounded-lg font-bold hover:opacity-95 transition-all text-xs"
              >
                Ask NagrikAI Assistant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY MODAL: SIGN IN --- */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border animate-scale-in text-gray-900">
            
            {/* Header */}
            <div className="bg-slate-50 border-b p-5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>account_circle</span>
                Citizen Portal Login
              </h3>
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  setGoogleLoading(false);
                  setGoogleAccounts(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 bg-white border rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-center">
              {!googleLoading && !googleAccounts && (
                <div className="space-y-5">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
                    <span className="material-symbols-outlined text-2xl">verified_user</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-gray-800">Welcome to Smart Bharat</h4>
                    <p className="text-[10px] text-gray-400 mt-1">Access all official government services securely</p>
                  </div>
                  
                  <div className="space-y-2.5 pt-2">
                    {/* Real Google Button Container */}
                    <div className="w-full py-1.5 flex justify-center">
                      <div id="google-signin-btn"></div>
                    </div>

                    <div className="flex items-center my-1 text-gray-400 text-[10px] font-bold">
                      <div className="flex-1 border-t border-gray-200"></div>
                      <span className="px-2">OR</span>
                      <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    {/* Mobile OTP (Simulated fallback) */}
                    <button 
                      onClick={() => {
                        login();
                        setShowLoginModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">phone_iphone</span>
                      Sign in with Mobile OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Google Connecting/Loading State */}
              {googleLoading && (
                <div className="py-12 space-y-4">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-500 font-medium animate-pulse">Connecting with Google Accounts...</p>
                </div>
              )}

              {/* Google Account Selector Screen */}
              {googleAccounts && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center gap-2 border-b pb-3 mb-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Choose an account</span>
                  </div>
                  
                  <div className="space-y-1">
                    {/* Ramesh Account */}
                    <button 
                      onClick={() => {
                        login();
                        setShowLoginModal(false);
                        setGoogleAccounts(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all border text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-xs text-white">R</div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Ramesh Kumar</p>
                        <p className="text-[10px] text-gray-400">ramesh@gmail.com</p>
                      </div>
                    </button>

                    {/* Another Mock Account */}
                    <button 
                      onClick={() => {
                        login({ uid: "demo-citizen-uid-456", name: "Priya Sharma", email: "priya@gmail.com" });
                        setShowLoginModal(false);
                        setGoogleAccounts(false);
                      }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all border text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs text-white">P</div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">Priya Sharma</p>
                        <p className="text-[10px] text-gray-400">priya@gmail.com</p>
                      </div>
                    </button>
                  </div>

                  <p className="text-[9px] text-gray-400 text-center pt-2">
                    To continue, Google will share your name, email address, and profile picture with Smart Bharat.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

