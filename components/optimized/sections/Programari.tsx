"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import IconFrame from "../components/FrameButton";


const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [isPressed, setIsPressed] = useState(false);


  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div className="relative grid place-items-center w-full pb-40 mx-auto z-0 md:min-h-[900px] lg:min-h-[1050px] mt-[124px] sm:mt-[92px] md:mt-[44px] lg:mt-[20px]">
      {/* Top pattern */}
      <div className="relative w-full -mt-13 mb-60 pointer-events-none ">
        <div className="relative h-15 w-full z-1 mx-auto ">
          <Image
            src={"/patterns/top-bar.png"}
            className="object-cover object-center"
            alt="tipar"
            fill
          />
        </div>
      </div>

      {/* Background images */}
      <Image
        alt="background-events"
        src={"/assets/pelican.webp"}
        fill
        className="absolute object-cover object-top md:-top-10 lg:-top-14 md:h-[calc(100%+10px)] lg:h-[calc(100%+14px)] md:mt-10 z-0 md:min-h-[1050px] lg:min-h-[1200px] mask-b-from-120 md:mask-t-from-240 md:mask-b-from-10 opacity-75 md:opacity-100 pointer-events-none"
      />
     <div className="absolute w-full h-full z-0 pointer-events-none bg-black/45 mask-t-from-175 mask-b-from-95 md:-top-10 lg:-top-14 md:h-[calc(100%+10px)] lg:h-[calc(100%+14px)]" />

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 font-bold text-white/70 mb-6 text-center -translate-y-10 sm:-translate-y-14 md:-translate-y-18"
      >
        <h1 className="relative text-4xl lg:text-5xl leading-tight z-10 text-center inline-block byzantin text-white/70">
          Organizator Spovedanie
        </h1>


      </motion.div>

      <div className="relative flex items-start gap-2 mt-10 z-10 -translate-y-10 sm:-translate-y-14 md:-translate-y-18">

        <div className="text-white/70">
          <div className="flex items-center gap-2 text-base">
            <p className="text-white/90 z-10 text-center text-md sm:text-base md:text-lg px-6 sm:px-8">
              Aici poți afla când și dacă te mai poți înscrie pentru Taina Mărturisirii în ziua aleasă de tine</p>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="relative z-10 mt-19 md:mt-12 -translate-y-10 sm:-translate-y-14 md:-translate-y-18">
        <IconFrame bgColor="bg-[#395493]" textColor="text-white/80">
          <Link
            href={"Programator"}
            className={`text-base p-2 px-5 transition-transform duration-150 ${isPressed ? "scale-95 opacity-60" : "scale-100"}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            Înscrie-te pentru Taina Mărturisirii
          </Link>
        </IconFrame>
      </div>
    </div>
  );
}

export default Events;






