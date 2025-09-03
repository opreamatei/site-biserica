// 'use client';
// import React, { useState, useEffect, useRef } from 'react';
// import { AnimatePresence, motion } from 'framer-motion';
// import Link from 'next/link';

// export default function SmoothVerticalCarousel() {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const containerRef = useRef<HTMLDivElement>(null);

//   const updateIndex = (newIndex: number) => {
//     if (newIndex < 0 || newIndex >= cards.length) return;
//     setCurrentIndex(newIndex);
//   };

//   useEffect(() => {
//     const handleWheel = (e: WheelEvent) => {
//       e.preventDefault();
//       if (e.deltaY > 0) {
//         updateIndex(currentIndex + 1);
//       } else if (e.deltaY < 0) {
//         updateIndex(currentIndex - 1);
//       }
//     };

//     const node = containerRef.current;
//     node?.addEventListener('wheel', handleWheel, { passive: false });
//     return () => node?.removeEventListener('wheel', handleWheel);
//   }, [currentIndex]);

//   const currentCard = cards[currentIndex];

//   return (
//     <div className="flex flex-col items-center w-screen">
//       <div
//         ref={containerRef}
//         className="relative h-[50vh] p-5 lg:h-[40vh] w-[90vw] lg:max-w-2/3 mx-auto flex items-center justify-center overflow-hidden"
//       >
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={currentCard.id}
//             initial={{ opacity: 0, y: 100 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -100 }}
//             transition={{ duration: 0.5, ease: 'easeInOut' }}
//           className="relative container h-full mx-auto rounded-xl shadow-[0_0_50px_#c95d434a] bg-[#c95d43]  p-6 text-center text-lg font-medium text-white select-none flex flex-col justify-between items-center"
//           >
//             <div className="mt-8">{currentCard.content}</div>

//             <Link
//               href={currentCard.route}
//               className="mb-4 px-4 py-2 bg-white text-[#c95d43] font-semibold rounded-md hover:bg-gray-100 transition"
//             >
//               Deschide pagina
//             </Link>

//           </motion.div>
//         </AnimatePresence>
//       </div>
//     </div>
//   );
// }

"use client";

import { MotionValue, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { motion } from "framer-motion";
import { CARD_DATA, easeInOutCirc, easeOutCubic } from "@/app/constants";
import IconFrame from "./gen/IconFrame";
import Link from "next/link";

const T = 3; // TOTAL CARDS
export function Card({
  index,
  scroll,
}: {
  index: number;
  scroll: MotionValue<number>;
}) {
  const bg_col = ["bg-[#0b1018]", "bg-[#1d0101]", "bg-[#1a190f]"][index % T];

  var life_start = index / T; // cardul intra aia [1]
  var life_end = (index + 1) / T; // cardul iese aici [4]
  var life_enter = life_start + 0.1; // cardul e complet vizibl aici [2]
  var life_exit = life_end + 0.1; // cardul e complet invizibl aici [3]

  // tweak la ultime 2 carduri
  if (index == 1) {
    life_exit -= 0.1;
  } else if (index == 2) {
    life_start -= 0.1;
    life_enter -= 0.1;
  } else if (index == 0) {
    life_start -= 1;
    life_enter -= 1;
  }

  const opacity = useTransform(
    scroll,
    [life_start, life_enter, life_exit, life_end],
    [0, 1, 1, 0],
    { ease: easeOutCubic }
  );
  const offset_y = useTransform(
    scroll,
    [life_start, life_enter, life_exit, life_end],
    [250, 0, 0, -250],
    { ease: easeOutCubic }
  );
  const scale = useTransform(
    scroll,
    [life_start, life_enter, life_exit, life_end],
    [1.1, 1, 1, 0.9],
    { ease: easeOutCubic }
  );
  const blur = useTransform(
    scroll,
    [life_start, life_enter, life_exit, life_end],
    ['blur(32px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
    { ease: easeOutCubic }
  );

  const data = CARD_DATA[index % CARD_DATA.length];

  // aici faci carduirle, ai un index de la 0,1,2 pentru fiecare card
  // poti faci o sctructura de fundatie sau sa iei brut pe fiecare : if (index == 0) return ... else if (index == 1) return ... ...
  return (
    <motion.div
      style={{
        opacity: opacity,
        y: offset_y,
        scale: scale,
        filter: blur
      }}
      className={`absolute ${bg_col} h-full w-full rounded-2xl grid place-items-center`}
    >
      <h1 className="text-4xl text-white/80">{data.content}</h1>
      <IconFrame>
        <Link href={"Evenimente"} className="text-base z-2 p-2 px-5">
          {"Vezi mai multe"}
        </Link>
      </IconFrame>
    </motion.div>
  );
}

export default function CardsCarousel() {
  // plan
  // 1. big div scrollabel -> small div viewport sticky
  // 2. get scroll -> on that small div display current card data
  // 3. change cards by scroll
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  scrollYProgress.onChange((v) => console.log(v));

  return (
    <div ref={ref} className="contianer md:w-1/2 mx-auto h-[180vh]">
      <div id="card-viewport" className=" m-5 min-h-[60vh] sticky top-[25vh]">
        <Card index={0} scroll={scrollYProgress} />
        <Card index={1} scroll={scrollYProgress} />
        <Card index={2} scroll={scrollYProgress} />
      </div>
    </div>
  );
}
