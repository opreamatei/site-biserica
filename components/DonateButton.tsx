"use client";

import { useState } from "react";
import DonatePopup from "./DonatePopup";

export default function DonateButton() {
  const [openDonate, setOpenDonate] = useState(false);

  return (
    <>
     <button
  onClick={(e) => {
    e.stopPropagation();
    setOpenDonate(true);
  }}
  className="flex items-center justify-center p-1 cursor-pointer select-none relative z-40 pointer-events-auto"
  aria-label="Donate"
>
  <style>
    {`
      @keyframes goldPulse {
        0% {
          filter: drop-shadow(0 0 5px gold);
        }
        50% {
          filter: drop-shadow(0 0 20px gold) drop-shadow(0 0 30px gold);
        }
        100% {
          filter: drop-shadow(0 0 5px gold);
        }
      }
    `}
  </style>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="#C59D30"
    className="w-7 h-7 transition-transform hover:scale-110"
    style={{
      animation: "goldPulse 2s ease-in-out infinite"
    }}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 
             4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 
             14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 
             6.86-8.55 11.54L12 21.35z"/>
  </svg>
</button>

      <DonatePopup open={openDonate} onClose={() => setOpenDonate(false)} />
    </>
  );
}