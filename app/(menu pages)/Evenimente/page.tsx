"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import SimpleCarousel from "@/components/EventCarousel";
import { motion } from "framer-motion";
import Logo from "@/components/optimized/components/Logo";

type Slide = { image: string; caption?: string };

type Eveniment = {
  title: string;
  date: string;
  hour?: string;
  location?: string;
  adresa?: string;
  slides?: Slide[];
};

const EvenimentePage = () => {
  const [evenimente, setEvenimente] = useState<Eveniment[]>([]);

  useEffect(() => {
    const fetchEvenimente = async () => {
      try {
        const res = await fetch("/data/evenimente.json");
        const data: Eveniment[] = await res.json();
        setEvenimente(data);
      } catch (error) {
        console.error("Eroare la citirea fișierului JSON:", error);
      }
    };

    fetchEvenimente();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = evenimente
    .filter((ev) => new Date(ev.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = evenimente
    .filter((ev) => new Date(ev.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("ro-RO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="text-white  min-h-screen bg-[#0A0004] selection:bg-yellow-600 selection:text-white/90">
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen w-full px-6 py-12 overflow-hidden"
      >
        <div className="absolute  mask-b-from-0 inset-0  w-full  opacity-50 md:opacity-100 ">
          <div className="relative w-full h-full">

            <Image
              className="z-2 object-cover md:hidden "
              src={"/assets/fundal-phone.png"}
              alt="program-background"
              fill
            />

            <Image
              className="z-2 object-cover hidden md:block opacity-40 "
              src={"/assets/fundal2.png"}
              alt="program-background"
              fill
            />
          </div>
        </div>
        <div className="relative z-8 max-w-4xl mx-auto">
          {/* Upcoming Events */}
          <section className="mb-20 mt-25">
            <h1 className="text-3xl md:text-5xl font-semibold text-[#CFA73A] mb-20 text-center">
              Evenimente viitoare
            </h1>
            {upcoming.length === 0 ? (
              <div className="text-gray-400 text-center text-xl">
                Nu există evenimente viitoare anunțate.
              </div>
            ) : (
              <ul className="space-y-6 mt-20">
                {upcoming.map((ev, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <Image
                      src="/icons/sculptura.png"
                      alt="icon"
                      width={40}
                      height={30}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <div className="text-lg font-[merriweather] font-semibold">{ev.title}</div>
                      <div className="text-sm text-white/70">
                        {formatDate(ev.date)} • ora {ev.hour || "–"}
                      </div>
                      <div className="text-sm text-white/50">
                        {ev.adresa || ev.location || "–"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Past Events */}
          <section>
            <div className="border-b border-[#C59D30]/30 pb-4 mb-20" />

            <h1 className="text-3xl md:text-5xl font-semibold text-[#CFA73A] mb-25 text-center">
              Evenimente trecute
            </h1>

            {past.length === 0 ? (
              <div className="text-gray-400 text-center text-xl">
                Nu există evenimente trecute.
              </div>
            ) : (
              <ul className="space-y-10">
                {past.map((ev, i) => (
                  <li
                    key={i}
                    className="
            flex flex-col md:flex-row md:items-center 
            gap-6 md:gap-10
          "
                  >
                    <div className="flex flex-col w-full md:w-1/2">
                      <div className="flex items-start gap-4 mb-2">
                        <Image
                          src="/icons/sculptura.png"
                          alt="icon"
                          width={40}
                          height={30}
                          className="mt-1 shrink-0"
                        />
                        <div>
                          <div className="text-lg font-[merriweather] font-semibold">{ev.title}</div>
                          <div className="text-sm text-white/70">{formatDate(ev.date)}</div>
                          <div className="text-sm text-white/50">
                            {ev.adresa || ev.location || "–"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {ev.slides && ev.slides.length > 0 && (
                      <div className="px-0 md:px-4 w-full md:w-1/2 mt-4 md:mt-0">
                        <SimpleCarousel slides={ev.slides} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

        </div>
        <Logo theme='light' />
      </motion.div>
    </div>

  );
};

export default EvenimentePage;
