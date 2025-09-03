"use client";
import { useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { PropsWithChildren } from "react";
import { motion } from "framer-motion";

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
    <div
      className={"-z-2 absolute h-[520vh] w-full overflow-hidden " + classname}
      id="background-diffuse"
    >
      <motion.div
        className="relative h-full"
        style={{
          y: y, // atentie, vorbimd e o textura mare, vom misca imaginea cu transform (y in framer motion) in loc de top deoearece asta va utiliza gpu ul care este mai eficient.
        }}
      >
        <Image
          fill
          className="object-cover absolute"
          alt="background"
          src={"/background/concrete_wall_003_diff_8k.jpg"}
        />
        <motion.div
          style={{
            opacity: sparkle,
          }}
          className="absolute inset-0 pointer-events-none mix-blend-color-burn"
        >
          <Image
            fill
            className="object-cover"
            alt="background"
            src={"/background/concrete_wall_003_disp_8k.png"}
          />
        </motion.div>
        <div className="bg-c59d30 h-full z-2 absolute"></div>
        {children}
      </motion.div>
    </div>
  );
}
