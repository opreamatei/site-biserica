"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const VerticalParallax = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const vh = (v: number) => window.innerHeight * (v / 100);

  const items = [
    {
      key: "valuri1",
      src: "/icons/valuri.webp",
      start: vh(100),
      end: vh(-40),
    },
    {
      key: "trandafiri1",
      src: "/icons/trandafir.webp",
      start: vh(80),
    end: vh(-60),
    },
    {
      key: "valuri2",
      src: "/icons/valuri.webp",
      start: vh(120),
    end: vh(-80),
    },
    {
      key: "trandafiri2",
      src: "/icons/trandafir.webp",
      start: vh(90),
    end: vh(-50),
    },
  ];

  return (
    <div ref={ref} className="relative w-full  -pt-5">
      <div className="absolute inset-0 z-10 overflow-hidden">
        {items.map((item, i) => {
          const y = useTransform(scrollYProgress, [0, 1], [item.start, item.end]);
          const ySmooth = useSpring(y, { stiffness: 50, damping: 40 });

          const opacity = useTransform(scrollYProgress, [0, 0.05, 0.75, 1], [0, 1, 1, 0]);

          return (
            <motion.img
              key={item.key}
              src={item.src}
              alt={item.key}
              style={{ y: ySmooth, x: (i - 1.5) * 200, opacity }}
              className="absolute left-1/2 -translate-x-1/2 w-20  h-auto opacity-80"
            />
          );
        })}
      </div>

      <div className="relative  flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

export default VerticalParallax;
