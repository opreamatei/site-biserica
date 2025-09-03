"use client";

import { useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import Quote from "./Quote";
import Program from "./Program";
import Scene from "./Scene";

const HeroSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  return (
    <motion.div ref={containerRef} className="transition-colors duration-1000">
      <div
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black calc(100% - 700px), transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black calc(100% - 700px), transparent 100%)",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
        }}
      >
        <Quote />
        <Scene />
      </div>
    </motion.div>
  );
};

export default HeroSection;
