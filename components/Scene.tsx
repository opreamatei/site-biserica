"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const M = motion;

/** ---- KNOBS ---- */
const SCALE = 1.25;
const BG_SCROLL = -2500; // was -4000, now moves faster
const FADE = 0.05; // slightly longer fade for smoother transitions

export default function Scene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, BG_SCROLL]);

  const seqStayFast = (a: number, b: number) => {
    const o = useTransform(scrollYProgress, [a, a + FADE, 1], [0, 1, 1]);
    const y = useTransform(
      scrollYProgress,
      [a, (a + b) / 2, b, 1],
      ["10vh", "0vh", "0vh", "0vh"] // less vertical drift
    );
    return { o, y };
  };

  const S2 = seqStayFast(0.05, 0.15);
  const S3 = seqStayFast(0.15, 0.25);

  const SaintZoom = useTransform(scrollYProgress, [0.2, 0.8], ['80%', '120%'])
  const SaintOffset = useTransform(scrollYProgress, [0.2, 0.8], ['80rem', '-25rem'])
  const SaintOpacity = useTransform(scrollYProgress, [0.2, 0.8], ['40%', '100%'])
  const falcon1X = useTransform(scrollYProgress, [0.2, 0.35], ["-20vw", "120vw"]);
  const falcon1Opacity = useTransform(scrollYProgress, [0.2, 0.22, 0.33, 0.35], [0, 1, 1, 0]);

  const falcon2X = useTransform(scrollYProgress, [0.25, 0.4], ["120vw", "-20vw"]);
  const falcon2Opacity = useTransform(scrollYProgress, [0.25, 0.27, 0.38, 0.4], [0, 1, 1, 0]);

  const falcon3X = useTransform(scrollYProgress, [0.3, 0.45], ["-20vw", "120vw"]);
  const falcon3Opacity = useTransform(scrollYProgress, [0.3, 0.32, 0.43, 0.45], [0, 1, 1, 0]);

  const falcon4X = useTransform(scrollYProgress, [0.35, 0.5], ["120vw", "-20vw"]);
  const falcon4Opacity = useTransform(scrollYProgress, [0.35, 0.37, 0.48, 0.5], [0, 1, 1, 0]);

  return (
    <div className="max-w-screen w-[100vw] h-[200vh]" ref={ref}
    style={{
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 250px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 250px), transparent 100%)',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      }}
    >
      {/* Background */}
      <div className="absolute h-[200vh] w-full">
        <div className="relative h-full">
          <Image src="/assets/Sky.png" alt="Sky" fill className="object-cover" priority />
        </div>
      </div>

      {/* Foreground elements */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <M.div className="absolute inset-0 will-change-transform" style={{ y: bgY }} />

        {/* Cloud R */}
        <M.div
          className="absolute left-1/2 top-[17%] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: S2.o, y: S2.y, scale: SCALE }}
        >
          <div className="relative w-[120vw] md:w-[90vw] max-w-[1800px] aspect-[3/2]">
            <Image src="/assets/cloudR.png" alt="Cloud R" fill className="object-contain" />
          </div>
        </M.div>

        {/* SfTrifon + text */}
        <M.div
          className="absolute left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2"
          style={{ opacity: SaintOpacity, y: S3.y, scale: SaintZoom, paddingTop : SaintOffset }}
        >
          <div className="relative w-[70vw] sm:w-[50vw] md:w-[30vw] max-w-[320px] aspect-[3/4]">
            <Image src="/assets/SfTrifon.png" alt="Sfântul Trifon" fill className="object-contain" />
          </div>
        </M.div>

        {/* Falcons */}
        <M.div className="absolute top-[16%]" style={{ x: falcon1X, opacity: falcon1Opacity, scale: SCALE }}>
          <div className="relative w-[40vw] md:w-[22vw] max-w-[520px] aspect-[16/10]">
            <Image src="/assets/Falcon1.png" alt="Falcon 1" fill className="object-contain" />
          </div>
        </M.div>

        <M.div className="absolute top-[16%]" style={{ x: falcon2X, opacity: falcon2Opacity, scale: SCALE }}>
          <div className="relative w-[40vw] md:w-[22vw] max-w-[520px] aspect-[16/10]">
            <Image src="/assets/Falcon2.png" alt="Falcon 2" fill className="object-contain" />
          </div>
        </M.div>

        <M.div className="absolute bottom-[10%]" style={{ x: falcon3X, opacity: falcon3Opacity, scale: SCALE }}>
          <div className="relative w-[42vw] md:w-[24vw] max-w-[560px] aspect-[16/10]">
            <Image src="/assets/Falcon3.png" alt="Falcon 3" fill className="object-contain" />
          </div>
        </M.div>

        <M.div className="absolute bottom-[12%]" style={{ x: falcon4X, opacity: falcon4Opacity, scale: SCALE }}>
          <div className="relative w-[42vw] md:w-[24vw] max-w-[560px] aspect-[16/10]">
            <Image src="/assets/Falcon4.png" alt="Falcon 4" fill className="object-contain" />
          </div>
        </M.div>
      </div>
    </div>
  );
}
