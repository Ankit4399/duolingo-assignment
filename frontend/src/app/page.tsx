"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { StatsBar } from "../components/StatsBar";
import { Leaderboard } from "../components/Leaderboard";
import { Profile } from "../components/Profile";
import { Shop } from "../components/Shop";
import { LessonPlayer } from "../components/LessonPlayer";
import { Mascot } from "../components/Mascot";
import { api } from "../utils/api";
import {
  BookOpen, Star, Hand, PawPrint, Utensils, Users, Palette, X, ArrowLeft, ArrowRight
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<any>> = {
  hand: Hand,
  paw: PawPrint,
  food: Utensils,
  users: Users,
  palette: Palette,
};

const OFFSET_PATTERN = [0, 60, 110, 60, 0, -60, -110, -60];

const COLORS = {
  page: "#0E1418",
  sidebarBorder: "#20282E",
  activeBg: "#16232B",
  activeBorder: "#1CB0F6",
  activeText: "#1CB0F6",
  inactiveText: "#7C8890",
  cardBg: "#131F24",
  cardBorder: "#232C33",
  mutedText: "#8A97A0",
  lockedBg: "#2B343B",
  lockedIcon: "#5B6670",
};

function darken(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amount);
  const g = Math.max(0, ((n >> 8) & 0xff) - amount);
  const b = Math.max(0, (n & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

export default function PathScreen() {
  const [tab, setTab] = useState<string>("learn");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [coursePath, setCoursePath] = useState<any>(null);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [pressedSkillId, setPressedSkillId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [xpToday, setXpToday] = useState<number>(0);
  const [isSuper, setIsSuper] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSuper(localStorage.getItem("duolingo_super") === "true");
    }
  }, []);

  const handleSetSuper = (val: boolean) => {
    setIsSuper(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("duolingo_super", val ? "true" : "false");
    }
  };

  const loadData = async () => {
    try {
      const profile = await api.getProfile();
      setUserProfile(profile);
      const path = await api.getCoursePath(1);
      setCoursePath(path);

      setXpToday(profile.total_xp % 30); 
    } catch (err) {
      console.error("Failed to load user path data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefillHearts = async () => {
    try {
      const res = await api.refillHearts();
      setUserProfile((prev: any) => prev ? { ...prev, hearts: res.hearts } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkillNodeClick = (skill: any) => {
    if (skill.status === "locked") {
      setPressedSkillId(skill.id);
      setTimeout(() => setPressedSkillId(null), 150);
      return;
    }
    setPressedSkillId(skill.id);
    setTimeout(() => setPressedSkillId(null), 150);
    setSelectedSkill(skill);
  };

  const handleStartLesson = (skill: any) => {
    if (skill.lessons && skill.lessons.length > 0) {
      setActiveLessonId(skill.lessons[0].id);
      setSelectedSkill(null);
    } else {
      setActiveLessonId(skill.id); 
      setSelectedSkill(null);
    }
  };

  const handleLessonPlayerClose = (xpEarned?: number) => {
    setActiveLessonId(null);
    if (xpEarned) {
      loadData(); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1418] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#58CC02]"></div>
        <p className="text-[#8A97A0] font-bold">Launching Duolingo...</p>
      </div>
    );
  }

  if (activeLessonId) {
    return (
      <LessonPlayer 
        lessonId={activeLessonId} 
        onClose={handleLessonPlayerClose} 
        isSuper={isSuper}
      />
    );
  }

  return (
    <div className="h-screen bg-[#0E1418] font-sans flex text-white overflow-hidden">
      <Sidebar currentTab={tab} setTab={setTab} />

      <div className="flex-1 h-screen overflow-y-auto flex flex-col">
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-[#20282E] bg-[#0E1418]">
          <span className="text-2xl font-black text-[#58CC02]">duolingo</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTab("learn")} className={`text-xs font-bold uppercase tracking-wider ${tab === "learn" ? "text-[#1CB0F6]" : "text-[#7C8890]"}`}>Learn</button>
            <button onClick={() => setTab("leaderboard")} className={`text-xs font-bold uppercase tracking-wider ${tab === "leaderboard" ? "text-[#FFC800]" : "text-[#7C8890]"}`}>Leagues</button>
            <button onClick={() => setTab("shop")} className={`text-xs font-bold uppercase tracking-wider ${tab === "shop" ? "text-[#FF9600]" : "text-[#7C8890]"}`}>Shop</button>
            <button onClick={() => setTab("profile")} className={`text-xs font-bold uppercase tracking-wider ${tab === "profile" ? "text-[#58CC02]" : "text-[#7C8890]"}`}>Profile</button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full pb-20">
          {userProfile && (
            <StatsBar 
              user={userProfile} 
              xpToday={xpToday} 
              onRefill={handleRefillHearts} 
              isSuper={isSuper}
            />
          )}

          {tab === "learn" && coursePath && (
            <div className="flex flex-col gap-6">
              {coursePath.units.map((unit: any) => {
                const activeSkillIdx = unit.skills.findIndex((s: any) => s.status === "available");
                const currentSkillId = unit.skills.find((s: any) => s.status === "available")?.id;

                return (
                  <div key={unit.id} className="flex flex-col gap-6">
                    <div className="rounded-3xl p-6 flex items-center justify-between shadow-lg" style={{ background: unit.color_theme }}>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                          Section {unit.order}, Unit {unit.order}
                        </span>
                        <h2 className="text-xl font-black text-white mt-0.5">{unit.title}</h2>
                        <p className="text-xs font-bold text-white/90 mt-1">{unit.description}</p>
                      </div>
                      <button className="px-4 py-2 rounded-2xl bg-black/15 border border-white/20 text-white text-xs font-black uppercase tracking-wider hover:bg-black/25">
                        Guidebook
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-10 py-10 relative">
                      {unit.skills.map((skill: any, idx: number) => {
                        const isLocked = skill.status === "locked";
                        const isCompleted = skill.status === "completed";
                        const isCurrent = skill.id === currentSkillId;
                        const offset = OFFSET_PATTERN[idx % OFFSET_PATTERN.length];

                        const Icon = ICONS[skill.icon] || BookOpen;
                        const themeColor = unit.color_theme;
                        return (
                          <div
                            key={skill.id}
                            className="relative flex items-center justify-center"
                            style={{ transform: `translateX(${offset}px)` }}
                          >
                            {isCurrent && (
                              <div
                                className="absolute rounded-full border-4 border-dashed animate-[spin_12s_linear_infinite]"
                                style={{
                                  width: 96,
                                  height: 96,
                                  borderColor: themeColor,
                                }}
                              />
                            )}

                            <div
                              className="absolute rounded-full"
                              style={{
                                width: 76,
                                height: 76,
                                top: 6,
                                background: isLocked ? "#1C2227" : darken(themeColor, 50),
                              }}
                            />

                            <button
                              onClick={() => handleSkillNodeClick(skill)}
                              className="relative flex items-center justify-center rounded-full transition-all duration-100 active:translate-y-[6px]"
                              style={{
                                width: 76,
                                height: 76,
                                background: isLocked ? COLORS.lockedBg : themeColor,
                                transform: pressedSkillId === skill.id ? "translateY(6px)" : "translateY(0px)",
                              }}
                              aria-label={skill.title}
                            >
                              {isCompleted ? (
                                <Star size={30} fill="#FFF" color="#FFF" strokeWidth={1.5} />
                              ) : (
                                <Icon size={28} color={isLocked ? COLORS.lockedIcon : "#FFF"} strokeWidth={2.5} />
                              )}

                              {isCompleted && skill.crown_level > 0 && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-[#FFC800] border-2 border-[#0E1418] text-[#3C3C3C] text-[10px] font-black rounded-full w-6 h-6 flex items-center justify-center select-none shadow">
                                  {skill.crown_level}
                                </div>
                              )}
                            </button>

                            {idx === activeSkillIdx && (
                              <div
                                className="absolute pointer-events-none select-none z-10"
                                style={{
                                  left: offset >= 0 ? 110 : -140,
                                  top: -20,
                                }}
                              >
                                <div className="bg-[#131F24] border border-[#232C33] px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-wider mb-1 text-center shadow-lg relative after:content-[''] after:absolute after:bottom-[-5px] after:left-[50%] after:translate-x-[-50%] after:border-t-4 after:border-t-[#232C33] after:border-x-4 after:border-x-transparent">
                                  Start
                                </div>
                                <Mascot expression="normal" size={70} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "leaderboard" && <Leaderboard />}

          {tab === "shop" && userProfile && (
            <Shop
              user={userProfile}
              setUser={setUserProfile}
              isSuper={isSuper}
              setIsSuper={handleSetSuper}
            />
          )}

          {tab === "profile" && <Profile isSuper={isSuper} />}

          {tab === "settings" && (
            <div className="max-w-xl mx-auto w-full py-4 flex flex-col gap-6">
              <div className="flex flex-col gap-2 mb-6 text-center">
                <h2 className="text-2xl font-black text-white">Settings</h2>
                <p className="text-sm text-[#8A97A0]">Configure your learning preferences</p>
              </div>

              <div className="flex flex-col gap-4 bg-[#131F24] border border-[#232C33] rounded-3xl p-6">
                <div className="flex items-center justify-between py-2 border-b border-[#232C33]/60">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-white">Sound Effects</span>
                    <span className="text-xs text-[#8A97A0]">Play sounds during lessons</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#58CC02]" />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232C33]/60">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-white">Motivational Messages</span>
                    <span className="text-xs text-[#8A97A0]">Show encouraging animations</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#58CC02]" />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#232C33]/60">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-white">Dark Mode</span>
                    <span className="text-xs text-[#8A97A0]">Toggle app color theme</span>
                  </div>
                  <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[#58CC02]" />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-white">Daily Goal Reminder</span>
                    <span className="text-xs text-[#8A97A0]">Remind me when I have not hit my XP goal</span>
                  </div>
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#58CC02]" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#58CC02]/10 border border-[#58CC02]/25 text-[#58CC02] text-xs font-bold text-center">
                Settings saved locally. Happy learning!
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSkill && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl p-6 bg-[#131F24] border border-[#232C33] shadow-2xl flex flex-col gap-5 text-center">
            <div className="flex justify-end">
              <button onClick={() => setSelectedSkill(null)} className="text-[#7C8890] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner"
                style={{ background: selectedSkill.status === "completed" ? "#58CC02" : coursePath?.units[0]?.color_theme }}
              >
                <Star size={28} fill="#FFF" color="#FFF" />
              </div>
              <h3 className="text-xl font-black text-white">{selectedSkill.title}</h3>
              <p className="text-xs text-[#8A97A0]">
                {selectedSkill.status === "completed" 
                  ? `Crown level ${selectedSkill.crown_level} reached. Practice to level up!`
                  : "Begin your lessons and earn 10 XP rewards."}
              </p>
            </div>

            <button
              onClick={() => handleStartLesson(selectedSkill)}
              className="w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all"
              style={{
                background: coursePath?.units[0]?.color_theme,
                boxShadow: `0 4px 0 ${darken(coursePath?.units[0]?.color_theme, 40)}`,
              }}
            >
              {selectedSkill.status === "completed" ? "Practice" : "Start +10 XP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}