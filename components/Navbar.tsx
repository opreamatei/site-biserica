"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LINKS } from "@/app/constants";
import DonateButton from "./DonateButton";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [open]);

  return (
    <>
      <div
        className={`max-w-[100vw] w-full top-0 left-0 h-[4.2rem] ${!open
          ? "bg-[#02021fd5] shadow-xl backdrop-blur-xl z-40"
          : "bg-[#b1967d00] h-[6rem] z-[60]"
          } transition-all duration-300 fixed`}
      >
        {/* Logo */}
        <div
          className={`inset-x-0 absolute top-0 left-1/2 transition-all duration-300 -translate-x-1/2 h-full select-none ${open ? "" : "pt-2"
            }`}
        >
          <div className="w-full flex justify-center h-4/5">
            <Link
              href="/"
              className={`relative aspect-square h-full transition-all duration-300 ${open ? "invert-100 translate-y-5" : "invert-100"
                }`}
              onClick={() => setOpen(false)}
            >
              <Image src="/logo_negru_1.webp" alt="logo" fill />
            </Link>
          </div>
        </div>

        {/* Donate Button */}
        <div
          className={`absolute top-0 h-full animate-pulse flex items-center z-40
    left-6 
    lg:left-auto lg:right-30
    ${open ? "translate-y-2" : ""}
  `}
        >
          <DonateButton />
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className={`absolute right-6 h-full aspect-square max-w-8 z-[70] flex items-center justify-center transition-all duration-300 cursor-pointer select-none ${open ? "pt-5" : ""
            }`}
          aria-label="Toggle menu"
        >
          <Image
            src="/icons/val2 (1).webp"
            alt="top"
            width={300}
            height={100}
            className={`absolute object-contain scale-600 w-full h-0.5 transition-all duration-300 ease-in-out ${open ? "rotate-45 translate-y-0" : "-translate-y-1.5"
              }`}
          />
          <Image
            src="/icons/val1 (1).webp"
            alt="bottom"
            width={300}
            height={100}
            className={`absolute object-contain scale-600 w-full h-0.5 transition-all duration-300 ease-in-out ${open ? "-rotate-45 translate-y-0" : "translate-y-1.5"
              }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, paddingTop: 20 }}
            animate={{ opacity: 1, paddingTop: 0 }}
            exit={{ opacity: 0, paddingTop: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 top-0 left-0 w-screen h-screen bg-[#02021ff1] backdrop-blur-xl flex flex-col justify-center select-none"
          >
            {/* Navigation links */}
            <nav className="flex flex-col items-end justify-center h-full p-10 gap-10 text-right text-white/80">
              {LINKS.map(({ label, path }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                    delay: index * 0.07,
                  }}
                >
                  <Link
                    href={`/${path}`}
                    onClick={() => setOpen(false)}
                    className="text-2xl md:text-3xl lg:text-4xl hover:underline byzantin text-shadow-white/5 text-shadow-lg"
                  >
                    {label.split(" ").map((word, idx) => (
                      <span
                        key={idx}
                        className="first-letter:text-[1.4em] byzantin mr-1"
                      >
                        {word}
                      </span>
                    ))}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}