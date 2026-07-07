"use client";

import React from "react";
import { useApp } from "../app/providers";
import { Globe, User, LogOut } from "lucide-react";

export default function Navbar({ activeSection, setActiveSection }: { 
  activeSection: string; 
  setActiveSection: (sec: string) => void;
}) {
  const { language, setLanguage, t, user, login, logout } = useApp();

  const navItems = [
    { id: "home", label: t("nav_home") },
    { id: "services", label: t("nav_services") },
    { id: "complaints", label: t("nav_complaints") },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/85 border-b border-slate-800 px-6 py-4 flex items-center justify-between text-white">
      {/* Brand Logo & India Tricolor Asset */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveSection("home")}>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-tr from-orange-500 via-white to-emerald-500 p-[2px]">
          <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center font-bold text-lg text-white">
            SB
          </div>
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-orange-400 via-slate-100 to-emerald-400 bg-clip-text text-transparent">
            {t("app_title")}
          </span>
          <span className="hidden md:block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
            {t("app_subtitle")}
          </span>
        </div>
      </div>

      {/* Center Nav Links */}
      <div className="flex items-center space-x-1 md:space-x-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeSection === item.id
                ? "bg-slate-800 text-orange-400 border border-slate-700"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Right Tools: Language Selector + Auth */}
      <div className="flex items-center space-x-4">
        {/* Language Dropdown */}
        <div className="relative flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-sm space-x-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Select Interface Language"
            className="bg-transparent text-white border-none outline-none cursor-pointer font-medium focus:ring-0 text-xs md:text-sm"
          >
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="hi" className="bg-slate-900 text-white">हिन्दी</option>
            <option value="ta" className="bg-slate-900 text-white">தமிழ்</option>
            <option value="bn" className="bg-slate-900 text-white">বাংলা</option>
          </select>
        </div>

        {/* User Auth Profile */}
        {user ? (
          <div className="flex items-center space-x-3 bg-slate-800/40 border border-slate-700/60 rounded-full pl-3 pr-1 py-1">
            <span className="hidden lg:block text-xs font-semibold text-slate-300">{user.name}</span>
            <button
              onClick={logout}
              className="p-1.5 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-sm text-white">
              {user.name.charAt(0)}
            </div>
          </div>
        ) : (
          <button
            onClick={() => login()}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-2 rounded-lg text-sm font-semibold shadow-md transition-all duration-300 shadow-orange-500/10 flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
