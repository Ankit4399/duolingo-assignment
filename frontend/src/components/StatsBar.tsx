import React, { useEffect, useState, useRef } from "react";
import { Flame, Gem, Heart, Shield, ChevronDown, Sparkles } from "lucide-react";
import { api } from "../utils/api";

const LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸", status: "active" },
  { code: "fr", name: "French", flag: "🇫🇷", status: "coming_soon" },
  { code: "de", name: "German", flag: "🇩🇪", status: "coming_soon" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", status: "coming_soon" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", status: "coming_soon" },
  { code: "ko", name: "Korean", flag: "🇰🇷", status: "coming_soon" },
];

interface StatsBarProps {
  user: {
    total_xp: number;
    gems: number;
    hearts: number;
    max_hearts: number;
    daily_xp_goal: number;
    current_streak: number;
  };
  xpToday: number;
  onRefill: () => void;
  isSuper?: boolean;
}

export function StatsBar({ user, xpToday, onRefill, isSuper }: StatsBarProps) {
  const [regenText, setRegenText] = useState<string>("");
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const langRef = useRef<HTMLDivElement>(null);
  const goalPct = Math.min(100, Math.round((xpToday / user.daily_xp_goal) * 100));

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const updateRegenTimer = async () => {
      try {
        const status = await api.getHearts();
        if (status.next_regen_at) {
          const target = new Date(status.next_regen_at).getTime();
          const tick = () => {
            const now = Date.now();
            const diff = target - now;
            if (diff <= 0) {
              setRegenText("");
              clearInterval(timer);
            } else {
              const minutes = Math.floor(diff / 60000);
              const seconds = Math.floor((diff % 60000) / 1000);
              setRegenText(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
            }
          };
          tick();
          clearInterval(timer);
          timer = setInterval(tick, 1000);
        } else {
          setRegenText("");
        }
      } catch (err) {
        console.error("Failed to fetch heart status for timer", err);
      }
    };

    updateRegenTimer();
    return () => clearInterval(timer);
  }, [user.hearts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLangSelect = (lang: typeof LANGUAGES[0]) => {
    if (lang.status === "active") {
      setSelectedLang(lang);
    }
    setLangOpen(false);
  };

  const Stat = ({ icon, value, tint, label, onClick }: { icon: React.ReactNode; value: any; tint: string; label?: string; onClick?: () => void }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 font-extrabold text-sm px-3.5 py-2 rounded-2xl cursor-default select-none border border-[#232C33] bg-[#131F24] ${onClick ? "hover:bg-[#1C2C35] active:scale-95 cursor-pointer" : ""}`}
      style={{ color: tint }}
    >
      {icon}
      <span>{value}</span>
      {label && <span className="text-[10px] uppercase font-bold text-[#8A97A0] ml-0.5">{label}</span>}
    </div>
  );

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-[#131F24]/40 p-4 rounded-3xl border border-[#232C33]/60">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-[#232C33] bg-[#131F24] hover:bg-[#1C2C35] transition-colors select-none"
          >
            <span className="text-lg leading-none">{selectedLang.flag}</span>
            <ChevronDown size={14} className={`text-[#7C8890] transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
          </button>

          {langOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-[#131F24] border border-[#232C33] rounded-2xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-[fadeIn_150ms_ease-out]">
              <div className="px-4 py-2.5 border-b border-[#232C33]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#8A97A0]">My Courses</span>
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangSelect(lang)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    lang.code === selectedLang.code
                      ? "bg-[#1CB0F6]/10 border-l-2 border-l-[#1CB0F6]"
                      : "hover:bg-[#1C2C35] border-l-2 border-l-transparent"
                  }`}
                >
                  <span className="text-xl leading-none">{lang.flag}</span>
                  <div className="flex flex-col flex-1">
                    <span className={`text-sm font-bold ${lang.code === selectedLang.code ? "text-[#1CB0F6]" : "text-white"}`}>
                      {lang.name}
                    </span>
                    {lang.status === "coming_soon" && (
                      <span className="text-[10px] font-bold text-[#FF9600] uppercase tracking-wider">Coming Soon</span>
                    )}
                  </div>
                  {lang.status === "active" && lang.code === selectedLang.code && (
                    <div className="w-2 h-2 rounded-full bg-[#58CC02]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A97A0]">
            Daily XP Goal
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-32 md:w-44 rounded-full overflow-hidden h-3 bg-[#131F24] border border-[#232C33]">
              <div
                className="h-full rounded-full bg-[#58CC02] transition-all duration-500 ease-out"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-[#8A97A0]">
              {xpToday}/{user.daily_xp_goal} XP
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Stat 
          icon={<Flame size={18} fill="#FF9600" color="#FF9600" className="bounce-slow" />} 
          value={user.current_streak} 
          tint="#FF9600" 
          label="Days"
        />
        <Stat 
          icon={<Gem size={17} fill="#1CB0F6" color="#1CB0F6" />} 
          value={user.gems} 
          tint="#1CB0F6"
        />
        {isSuper ? (
          <div className="flex items-center gap-2 font-extrabold text-sm px-3.5 py-2 rounded-2xl select-none border border-[#F1C40F]/40 bg-gradient-to-r from-[#F1C40F]/10 to-[#E67E22]/10 text-[#F1C40F]">
            <Sparkles size={16} fill="#F1C40F" />
            <span>∞</span>
            <Heart size={14} fill="#F1C40F" color="#F1C40F" />
          </div>
        ) : (
          <Stat 
            icon={<Heart size={18} fill="#FF4B4B" color="#FF4B4B" />} 
            value={`${user.hearts}/${user.max_hearts}`} 
            tint="#FF4B4B"
            label={regenText ? `Regen in ${regenText}` : undefined}
            onClick={user.hearts < user.max_hearts ? onRefill : undefined}
          />
        )}
      </div>
    </div>
  );
}