"use client";

import { useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import VerticalParallax from "../Parallax";

export default function Background({
  classname,
  children,
}: PropsWithChildren & { classname?: string }) {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 1000]);

  const sparkle = useTransform(
    scrollYProgress,
    [0, 0.05, 0.1, 0.2, 0.4, 0.5, 1],
    [0, 0, 1, 0, 1, 0, 0]
  );

  return (
    <div className="relative w-full">
      {/* BACKGROUND: always behind */}
      <motion.div
        className={
          "absolute inset-0 -z-20 h-[500vh] w-full overflow-hidden " + classname
        }
        id="background-diffuse"
        style={{ y }}
      >
        <Image
          fill
          className="object-cover absolute"
          alt="background"
          src={"/background/concrete_wall_003_diff_8k.jpg"}
        />
        <motion.div
          style={{ opacity: sparkle }}
          className="absolute inset-0 pointer-events-none mix-blend-color-burn"
        >
          <Image
            fill
            className="object-cover"
            alt="background"
            src={"/background/concrete_wall_003_disp_8k.png"}
          />
        </motion.div>
        <div className="h-full absolute" />
      </motion.div>

      {/* PARALLAX + CONTENT */}
      <VerticalParallax>{children}</VerticalParallax>
    </div>
  );
}
