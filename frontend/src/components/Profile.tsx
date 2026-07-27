import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { Shield, Award, Calendar, Flame, Star, Zap, Users, UserPlus, Sparkles, Lock } from "lucide-react";

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface UserProfile {
  id: number;
  username: string;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  daily_xp_goal: number;
  current_streak: number;
  longest_streak: number;
  skills_completed: number;
  achievements: Achievement[];
}

// Mocked friends data
const SEEDED_FRIENDS = [
  { id: 101, username: "maria", xp: 120, streak: 7, status: "friend", avatar_color: "#FF6B6B" },
  { id: 102, username: "sam", xp: 75, streak: 2, status: "friend", avatar_color: "#1CB0F6" },
  { id: 103, username: "elena", xp: 210, streak: 14, status: "suggested", avatar_color: "#8B6BF2" },
  { id: 104, username: "carlos", xp: 95, streak: 5, status: "suggested", avatar_color: "#FF9600" },
  { id: 105, username: "yuki", xp: 350, streak: 30, status: "suggested", avatar_color: "#58CC02" },
];

interface ProfileProps {
  isSuper?: boolean;
}

export function Profile({ isSuper }: ProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState(SEEDED_FRIENDS);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await api.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleFollow = (friendId: number) => {
    setFriends(prev =>
      prev.map(f =>
        f.id === friendId ? { ...f, status: "friend" } : f
      )
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1CB0F6]"></div>
        <p className="text-[#8A97A0] text-sm font-bold">Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const currentFriends = friends.filter(f => f.status === "friend");
  const suggestedFriends = friends.filter(f => f.status === "suggested");

  return (
    <div className="max-w-2xl mx-auto w-full py-4 flex flex-col gap-6">
      

      {/* Header card */}
      <div className={`bg-[#131F24] border rounded-3xl p-6 flex items-center gap-6 ${
        isSuper ? "border-[#F1C40F]/30" : "border-[#232C33]"
      }`}>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-4xl text-white select-none relative ${
          isSuper ? "bg-gradient-to-br from-[#F1C40F] to-[#E67E22]" : "bg-[#58CC02]"
        }`}>
          {profile.username[0].toUpperCase()}
          {isSuper && (
            <div className="absolute -top-1 -right-1 bg-[#F1C40F] border-2 border-[#0E1418] rounded-full p-0.5">
              <Sparkles size={12} fill="#FFF" color="#FFF" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white">{profile.username}</h2>
            {isSuper && (
              <span className="px-2 py-0.5 rounded-lg bg-[#F1C40F]/15 border border-[#F1C40F]/30 text-[9px] font-black uppercase tracking-wider text-[#F1C40F]">
                Super
              </span>
            )}
          </div>
          <p className="text-sm text-[#8A97A0] flex items-center gap-1.5 mt-1">
            <Calendar size={14} /> Joined July 2026
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center gap-4">
          <Flame size={32} color="#FF9600" fill="#FF9600" className="bounce-slow" />
          <div className="flex flex-col">
            <span className="text-lg font-black text-white">{profile.current_streak}</span>
            <span className="text-xs font-bold text-[#8A97A0] uppercase tracking-wider">Streak</span>
          </div>
        </div>
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center gap-4">
          <Zap size={32} color="#FFC800" fill="#FFC800" />
          <div className="flex flex-col">
            <span className="text-lg font-black text-white">{profile.total_xp}</span>
            <span className="text-xs font-bold text-[#8A97A0] uppercase tracking-wider">Total XP</span>
          </div>
        </div>
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center gap-4">
          <Star size={30} color="#FFD700" fill="#FFD700" />
          <div className="flex flex-col">
            <span className="text-lg font-black text-white">{profile.skills_completed}</span>
            <span className="text-xs font-bold text-[#8A97A0] uppercase tracking-wider">Skills Completed</span>
          </div>
        </div>
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center gap-4">
          <Award size={32} color="#8B6BF2" fill="#8B6BF2" />
          <div className="flex flex-col">
            <span className="text-lg font-black text-white">{profile.achievements.length}</span>
            <span className="text-xs font-bold text-[#8A97A0] uppercase tracking-wider">Achievements</span>
          </div>
        </div>
      </div>

      {/* Friends Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Users size={20} color="#1CB0F6" /> Friends
          </h3>
          <span className="text-xs font-bold text-[#8A97A0]">{currentFriends.length} friends</span>
        </div>

        {/* Current Friends */}
        {currentFriends.map((friend) => (
          <div key={friend.id} className="bg-[#131F24] border border-[#232C33] rounded-3xl p-4 flex items-center justify-between hover:border-[#333E46] transition-colors duration-150">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white select-none"
                style={{ background: friend.avatar_color }}
              >
                {friend.username[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-white">{friend.username}</span>
                <span className="text-[11px] text-[#8A97A0] flex items-center gap-1">
                  <Flame size={10} color="#FF9600" fill="#FF9600" /> {friend.streak} day streak · {friend.xp} XP
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-[#58CC02]/10 border border-[#58CC02]/25 text-[10px] font-black uppercase tracking-wider text-[#58CC02]">
              Friends
            </span>
          </div>
        ))}

        {/* Suggested Friends */}
        {suggestedFriends.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-1 mt-2">
              <UserPlus size={16} color="#8A97A0" />
              <span className="text-xs font-bold text-[#8A97A0] uppercase tracking-wider">Suggested for you</span>
            </div>
            {suggestedFriends.map((friend) => (
              <div key={friend.id} className="bg-[#131F24] border border-[#232C33] rounded-3xl p-4 flex items-center justify-between hover:border-[#333E46] transition-colors duration-150">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white select-none"
                    style={{ background: friend.avatar_color }}
                  >
                    {friend.username[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm text-white">{friend.username}</span>
                    <span className="text-[11px] text-[#8A97A0] flex items-center gap-1">
                      <Flame size={10} color="#FF9600" fill="#FF9600" /> {friend.streak} day streak · {friend.xp} XP
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(friend.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1CB0F6] text-white font-black text-[10px] uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-[0_2px_0_#0F8BCA]"
                >
                  <UserPlus size={12} /> Follow
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Achievements section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-black text-white px-1">Unlocked Achievements</h3>
        {profile.achievements.length === 0 ? (
          <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-8 text-center text-sm text-[#8A97A0]">
            Complete lessons to unlock your first achievement badge!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.achievements.map((ach) => (
              <div key={ach.id} className="bg-[#131F24] border border-[#232C33] rounded-3xl p-4 flex items-center gap-4 hover:border-[#333E46] transition-colors duration-150">
                <div className="bg-[#8B6BF2]/15 p-3 rounded-full border border-[#8B6BF2]/25">
                  <Award size={24} color="#8B6BF2" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-white">{ach.name}</span>
                  <span className="text-xs text-[#8A97A0] mt-0.5">{ach.description}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
