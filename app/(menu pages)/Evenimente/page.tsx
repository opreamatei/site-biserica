"use client";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import React, { useEffect, useState } from "react";

type Eveniment = {
  nume_eveniment: string;
  ora: string;
  adresa: string;
};

const EvenimentePage = () => {
  const [evenimente, setEvenimente] = useState<{ [key: string]: Eveniment }>(
    {}
  );

  useEffect(() => {
    const fetchEvenimente = async () => {
      try {
        const res = await fetch("/data/evenimente.json");
        const data = await res.json();
        setEvenimente(data);
      } catch (error) {
        console.error("Eroare la citirea fișierului JSON:", error);
      }
    };

    fetchEvenimente();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = Object.entries(evenimente)
    .filter(([date]) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());

  return (
    <>
      <div className="text-white p-8 min-h-[70vh] bg-black">
        <h1 className="text-2xl font-bold mb-6">Evenimente viitoare</h1>
        <div className="absolute h-full mask-b-from-0 inset-0 isolate w-full opacity-20 z-6">
          <div className="relative h-full">
            <Image
              fill
              className="z-4 object-cover absolute mix-blend-overlay"
              alt="background"
              src={"/background/concrete_wall_003_rough_8k.jpg"}
            />
            <Image
              className="z-2 blur-md bg-black-800 object-cover"
              src={"/assets/fundal-program.png"}
              alt="program-background"
              fill
            />
          </div>
        </div>

        <h1 className="text-5xl lg:text-7xl z-5 text-center mt-50 text-shadow-sm text-shadow-white/100 underline underline-offset-6 decoration-1">
          Evenimente
        </h1>
        {upcoming.length === 0 ? (
          <div className="text-gray-400 my-4 text-center text-shadow-white/20 text-shadow-sm text-2xl">
            <p>Nu există evenimente viitoare disponibile.</p>
          </div>
        ) : (
          <ul className="space-y-6">
            {upcoming.map(([date, ev]) => {
              const dataFormata = new Intl.DateTimeFormat("ro-RO", {
                day: "numeric",
                month: "long",
              }).format(new Date(date));

              return (
                <li key={date} className="border-l-4 border-[#c95d43] pl-4">
                  <div className="text-lg font-semibold">
                    {ev.nume_eveniment}
                  </div>
                  <div className="text-sm text-white/70">
                    {dataFormata} • ora {ev.ora}
                  </div>
                  <div className="text-sm text-white/50">{ev.adresa}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
};

export default EvenimentePage;
