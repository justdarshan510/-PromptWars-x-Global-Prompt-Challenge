"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../i18n/en.json";
import hi from "../i18n/hi.json";
import ta from "../i18n/ta.json";
import bn from "../i18n/bn.json";

const translations: Record<string, any> = { en, hi, ta, bn };

interface AppContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  user: { uid: string; name: string; email: string } | null;
  login: (customUser?: { uid: string; name: string; email: string }) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState("en");
  const [user, setUser] = useState<{ uid: string; name: string; email: string } | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && ["en", "hi", "ta", "bn"].includes(savedLang)) {
      setLanguage(savedLang);
    }
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const changeLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const login = (customUser?: { uid: string; name: string; email: string }) => {
    const selectedUser = customUser || { uid: "demo-citizen-uid-123", name: "Ramesh Kumar", email: "ramesh@demo.in" };
    setUser(selectedUser);
    localStorage.setItem("user", JSON.stringify(selectedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const t = (key: string): string => {
    const dict = translations[language] || translations["en"];
    return dict[key] || key;
  };

  return (
    <AppContext.Provider value={{ language, setLanguage: changeLanguage, t, user, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
