"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import VerticalParallax from "./Parallax";
import IconFrame from "./gen/IconFrame";

type Activitate = {
  nume: string;
  ora: string;
};

type Zi = {
  data: string;
  activitati: Activitate[];
};

const normalize = (str: string) =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const Program = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [ziAzi, setZiAzi] = useState<Zi | null>(null);

  useEffect(() => {
    const getProgram = async () => {
      try {
        const res = await fetch("/data/program.json");
        const data = await res.json();

        const zileOrd = [
          "duminică",
          "luni",
          "marți",
          "miercuri",
          "joi",
          "vineri",
          "sâmbătă",
        ];

        const azi = new Date();
        const ziIndex = azi.getDay();
        const ziCurenta = zileOrd[ziIndex];
        const ziAziData: Zi = data[ziCurenta];

        setZiAzi(ziAziData);
      } catch (e) {
        console.error("Eroare la încărcarea programului:", e);
      }
    };

    getProgram();
  }, []);

  const ziAfisata = ziAzi;

  return (
    <>
      <div className="z-2 px-4  mb-2 flex flex-col items-center gap-6">
        <div className="w-full max-w-3xl p-4 md:p-6 flex flex-col sm:flex-row md:items-center sm:items-start justify-center gap-4">
          {/* Left side: Date */}
          <h3 className="text-6xl md:text-8xl font-bold text-gray text-center sm:text-left sm:flex-1 text-[#2b220a] ">
            {/* {ziAfisata?.data || "..."} */}
            Astăzi
          </h3>

          {/* Divider: Responsive Orientation */}
          <span className="bg-[#2c2209] w-full h-[1.4px] sm:w-[1.4px] sm:h-[60px] md:h-[140px]"></span>

          {/* Right side: Activities */}
          <div className="text-sm md:text-base mt-4 text-gray sm:flex-1 text-center sm:text-left">
            {ziAfisata?.activitati.some(
              (act) => !act.ora && normalize(act.nume).includes("inchisă")
            ) ? (
              <p className="text-white">Biserica este închisă.</p>
            ) : (
              <div className="flex flex-col space-y-3">
                {ziAfisata?.activitati.map((act, i) => (
                  <div key={i} className="flex">
                    <p className=" text-left text-lg text-[#2b220a] ">
                      {act.ora ? (
                        <span className="font-bold absolute max-w-10">
                          {act.ora}
                        </span>
                      ) : (
                        <span className="text-nowrap absolute max-w-10">
                          ----
                        </span>
                      )}
                    </p>
                    <span className="text-lg  text-[#302508] pl-14 w-full text-left">
                      {act.nume}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <IconFrame
          bgColor="bg-[#2c2209]"
          textColor="text-white/50"
        >
          <Link href={"Program-Liturgic"} className="text-base z-2 p-2 px-5">
            {"Vezi programul săptămânii"}
          </Link>
        </IconFrame>
      </div>
    </>
  );
};

export default Program;
