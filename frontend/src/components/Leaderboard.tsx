import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Trophy, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  username: string;
  total_xp: number;
  is_current_user: boolean;
}

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await api.getLeaderboard();
        setEntries(data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} color="#FFD700" fill="#FFD700" />;
      case 2:
        return <Medal size={20} color="#C0C0C0" fill="#C0C0C0" />;
      case 3:
        return <Medal size={20} color="#CD7F32" fill="#CD7F32" />;
      default:
        return <span className="w-5 text-center font-extrabold text-xs text-[#7C8890]">{rank}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1CB0F6]"></div>
        <p className="text-[#8A97A0] text-sm font-bold">Loading scoreboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto w-full py-4">
      <div className="flex flex-col items-center text-center gap-2 mb-8 mt-2">
        <div className="bg-[#FFC800]/10 p-4 rounded-full border border-[#FFC800]/25">
          <Trophy size={42} color="#FFC800" fill="#FFC800" className="bounce-slow" />
        </div>
        <h2 className="text-2xl font-extrabold text-white">Bronze League</h2>
        <p className="text-sm text-[#8A97A0]">Top learners earn promotion. Keep practicing!</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {entries.map((user) => (
          <div
            key={user.username}
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-150 ${
              user.is_current_user
                ? "bg-[#1CB0F6]/10 border-[#1CB0F6] scale-[1.01] shadow-md shadow-[#1CB0F6]/5"
                : "bg-[#131F24] border-[#232C33] hover:border-[#333E46]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">
                {getRankBadge(user.rank)}
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg select-none text-white"
                   style={{ background: user.is_current_user ? "#1CB0F6" : "#2B343B" }}>
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white">
                  {user.username}
                  {user.is_current_user && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-md bg-[#1CB0F6] text-[9px] font-black uppercase tracking-wider text-[#0E1418]">
                      You
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[#8A97A0]">League Member</span>
              </div>
            </div>
            <div className="font-extrabold text-sm text-white">
              {user.total_xp} <span className="text-xs font-bold text-[#8A97A0]">XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
