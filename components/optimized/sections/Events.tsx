"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import IconFrame from "../components/FrameButton";

type Eveniment = {
  title: string;
  date: string;
  hour?: string;
  location?: string;
  adresa?: string;
};

const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [eveniment, setEveniment] = useState<Eveniment | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const fetchEvenimente = async () => {
      try {
        const res = await fetch("/data/evenimente.json");
        const data = await res.json();

        const azi = new Date();
        azi.setHours(0, 0, 0, 0);

        const viitoare = data
          .filter((ev: any) => new Date(ev.date) >= azi)
          .sort(
            (a: any, b: any) =>
              new Date(a.date).getTime() - new Date(b.date).getTime()
          );

        if (viitoare.length > 0) {
          setEveniment(viitoare[0]);
        }
      } catch (err) {
        console.error("Eroare la citirea evenimentelor:", err);
      }
    };

    fetchEvenimente();
  }, []);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <div className="relative grid place-items-center w-full pb-40 mx-auto z-0">
      {/* Top pattern */}
      <div className="relative h-20 w-full z-1 -mt-4 mb-30 pointer-events-none">
        <Image
          src={"/patterns/pattern0.png"}
          className="object-cover"
          alt="tipar"
          fill
        />
      </div>

      {/* Background images */}
      <Image
        alt="background-events"
        src={"/covers/cover1.png"}
        fill
        className="absolute object-cover z-1 mask-t-from-1 mask-b-from-0 pointer-events-none"
      />
      <div className="absolute w-full h-full bg-[#0d111f] z-0 pointer-events-none"></div>

      {/* Event content */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 font-bold text-white/70 -mb-6 text-center"
      >
        {/* <h1 className="relative text-4xl lg:text-5xl leading-tight z-10 text-center">
          <span
            className="
      inline-block byzantin
      first-letter:text-[#55302f]
      first-letter:text-5xl
      first-letter:lg:text-7xl
      sm:ml-0 px-0
      text-white/80 pr-10
    "
          >
           Evenimente
          </span>

          <span
            className="
      block sm:block md:inline-block
      
      mt-2 sm:mt-1 md:mt-0
            byzantin
      first-letter:text-[#55302f]
      first-letter:text-5xl
      first-letter:lg:text-7xl
      text-white/80 pl-10
    "
          >
            Urmatoare
          </span>
        </h1> */}
        <h1 className="relative text-4xl lg:text-5xl leading-tight z-10 text-center inline-block byzantin text-white/70">
          Evenimente Urmatoare
        </h1>


      </motion.div>

      {eveniment ? (
        <div className="relative flex items-start gap-2 mt-18 z-10">
          <div>
            <Image
              src="/icons/sculptura.png"
              alt="icon"
              width={40}
              height={30}
              className="mt-1 pointer-events-none"
            />
          </div>

          <div className="text-white/70">
            <div className="text-xl lg:text-2xl">{eveniment.title}</div>
            <div className="flex items-center gap-2 text-base">
              {eveniment.date &&
                new Intl.DateTimeFormat("ro-RO", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(eveniment.date))}
              {eveniment.hour && (
                <>
                  <Image
                    src="/icons/dot.svg"
                    alt="dot icon"
                    width={24}
                    height={24}
                    className="pointer-events-none"
                  />
                  ora {eveniment.hour}
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-[20%] md:mt-15 text-white/50 z-10 text-center text-md sm:text-base md:text-lg px-6 sm:px-8">
          Nu există evenimente anunțate în viitorul apropiat.
        </p>


      )}

      {/* Button */}
      <div className="relative z-10 mt-[20%] md:mt-17">
        <IconFrame bgColor="bg-[#55302f]" textColor="text-white/50">
          <Link
            href={"Evenimente"}
            className={`text-base p-2 px-5 transition-transform duration-150 ${isPressed ? "scale-95 opacity-60" : "scale-100"}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            Vezi toate evenimentele
          </Link>
        </IconFrame>
      </div>

      {/* Bottom pattern */}
      <div className="relative w-full h-15 -mb-3 -bottom-40 transform translate-y-1/2 z-0 pointer-events-none">
        <Image
          src={"/patterns/top-bar.png"}
          alt="top-bar-pattern"
          className="object-cover"
          fill
        />
      </div>
    </div>
  );
};

export default Events;
