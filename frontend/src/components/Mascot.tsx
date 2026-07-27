import React from "react";

interface MascotProps {
  expression?: "normal" | "happy" | "sad" | "cheering" | "shocked";
  size?: number;
}

export function Mascot({ expression = "normal", size = 120 }: MascotProps) {
  // Duo Owl SVG component
  return (
    <div className="mascot-float select-none pointer-events-none" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="50" cy="90" rx="25" ry="5" fill="#000000" opacity="0.2" />

        {/* Feet */}
        <circle cx="40" cy="83" r="6" fill="#FF9600" />
        <circle cx="60" cy="83" r="6" fill="#FF9600" />

        {/* Body (Green Owl Shape) */}
        <path
          d="M25,35 C25,20 35,15 50,15 C65,15 75,20 75,35 C75,60 70,80 50,80 C30,80 25,60 25,35 Z"
          fill="#78C800"
        />

        {/* Belly Patch (Lighter Green) */}
        <path
          d="M35,55 C35,45 42,42 50,42 C58,42 65,45 65,55 C65,68 58,74 50,74 C42,74 35,68 35,55 Z"
          fill="#A5E020"
        />

        {/* Left Eye */}
        <circle cx="39" cy="38" r="11" fill="#FFFFFF" />
        <circle cx="39" cy="38" r="9" fill="#F4FFD0" opacity="0.6" />
        
        {/* Right Eye */}
        <circle cx="61" cy="38" r="11" fill="#FFFFFF" />
        <circle cx="61" cy="38" r="9" fill="#F4FFD0" opacity="0.6" />

        {/* Pupils & Eyebrows based on expression */}
        {expression === "normal" && (
          <>
            {/* Pupils */}
            <circle cx="41" cy="38" r="4.5" fill="#4B4B4B" />
            <circle cx="59" cy="38" r="4.5" fill="#4B4B4B" />
            {/* Highlights */}
            <circle cx="42.5" cy="36" r="1.5" fill="#FFFFFF" />
            <circle cx="60.5" cy="36" r="1.5" fill="#FFFFFF" />
            {/* Eyebrows */}
            <path d="M30,26 Q39,24 46,28" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M70,26 Q61,24 54,28" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {expression === "happy" && (
          <>
            {/* Curved happy eyes */}
            <path d="M32,38 Q39,32 46,38" stroke="#4B4B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M54,38 Q61,32 68,38" stroke="#4B4B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Happy Eyebrows */}
            <path d="M30,23 Q39,21 45,26" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M70,23 Q61,21 55,26" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {expression === "cheering" && (
          <>
            {/* Curved happy eyes */}
            <path d="M32,38 Q39,32 46,38" stroke="#4B4B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M54,38 Q61,32 68,38" stroke="#4B4B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Flushed cheeks */}
            <ellipse cx="30" cy="48" rx="4" ry="2.5" fill="#FF4B4B" opacity="0.4" />
            <ellipse cx="70" cy="48" rx="4" ry="2.5" fill="#FF4B4B" opacity="0.4" />
          </>
        )}

        {expression === "sad" && (
          <>
            {/* Sad Eyes */}
            <circle cx="39" cy="38" r="4.5" fill="#4B4B4B" />
            <circle cx="61" cy="38" r="4.5" fill="#4B4B4B" />
            {/* Sad Eyebrows slanted upwards at the nose */}
            <path d="M31,27 Q39,30 45,25" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M69,27 Q61,30 55,25" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Tears */}
            <ellipse cx="38" cy="48" rx="2" ry="4" fill="#1CB0F6" />
            <ellipse cx="62" cy="48" rx="2" ry="4" fill="#1CB0F6" />
          </>
        )}

        {expression === "shocked" && (
          <>
            {/* Wide wide eyes */}
            <circle cx="39" cy="38" r="3" fill="#4B4B4B" />
            <circle cx="61" cy="38" r="3" fill="#4B4B4B" />
            {/* Raised Eyebrows */}
            <path d="M29,21 Q39,18 45,23" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M71,21 Q61,18 55,23" stroke="#4B8C00" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        )}

        {/* Beak (Orange Triangle) */}
        {expression === "happy" || expression === "cheering" ? (
          // Open Beak
          <path
            d="M44,43 Q50,38 56,43 L50,54 Z M46,44 L54,44 L50,50 Z"
            fill="#FF9600"
          />
        ) : (
          // Closed Beak
          <path
            d="M43,43 L57,43 L50,53 Z"
            fill="#FF9600"
          />
        )}

        {/* Wings (Green flap details) */}
        {expression === "cheering" ? (
          // Raised Wings
          <>
            <path d="M26,45 C20,38 12,40 16,50 C19,57 26,52 26,45 Z" fill="#78C800" />
            <path d="M74,45 C80,38 88,40 84,50 C81,57 74,52 74,45 Z" fill="#78C800" />
          </>
        ) : (
          // Standard Wings
          <>
            <path d="M26,40 C18,45 18,58 26,55" stroke="#4B8C00" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M74,40 C82,45 82,58 74,55" stroke="#4B8C00" strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        )}
      </svg>
    </div>
  );
}
