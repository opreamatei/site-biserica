"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import IconFrame from "../components/FrameButton";

type LocalDay = {
  zi: number;
  zi_saptamana: string;
  sfinți: string[];
  dezlegări?: string[];
};

const Sfzi = () => {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [sfinti, setSfinti] = useState<string[]>([]);
  const [dezlegari, setDezlegari] = useState<{ text: string; icons: string[] } | null>(null);

    const [isPressed, setIsPressed] = useState(false);

  // Funcție pentru a simula efectul de apăsare
  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };
  useEffect(() => {
    if (typeof window === "undefined") return;

    const target = titleRef.current;
    if (!target) return;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.set(target, { opacity: 0, y: 50 });
      gsap.to(target, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: target,
          start: "top 80%",
          once: true,
        },
      });
    }, target);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    const todayKey = `${yyyy}-${mm}-${dd}`;
    const monthKey = `${yyyy}-${mm}`;

    fetch("/data/calendar.json")
      .then((res) => {
        if (!res.ok) throw new Error("Calendar JSON not found");
        return res.json();
      })
      .then((data: Record<string, Record<string, LocalDay>>) => {
        const entry = data[monthKey]?.[todayKey];

        if (entry?.sfinți?.length) {
          setSfinti(entry.sfinți);

          const dez = entry.dezlegări ?? [];
          if (dez.length) {
            const icons: string[] = [];
            let text = "";

            const hasFish = dez.some((d) => d.toLowerCase().includes("pește"));
            if (hasFish) {
              icons.push("/icons/fish.svg", "/icons/wine.svg", "/icons/oil.svg");
              text = "Dezlegare la pește, vin și untdelemn";
            }

            const hasHarti = dez.some((d) => d.toLowerCase().includes("hart"));
            if (hasHarti) {
              icons.push("/icons/harti.svg");
              text += text ? " și harți" : "Harți";
            }

            setDezlegari({ text, icons });
          } else {
            setDezlegari(null);
          }
        } else {
          setSfinti(["Niciun sfânt înregistrat azi."]);
          setDezlegari(null);
        }
      })
      .catch((err) => {
        console.error("Eroare la încărcarea calendarului:", err);
        setSfinti(["Eroare la încărcarea calendarului."]);
        setDezlegari(null);
      });
  }, []);

  return (
    <div className="relative">
      <section className="relative overflow-hidden w-full min-h-[60vh] py-20">
        <Image
          fill
          src="/assets/Sfinti.jpg"
          alt="Sfinti"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-5 flex flex-col items-center p-6 text-center mx-auto max-w-3xl space-y-6">
          <h1
            ref={titleRef}
            className="flex flex-wrap justify-center items-center text-white drop-shadow-lg"
          >
            <span className="text-7xl md:text-9xl byzantin text-[#c95d43]">S</span>
            <span className="text-3xl md:text-6xl byzantin ml-2">fintii</span>
            <span className="text-7xl md:text-9xl byzantin text-[#c95d43] ml-6 md:ml-10">Z</span>
            <span className="text-3xl md:text-6xl byzantin ml-2">ilei</span>
          </h1>

          <div className="flex flex-col space-y-2 text-white text-lg sm:text-xl drop-shadow-md">
            {sfinti.map((nume, i) => (
              <span key={i}>{nume}</span>
            ))}
          </div>

          {dezlegari && (
            <div className="flex flex-col sm:flex-row items-center gap-2 text-white/80 italic text-sm md:text-base">
              <span>{dezlegari.text}</span>
              <div className="flex gap-2">
                {dezlegari.icons.map((src, idx) => (
                  <Image key={idx} src={src} alt="" width={20} height={20} />
                ))}
              </div>
            </div>
          )}

          <IconFrame
            bgColor="bg-[#9E442E]"
            textColor="text-white/80 mt-8"
          >
            <Link
              href="/Calendar"
              className={`h-10 flex items-center p-4 transition duration-150 ${isPressed ? 'scale-95 opacity-60' : 'scale-100'}`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              Vezi calendarul lunii
            </Link>
          </IconFrame>
        </div>
      </section>


    </div>
  );
};

export default Sfzi;
