import React, { useState } from "react";
import { Gem, Heart, Sparkles, Shield, Flame, Check } from "lucide-react";
import { api } from "../utils/api";

interface ShopProps {
  user: any;
  setUser: (user: any) => void;
  isSuper: boolean;
  setIsSuper: (val: boolean) => void;
}

export function Shop({ user, setUser, isSuper, setIsSuper }: ShopProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  const handleRefillHearts = async () => {
    if (user.gems < 150) {
      alert("Not enough gems!");
      return;
    }
    try {
      setLoading(true);
      const res = await api.refillHearts();
      setUser({
        ...user,
        hearts: res.hearts,
        gems: Math.max(0, user.gems - 150),
      });
      alert("Hearts refilled successfully!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyStreakFreeze = () => {
    if (user.gems < 200) {
      alert("Not enough gems!");
      return;
    }
    setUser({
      ...user,
      gems: Math.max(0, user.gems - 200),
    });
    alert("Streak Freeze active! Your next missed day will be protected.");
  };

  const handleBuySuper = () => {
    setShowCheckout(true);
    setCheckoutStep("form");
  };

  const confirmSubscription = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCheckoutStep("success");
      setIsSuper(true);
      setUser({
        ...user,
        hearts: user.max_hearts,
      });
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto w-full py-4 flex flex-col gap-6">
      {/* Super Duolingo Promotion Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-300 ${
        isSuper 
          ? "bg-gradient-to-r from-[#E3A857] via-[#F1C40F] to-[#F39C12] border-[#F1C40F] shadow-lg shadow-[#F1C40F]/15" 
          : "bg-gradient-to-r from-[#4E00C6] to-[#7B00FF] border-[#8B6BF2]"
      }`}>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5 max-w-md">
            <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-black/25 px-2.5 py-1 rounded-full w-fit">
              <Sparkles size={12} fill="#FFF" /> {isSuper ? "Super Active" : "Special Offer"}
            </span>
            <h2 className="text-2xl font-black text-white">
              {isSuper ? "You are a Super Learner!" : "Super Duolingo"}
            </h2>
            <p className="text-sm text-white/95 leading-relaxed">
              {isSuper 
                ? "Enjoy unlimited hearts, ad-free learning, and premium status accents across your profile!" 
                : "Unlock unlimited hearts, personalized practice, and support free education worldwide!"}
            </p>
          </div>
          {!isSuper && (
            <button
              onClick={handleBuySuper}
              className="px-6 py-3.5 rounded-2xl bg-white text-[#4E00C6] font-black text-sm uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#D9D3F8]"
            >
              Try Super Free
            </button>
          )}
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none select-none">
          <Sparkles size={160} fill="#FFF" />
        </div>
      </div>

      {/* Shop items */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-black text-white px-1">Power-ups & Refills</h3>

        {/* Refill Hearts */}
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#FF4B4B]/10 p-3 rounded-full border border-[#FF4B4B]/25">
              <Heart size={28} fill="#FF4B4B" color="#FF4B4B" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base">Refill Hearts</span>
              <span className="text-xs text-[#8A97A0] mt-0.5">Restore your hearts to maximum immediately</span>
            </div>
          </div>
          <button
            onClick={handleRefillHearts}
            disabled={user.hearts >= user.max_hearts || isSuper || loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1CB0F6] text-white font-black text-xs uppercase tracking-wider hover:brightness-105 disabled:opacity-40 disabled:pointer-events-none active:scale-95 transition-all shadow-[0_3px_0_#0F8BCA]"
          >
            <Gem size={12} fill="#FFF" /> 150 Gems
          </button>
        </div>

        {/* Streak Freeze */}
        <div className="bg-[#131F24] border border-[#232C33] rounded-3xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-[#FF9600]/10 p-3 rounded-full border border-[#FF9600]/25">
              <Flame size={28} fill="#FF9600" color="#FF9600" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base">Streak Freeze</span>
              <span className="text-xs text-[#8A97A0] mt-0.5">Allows your streak to remain in place if you miss a day</span>
            </div>
          </div>
          <button
            onClick={handleBuyStreakFreeze}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#1CB0F6] text-white font-black text-xs uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-[0_3px_0_#0F8BCA]"
          >
            <Gem size={12} fill="#FFF" /> 200 Gems
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-[#131F24] border border-[#232C33] rounded-3xl p-6 shadow-2xl relative">
            {checkoutStep === "form" ? (
              <div className="flex flex-col gap-4 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#8B6BF2]/10 border border-[#8B6BF2]/20 flex items-center justify-center text-[#8B6BF2]">
                  <Sparkles size={32} fill="#8B6BF2" />
                </div>
                <h3 className="text-xl font-black text-white">Upgrade to Super Duolingo</h3>
                <p className="text-xs text-[#8A97A0]">
                  This is a mock check-out form simulating an in-app purchase. No real money will be charged.
                </p>

                {/* Mock Card Form */}
                <div className="flex flex-col gap-3 text-left mt-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A97A0]">Card Number</label>
                    <input
                      type="text"
                      readOnly
                      value="•••• •••• •••• 4242"
                      className="w-full mt-1 p-3 rounded-xl border border-[#232C33] bg-[#0E1418] text-white text-sm font-semibold select-all focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A97A0]">Expires</label>
                      <input
                        type="text"
                        readOnly
                        value="12/29"
                        className="w-full mt-1 p-3 rounded-xl border border-[#232C33] bg-[#0E1418] text-white text-sm font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8A97A0]">CVC</label>
                      <input
                        type="text"
                        readOnly
                        value="***"
                        className="w-full mt-1 p-3 rounded-xl border border-[#232C33] bg-[#0E1418] text-white text-sm font-semibold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 py-3.5 rounded-2xl bg-[#232C33] border border-[#333E46] text-[#8A97A0] font-black text-sm uppercase tracking-wider hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSubscription}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl bg-[#58CC02] text-white font-black text-sm uppercase tracking-wider hover:brightness-105 active:scale-95 transition-all shadow-[0_4px_0_#46A302]"
                  >
                    {loading ? "Processing..." : "Subscribe"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#58CC02]/10 border border-[#58CC02]/20 flex items-center justify-center text-[#58CC02] animate-bounce">
                  <Check size={36} strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-black text-white">Welcome to Super!</h3>
                <p className="text-sm text-[#8A97A0]">
                  Your subscription is now active. Enjoy infinite hearts and premium gold themes!
                </p>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-[#58CC02] text-white font-black text-sm uppercase tracking-wider hover:brightness-105 shadow-[0_4px_0_#46A302]"
                >
                  Start Learning
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
