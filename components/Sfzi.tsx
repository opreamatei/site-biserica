"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import IconFrame from "./gen/IconFrame";

type LocalDay = {
  zi: number;
  zi_saptamana: string;
  sfinți: string[];
  tip: string;
  dezlegări: string[];
};

const Sfzi = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [sfinti, setSfinti] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateKey = `${yyyy}-${mm}-${dd}`;

    fetch("/data/calendar.json")
      .then((res) => res.json())
      .then((data: Record<string, LocalDay>) => {
        const entry = data[dateKey];
        if (entry && entry.sfinți?.length > 0) {
          setSfinti(entry.sfinți);
        } else {
          setSfinti(["Niciun sfânt înregistrat azi."]);
        }
      })
      .catch(() => {
        setSfinti(["Eroare la încărcarea calendarului."]);
      });
  }, []);

  return (
    <>
    <div className="mt-16 md:mt-20 px-4 mb-20">
      <div className="flex justify-center">
        <div className=" max-w-2xl flex flex-col justify-center min-w-min w-3/4">
          {/* Title */}
          <motion.h1
            ref={ref}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl text-center md:text-8xl font-normal text-[#2b220a] relative inline-block text-nowrap"
          >
            Sfinții zilei
            <span className="absolute bottom-0 left-0 w-full h-[2px] "></span>
          </motion.h1>

          {/* Saints list */}
          <div className="my-6 mb-10 text-sm sm:text-base md:text-lg text-black space-y-6">
            {sfinti.map((nume, i) => (
              <div key={i} className="flex items-center gap-2 justify-center">
                <span className="text-[#2b220a] text-center">{nume}</span>
               
              </div>
            ))}
          </div>

          <div className="w-full md:w-min min-w-1/2 mx-auto ">
            <IconFrame bgColor="bg-[#3a2e10]" textColor="text-white/50">
              <Link
                href="/Calendar"
                className="h-10 flex items-center justify-center text-nowrap"
              >
                <p className="">Vezi calendarul lunii</p>
              </Link>
            </IconFrame>
          </div>
          {/* Button */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeIn" }}
            className="mt-6 inline-block items-center text-xs sm:text-sm md:text-base leading-tight px-4 py-2 border border-[#c95d43] text-black font-normal cursor-pointer rounded-md hover:bg-gray-100 hover:text-black transition"
          ></motion.div> */}
        </div>
      </div>
    </div>
    <div className="relative w-full h-15 -mb-3 z-2">
      <Image
        src={'/patterns/top-bar.png'}
        alt="top-bar-pattern"
        className="object-cover"
            fill
      />

    </div>
    </>
  );
};

export default Sfzi;
