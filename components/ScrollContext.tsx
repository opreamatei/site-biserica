"use client";

import { createContext, useContext, useRef } from "react";
import { useScroll } from "framer-motion";
import Image from "next/image";


interface ScrollContextValue {
  scrollYProgress: any;
}

const ScrollContext = createContext<ScrollContextValue | null>(null);

export const ScrollProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: ref,
  });

  return (
    <ScrollContext.Provider value={{ scrollYProgress }}>
      <div className="bg-c59d30" ref={ref}>
        {children}
      </div>
    </ScrollContext.Provider>
  );
};

export const useScrollContext = () => {
  const ctx = useContext(ScrollContext);
  if (!ctx) {
    throw new Error("useScrollContext must be used inside ScrollProvider");
  }
  return ctx;
};
