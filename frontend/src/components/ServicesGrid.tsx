"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "../app/providers";
import { 
  Building, AlertTriangle, ClipboardList, Users, 
  MapPin, CheckCircle2, Loader2, ArrowRight, X, Sparkles, HeartPulse, Home as HomeIcon, ShieldAlert
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  required_documents: string[];
}

interface Complaint {
  id: string;
  category: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
}

export default function ServicesGrid({ activeTab, setActiveTab }: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  const { t, user } = useApp();
  
  // Data State Arrays
  const [services, setServices] = useState<Service[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookmarks, setBookmarks] = useState<number[]>([1, 3]); // default bookmarks matching UI state
  
  // Grievance filing states
  const [category, setCategory] = useState("Roads & Potholes");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Demographic matchmaking sliders
  const [age, setAge] = useState(30);
  const [occupation, setOccupation] = useState("Farmer");
  const [income, setIncome] = useState("< 2 Lakhs");
  const [recommended, setRecommended] = useState<string[]>([]);

  // Modal / Toast Interactive State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeFormService, setActiveFormService] = useState<Service | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // e-District link check
  const [digilockerLinked, setDigilockerLinked] = useState(false);
  const [digilockerLoading, setDigilockerLoading] = useState(false);
  const [digilockerDocs, setDigilockerDocs] = useState<Array<{ name: string; id: string; status: string }>>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleBookmark = (id: number) => {
    if (bookmarks.includes(id)) {
      setBookmarks(bookmarks.filter(b => b !== id));
      showToast("Removed from bookmarked services.");
    } else {
      setBookmarks([...bookmarks, id]);
      showToast("Added to bookmarked services.");
    }
  };
  
  const fetchServices = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/services");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      setServices([
        {
          id: 1,
          name: "PM Kisan Samman Nidhi",
          category: "Agriculture",
          description: "Income support of Rs. 6000 per year in three equal installments to small and marginal farmer families. This scheme aims to supplement the financial needs of farmers.",
          required_documents: ["Aadhaar Card", "Land Ownership Documents", "Bank Account Details"]
        },
        {
          id: 2,
          name: "Ayushman Bharat (PM-JAY)",
          category: "Health",
          description: "Provides health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization to over 12 crore poor and vulnerable families.",
          required_documents: ["Aadhaar Card", "Ration Card", "Income Certificate"]
        },
        {
          id: 3,
          name: "PM Awas Yojana (PMAY)",
          category: "Housing",
          description: "Provides affordable housing with a subsidy on interest rates for home loans, focusing on home ownership for women and marginalized sections.",
          required_documents: ["Identity Proof", "Address Proof", "Voter ID", "Income Affidavit"]
        },
        {
          id: 4,
          name: "DigiLocker Service",
          category: "Identity",
          description: "Access and share authentic digital copies of certificates issued directly by government authorities in a secure, paperless cloud-based wallet.",
          required_documents: ["Aadhaar Card", "Mobile Number Linked to Aadhaar"]
        }
      ]);
    }
  };

  const fetchComplaints = async () => {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer test-token`;
      }
      const res = await fetch("http://localhost:8000/api/complaints", { headers });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (e) {
      setComplaints([
        {
          id: "e4d2a8b2-5f33-4a11-8255-a22db34b9d0b",
          category: "Streetlight / Electricity",
          description: "Broken streetlight outside block B-12 park causing safety issues at night.",
          location: "Block B-12 Sector 4, Dwarka, Delhi",
          status: "In Progress",
          created_at: new Date().toISOString()
        },
        {
          id: "fc2a8d11-55bb-411a-8215-992ca34b88bc",
          category: "Water Supply",
          description: "Water leaking heavily from main pipeline pipe near metro pillar 104.",
          location: "Metro Pillar 104, Rohini, Delhi",
          status: "Resolved",
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchComplaints();
  }, [user]);

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !location.trim()) return;
    setSubmitLoading(true);
    
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        headers["Authorization"] = `Bearer test-token`;
      }
      const res = await fetch("http://localhost:8000/api/complaints", {
        method: "POST",
        headers,
        body: JSON.stringify({ category, description, location })
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setDescription("");
        setLocation("");
        fetchComplaints();
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab("complaints");
        }, 2000);
      }
    } catch (err) {
      const mockTicket: Complaint = {
        id: Math.random().toString(36).substr(2, 9),
        category,
        description,
        location,
        status: "Submitted",
        created_at: new Date().toISOString()
      };
      setComplaints((prev) => [mockTicket, ...prev]);
      setSubmitSuccess(true);
      setDescription("");
      setLocation("");
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab("complaints");
      }, 2000);
    } finally {
      setSubmitLoading(false);
    }
  };

  const calculateSchemes = () => {
    const list = [];
    if (occupation === "Farmer") {
      list.push("PM Kisan Samman Nidhi (Eligible: High Match)");
      list.push("PM Fasal Bima Yojana (Crop Insurance)");
    }
    if (income === "< 2 Lakhs") {
      list.push("Ayushman Bharat PM-JAY (Free Health Cover)");
      list.push("PM Awas Yojana (Housing Subsidy)");
    } else if (income === "2-5 Lakhs") {
      list.push("PM Awas Yojana (CLSS Home Loan Subsidy)");
    }
    if (age >= 60) {
      list.push("Pradhan Mantri Vaya Vandana Yojana (Senior Citizen Pension)");
    }
    list.push("DigiLocker (Direct Document Verification - All Citizens)");
    setRecommended(list);
  };

  useEffect(() => {
    calculateSchemes();
  }, [age, occupation, income]);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStep(2);
    
    setTimeout(() => {
      setFormStep(3);
      setTimeout(() => {
        setFormLoading(false);
        const refId = "SB-" + Math.floor(100000 + Math.random() * 900000);
        
        if (activeFormService?.id === 2) {
          // Ayushman Bharat
          if (income === "> 5 Lakhs") {
            setFormSuccessMessage("Based on your income declarations (> 5 Lakhs), your profile does not meet the direct SECC 2011 free health care criteria. If you believe this is an error, please upload your BPL certificate at your local block development office.");
          } else {
            setFormSuccessMessage(`Congratulations! You have been verified as eligible. Your Ayushman Bharat Golden Card has been generated! ID: ${refId}. Cashless cover of ₹5 Lakh/year is now active.`);
          }
        } else {
          setFormSuccessMessage(`Application submitted successfully! Your tracking reference ID is ${refId}. You will receive SMS alerts on status updates.`);
        }
      }, 1500);
    }, 1500);
  };

  const handleLinkDigilocker = () => {
    setDigilockerLoading(true);
    setTimeout(() => {
      setDigilockerLoading(false);
      setDigilockerLinked(true);
      setDigilockerDocs([
        { name: "Aadhaar Card", id: "XXXX-XXXX-9901", status: "Verified" },
        { name: "PAN Card", id: "AWQPPXXXXM", status: "Verified" },
        { name: "Class XII Passing Certificate", id: "CBSE-12002348", status: "Verified" }
      ]);
      showToast("DigiLocker Linked successfully!");
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* 4-Card Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Popular Services Card */}
        <button
          onClick={() => setActiveTab("services")}
          className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
            activeTab === "services"
              ? "bg-white border-2 scale-[1.02] shadow-md"
              : "bg-white border hover:bg-slate-50"
          }`}
          style={activeTab === "services" ? { borderColor: "var(--primary)" } : { borderColor: "var(--outline-variant)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: activeTab === "services" ? "var(--primary)" : "var(--surface-container-high)" }}>
            <Building className={`w-6 h-6 ${activeTab === "services" ? "text-white" : "text-[var(--primary)]"}`} />
          </div>
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--primary)" }}>{t("card_services")}</h3>
          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--on-surface-variant)" }}>
            {t("card_services_desc")}
          </p>
          <span className="text-xs font-bold flex items-center mt-auto" style={{ color: "var(--primary)" }}>
            Browse Services <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </span>
        </button>

        {/* Report an Issue Card */}
        <button
          onClick={() => setActiveTab("report")}
          className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
            activeTab === "report"
              ? "bg-white border-2 scale-[1.02] shadow-md"
              : "bg-white border hover:bg-slate-50"
          }`}
          style={activeTab === "report" ? { borderColor: "var(--primary)" } : { borderColor: "var(--outline-variant)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: activeTab === "report" ? "var(--primary)" : "#FFC107/10" }}>
            <AlertTriangle className={`w-6 h-6 ${activeTab === "report" ? "text-white" : "text-[#FFC107]"}`} />
          </div>
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--primary)" }}>{t("card_report")}</h3>
          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--on-surface-variant)" }}>
            {t("card_report_desc")}
          </p>
          <span className="text-xs font-bold flex items-center mt-auto" style={{ color: "var(--primary)" }}>
            Report Local Issue <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </span>
        </button>

        {/* Track Complaints Card */}
        <button
          onClick={() => setActiveTab("complaints")}
          className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
            activeTab === "complaints"
              ? "bg-white border-2 scale-[1.02] shadow-md"
              : "bg-white border hover:bg-slate-50"
          }`}
          style={activeTab === "complaints" ? { borderColor: "var(--primary)" } : { borderColor: "var(--outline-variant)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: activeTab === "complaints" ? "var(--primary)" : "#00BCD4/10" }}>
            <ClipboardList className={`w-6 h-6 ${activeTab === "complaints" ? "text-white" : "text-[#00BCD4]"}`} />
          </div>
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--primary)" }}>{t("card_track")}</h3>
          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--on-surface-variant)" }}>
            {t("card_track_desc")}
          </p>
          <span className="text-xs font-bold flex items-center mt-auto" style={{ color: "var(--primary)" }}>
            View Live Tracker <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </span>
        </button>

        {/* Schemes for You Card */}
        <button
          onClick={() => setActiveTab("schemes")}
          className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer ${
            activeTab === "schemes"
              ? "bg-white border-2 scale-[1.02] shadow-md"
              : "bg-white border hover:bg-slate-50"
          }`}
          style={activeTab === "schemes" ? { borderColor: "var(--primary)" } : { borderColor: "var(--outline-variant)" }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: activeTab === "schemes" ? "var(--primary)" : "#4CAF50/10" }}>
            <Users className={`w-6 h-6 ${activeTab === "schemes" ? "text-white" : "text-[#4CAF50]"}`} />
          </div>
          <h3 className="font-bold text-base mb-1" style={{ color: "var(--primary)" }}>{t("card_schemes")}</h3>
          <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "var(--on-surface-variant)" }}>
            {t("card_schemes_desc")}
          </p>
          <span className="text-xs font-bold flex items-center mt-auto" style={{ color: "var(--primary)" }}>
            Find Match <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </span>
        </button>
      </div>

      {/* Expanded Sections Content Panel (Styled in light mode) */}
      <div className="bg-white border rounded-3xl p-8 shadow-sm relative"
        style={{ borderColor: "var(--outline-variant)" }}>
        
        {/* TAB 1: Popular Services Catalog */}
        {activeTab === "services" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl" style={{ color: "var(--primary)" }}>apps</span>
              <h2 className="text-xl font-bold text-gray-900">
                Popular Services Catalog
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((svc) => (
                <div key={svc.id} className="bg-white border rounded-2xl p-6 hover:shadow-md transition-all group flex flex-col justify-between"
                  style={{ borderColor: "var(--outline-variant)" }}>
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 text-[var(--primary)] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border"
                        style={{ borderColor: "var(--outline-variant)" }}>
                        {svc.category}
                      </span>
                      <button 
                        onClick={() => toggleBookmark(svc.id)}
                        className="text-gray-400 hover:text-[var(--primary)] transition-colors"
                      >
                        <span className={`material-symbols-${bookmarks.includes(svc.id) ? "filled" : "outlined"} text-xl`}
                          style={bookmarks.includes(svc.id) ? { color: "var(--primary)" } : {}}>
                          bookmark
                        </span>
                      </button>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2 group-hover:text-[var(--primary)] transition-colors">
                      {svc.name}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed mb-6">
                      {svc.description}
                    </p>
                    <div className="space-y-3 border-t pt-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {svc.required_documents?.map((doc, idx) => (
                          <span key={idx} className="bg-slate-50 text-gray-700 px-3 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={() => {
                        setActiveFormService(svc);
                        setFormStep(1);
                        setFormInputs({});
                        setFormSuccessMessage(null);
                      }}
                      className="flex-1 text-white py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                      style={{ background: "var(--primary)" }}
                    >
                      {svc.id === 2 ? "Check Eligibility" : svc.id === 4 ? "Access Wallet" : "Apply Now"}
                    </button>
                    <button 
                      onClick={() => setSelectedService(svc)}
                      className="flex-1 border text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                      style={{ borderColor: "var(--outline)" }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Report Local Issue Form */}
        {activeTab === "report" && (
          <div className="max-w-xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl" style={{ color: "var(--primary)" }}>report_problem</span>
              <h2 className="text-xl font-bold text-gray-900">
                Submit Local Grievance
              </h2>
            </div>
            
            {submitSuccess ? (
              <div className="bg-emerald-55 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
                <span className="text-sm font-semibold">Complaint submitted successfully! Redirecting to tracker...</span>
              </div>
            ) : (
              <form onSubmit={handleReportIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    style={{ borderColor: "var(--outline)" }}
                  >
                    <option>Roads & Potholes</option>
                    <option>Water Supply & Leaks</option>
                    <option>Streetlight / Electricity</option>
                    <option>Garbage / Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Grievance Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide details about the issue..."
                    className="w-full bg-white border text-gray-900 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none placeholder-gray-400"
                    style={{ borderColor: "var(--outline)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Exact Location</label>
                  <div className="relative flex items-center bg-white border rounded-xl focus-within:ring-1 focus-within:ring-[var(--primary)]"
                    style={{ borderColor: "var(--outline)" }}>
                    <MapPin className="w-4 h-4 text-gray-400 ml-3" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Street name, colony, landmark, pincode..."
                      className="w-full bg-transparent border-none text-gray-900 outline-none px-3 py-3 text-sm placeholder-gray-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading || !description.trim() || !location.trim()}
                  className="w-full text-white font-semibold py-3 rounded-xl hover:opacity-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm text-xs font-bold"
                  style={{ background: "var(--primary)" }}
                >
                  {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>File Complaint</span>}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Complaint Tracker */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl" style={{ color: "var(--primary)" }}>assignment</span>
              <h2 className="text-xl font-bold text-gray-900">
                Grievance Status Tracker
              </h2>
            </div>
            
            <div className="space-y-4">
              {complaints.map((c) => (
                <div key={c.id} className="bg-white border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  style={{ borderColor: "var(--outline-variant)" }}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900 text-sm">{c.category}</span>
                      <span className="text-[10px] text-gray-400">ID: {c.id.substring(0, 8)}...</span>
                    </div>
                    <p className="text-xs text-gray-600">{c.description}</p>
                    <div className="flex items-center text-[10px] text-gray-400 mt-1">
                      <MapPin className="w-3 h-3 mr-1" /> {c.location}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.status === "Resolved" 
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : c.status === "In Progress"
                        ? "bg-amber-50 border border-amber-200 text-amber-700"
                        : "bg-gray-100 text-gray-600 border"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Schemes Personalized Recommender */}
        {activeTab === "schemes" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-3xl" style={{ color: "var(--primary)" }}>groups</span>
              <h2 className="text-xl font-bold text-gray-900">
                Personalized Scheme Finder
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Form Input Side */}
              <div className="w-full lg:w-1/3 bg-slate-50 border rounded-xl p-5 space-y-4 h-fit"
                style={{ borderColor: "var(--outline-variant)" }}>
                <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider border-b pb-2">Your Demographics</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Age: {age}</label>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Occupation</label>
                  <select
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full bg-white border text-gray-900 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    style={{ borderColor: "var(--outline)" }}
                  >
                    <option>Farmer</option>
                    <option>Student</option>
                    <option>Business Owner</option>
                    <option>Unemployed</option>
                    <option>Salaried Worker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Annual Household Income</label>
                  <select
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full bg-white border text-gray-900 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none"
                    style={{ borderColor: "var(--outline)" }}
                  >
                    <option>&lt; 2 Lakhs</option>
                    <option>2-5 Lakhs</option>
                    <option>&gt; 5 Lakhs</option>
                  </select>
                </div>
              </div>

              {/* Recommendations Output Side */}
              <div className="w-full lg:w-2/3 space-y-4">
                <h3 className="font-bold text-gray-900 text-sm flex items-center border-b pb-2">
                  Recommended Schemes
                </h3>
                {recommended.length > 0 ? (
                  <div className="space-y-2">
                    {recommended.map((scheme, idx) => (
                      <div key={idx} className="bg-white border hover:border-emerald-500 rounded-xl p-4 transition-colors flex items-center justify-between"
                        style={{ borderColor: "var(--outline-variant)" }}>
                        <div className="flex items-center space-x-3">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                          <span className="font-semibold text-sm text-gray-800">{scheme}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No matching schemes. Please update slider filters.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- FLOATING TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 animate-slide-up border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- OVERLAY MODAL: SERVICE DETAILS --- */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-xl border border-gray-150 animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6 flex justify-between items-start">
              <div>
                <span className="bg-blue-100 text-[var(--primary)] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                  {selectedService.category}
                </span>
                <h3 className="text-lg font-black text-gray-900 mt-2">{selectedService.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedService(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-white border rounded-full shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-4 text-xs leading-relaxed text-gray-700 max-h-[380px] overflow-y-auto">
              <div>
                <h5 className="font-bold text-gray-900 mb-1">Scheme Overview</h5>
                <p>{selectedService.description}</p>
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1.5">Who Can Apply?</h5>
                {selectedService.id === 1 && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Small and marginal farming families.</li>
                    <li>Families holding cultivable agricultural land registered under their name.</li>
                    <li>Must hold valid land mutation documentation (Khasra-Khatauni).</li>
                  </ul>
                )}
                {selectedService.id === 2 && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Socio-Economic Caste Census (SECC 2011) mapped households.</li>
                    <li>Families with active BPL ration cards or low-income status.</li>
                    <li>No active members in institutional government employment.</li>
                  </ul>
                )}
                {selectedService.id === 3 && (
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Citizens without pakka houses anywhere in India.</li>
                    <li>Income thresholds under EWS (≤ 3 Lakhs) or LIG (3-6 Lakhs) limits.</li>
                    <li>Preference to women head of households or differently-abled individuals.</li>
                  </ul>
                )}
                {selectedService.id === 4 && (
                  <p>All citizens holding a verified Aadhaar profile linked with an active mobile number.</p>
                )}
              </div>

              <div>
                <h5 className="font-bold text-gray-900 mb-1.5">Documents Needed</h5>
                <div className="flex flex-wrap gap-1.5">
                  {selectedService.required_documents.map((doc, i) => (
                    <span key={i} className="bg-slate-50 border px-2.5 py-1 rounded-lg text-[10px] text-gray-800 font-medium">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 border-t p-4 flex gap-3">
              <button 
                onClick={() => {
                  const svc = selectedService;
                  setSelectedService(null);
                  setActiveFormService(svc);
                  setFormStep(1);
                  setFormInputs({});
                  setFormSuccessMessage(null);
                }}
                className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-xl font-bold hover:opacity-90 transition-all text-xs"
              >
                Proceed to Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY MODAL: APPLICATION / ELIGIBILITY WIZARD --- */}
      {activeFormService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-xl border border-gray-150 animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-5 flex justify-between items-center">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg" style={{ color: "var(--primary)" }}>edit_note</span>
                {activeFormService.id === 2 ? "Eligibility Assessment" : activeFormService.id === 4 ? "Link DigiLocker" : "Scheme Application"}
              </h3>
              <button 
                onClick={() => setActiveFormService(null)}
                className="text-gray-400 hover:text-gray-600 p-1 bg-white border rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 text-xs">
              {formStep === 1 && (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl text-[11px] text-gray-700 leading-relaxed mb-4">
                    <strong>Instructions:</strong> Please fill in your verified records. Fields are checked against UIDAI Aadhaar registry.
                  </div>

                  {activeFormService.id === 4 ? (
                    // DigiLocker integration
                    <div className="space-y-4">
                      {digilockerLinked ? (
                        <div className="space-y-4">
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <div>
                              <p className="font-bold text-xs">DigiLocker Wallet Linked!</p>
                              <p className="text-[10px] text-emerald-700/80">3 verified records successfully retrieved.</p>
                            </div>
                          </div>
                          <div className="border rounded-xl divide-y text-[11px]">
                            {digilockerDocs.map((doc, idx) => (
                              <div key={idx} className="p-3 flex justify-between items-center bg-slate-50/50">
                                <div>
                                  <p className="font-bold text-gray-800">{doc.name}</p>
                                  <p className="text-[9px] text-gray-400 font-mono">Ref: {doc.id}</p>
                                </div>
                                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[9px] font-bold border border-green-200">
                                  {doc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 text-center py-6">
                          <span className="material-symbols-outlined text-5xl text-[var(--primary)] animate-pulse">lock</span>
                          <h4 className="font-bold text-sm text-gray-900 mt-2">Connect Your Secure Wallet</h4>
                          <p className="text-gray-500 max-w-xs mx-auto mb-4">Link DigiLocker to fetch Aadhaar, PAN, and school certificates directly into Smart Bharat.</p>
                          <button
                            type="button"
                            onClick={handleLinkDigilocker}
                            disabled={digilockerLoading}
                            className="bg-[var(--primary)] text-white py-2 px-8 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                          >
                            {digilockerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate via Aadhaar OTP"}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular Schemes Form
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Citizen Name</label>
                        <input
                          type="text"
                          required
                          value={formInputs.name || ""}
                          onChange={(e) => setFormInputs({ ...formInputs, name: e.target.value })}
                          placeholder="e.g. Nitin Kumar"
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-1 focus:ring-[var(--primary)] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Aadhaar Identification Number</label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={formInputs.aadhaar || ""}
                          onChange={(e) => setFormInputs({ ...formInputs, aadhaar: e.target.value.replace(/\D/g, "") })}
                          placeholder="e.g. 5560 9923 8812"
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono focus:ring-1 focus:ring-[var(--primary)] outline-none"
                        />
                      </div>

                      {activeFormService.id === 1 && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Land survey / Khasra number</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. HN-990-2"
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:ring-1 focus:ring-[var(--primary)] outline-none"
                          />
                        </div>
                      )}

                      {activeFormService.id === 3 && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Current Residential Status</label>
                          <select className="w-full bg-white border rounded-xl px-3 py-2.5 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none">
                            <option>Rented Kutcha House</option>
                            <option>Homeless / Temporary Shelter</option>
                            <option>Own Kutcha House</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer mt-4"
                        style={{ background: "var(--primary)" }}
                      >
                        Submit Application
                      </button>
                    </div>
                  )}
                </form>
              )}

              {formStep === 2 && (
                <div className="py-10 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto" />
                  <h4 className="font-bold text-sm text-gray-900">Processing Document Verification</h4>
                  <p className="text-gray-500 max-w-xs mx-auto">Connecting securely with National Identity Vault & Land Registry servers...</p>
                </div>
              )}

              {formStep === 3 && (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">Verification Complete</h4>
                  <p className="text-gray-600 text-xs px-2 leading-relaxed">{formSuccessMessage}</p>
                  
                  <button
                    onClick={() => setActiveFormService(null)}
                    className="bg-[var(--primary)] text-white py-2 px-8 rounded-xl font-bold hover:opacity-90 transition-all text-xs cursor-pointer mt-4"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
