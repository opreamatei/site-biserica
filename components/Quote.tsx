"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";


const Quote = () => {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({ target: ref });

  // Scale imaginea de la 1 la 1.2 când scrollYProgress merge de la 0 la 0.5 (50%)
  const coloana_scale = useTransform(scrollYProgress, [0, 1], [1, 1.6]);
  const scale2 = useTransform(scrollYProgress, [0.3, 1], [1, 0.6]);
  const fadetext = useTransform(scrollYProgress, [0.6, 1], [1, 0]);

  const hint_fade = useTransform(scrollYProgress, [0, .2], [.7, 0]);

  return (
    <div
      ref={ref}
      className="h-[200vh] scroll-smooth mx-auto absolute z-2 max-w-[100vw] w-full"
    >
      <div className="transition duration-1000 mx-auto delay-300 sticky w-full min-h-screen flex items-center justify-center top-0 overflow-hidden">
        <div className="md:hidden absolute inset-0 z-0 mx-auto">
          <motion.div
            className="relative h-full mx-auto lg:w-4/4"
            style={{ scale: coloana_scale }}
          >
            <Image
              src="/principal.png"
              alt="stalpi"
              layout="fill"
              priority
              className="object-cover object-top"
            />
          </motion.div>
        </div>
        <div
          className="px-4 mx-auto
        text-white/80
        cursor-default text-center
        "
        >
          <motion.h1
            style={{ scale: scale2, opacity: fadetext }}
            className="text-4xl lg:text-6xl text-shadow-lg text-shadow-black/20"
          >
            <span className="text-[#c95d43]">„</span>
            Quote of the day
            <span className="text-[#c95d43]">”</span>
          </motion.h1>
          <motion.div style={{ opacity: hint_fade }} className="m-3 flex justify-center gap-2">
            <p>Glisează în jos</p>
            <Image
              src="/icons/ScrollDownArrows.gif"
              alt="Scroll down"
              width={30}
              height={20}
              unoptimized
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Quote;
