import React from "react";
import { Home, Trophy, User, Settings, ShieldAlert, ShoppingBag } from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export function Sidebar({ currentTab, setTab }: SidebarProps) {
  const navItems = [
    { label: "Learn", id: "learn", icon: Home, color: "#1CB0F6" },
    { label: "Leaderboards", id: "leaderboard", icon: Trophy, color: "#FFC800" },
    { label: "Shop", id: "shop", icon: ShoppingBag, color: "#FF9600" },
    { label: "Profile", id: "profile", icon: User, color: "#58CC02" },
    { label: "Settings", id: "settings", icon: Settings, color: "#7C8890" },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 shrink-0 px-4 py-6 gap-2 border-r border-[#20282E] h-screen bg-[#0E1418]">
      <div className="px-4 mb-8 text-3xl font-extrabold tracking-tight text-[#58CC02] select-none cursor-pointer" onClick={() => setTab("learn")}>
        duolingo
      </div>
      <div className="flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex items-center gap-4 px-4 py-3 rounded-2xl text-left font-bold text-sm uppercase tracking-wider transition-all duration-150 active:scale-[0.98]"
              style={{
                background: isActive ? "#16232B" : "transparent",
                border: `2px solid ${isActive ? "#1CB0F6" : "transparent"}`,
                color: isActive ? "#1CB0F6" : "#7C8890",
              }}
            >
              <Icon size={22} color={item.color} strokeWidth={2.5} />
              {item.label}
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
