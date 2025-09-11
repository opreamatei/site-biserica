"use client";

import { useRef, useEffect, useState, PropsWithChildren } from "react";
import {
  motion,
  useInView,
  useMotionTemplate,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { easeInOutCirc } from "@/app/constants";
import IconFrame from "./gen/IconFrame";

type Eveniment = {
  nume_eveniment: string;
  ora: string;
  adresa: string;
  data?: string;
};

const Events = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const [eveniment, setEveniment] = useState<Eveniment | null>(null);

  useEffect(() => {
    const fetchEvenimente = async () => {
      try {
        const res = await fetch("/data/evenimente.json");
        const data = await res.json();

        const azi = new Date();
        azi.setHours(0, 0, 0, 0);

        const dateKeys = Object.keys(data)
          .filter((key) => {
            const date = new Date(key);
            date.setHours(0, 0, 0, 0);
            return !isNaN(date.getTime()) && date >= azi;
          })
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

        if (dateKeys.length > 0) {
          const nextKey = dateKeys[0];
          setEveniment({
            ...data[nextKey],
            data: nextKey,
          });
        }
      } catch (err) {
        console.error("Eroare la citirea evenimentelor:", err);
      }
    };

    fetchEvenimente();
  }, []);

  return (
    <div className="relative grid place-items-center w-full my-30  pb-40 mx-auto">
      <div className="relative h-20 w-full -mt-4 mb-30 ">
        <Image
          src={"/patterns/pattern0.png"}
          className="object-contain"
          alt="tipar"
          fill
        />
      </div>
      <Image
        alt="background-events"
        src={"/covers/cover1.png"}
        fill
        className="absolute object-cover -z-1 mask-t-from-1 mask-b-from-0"
      />
      <div className="absolute -z-2 w-full h-full bg-[#0d111f]"></div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative font-bold text-white/70"
      >
        <h1 className="text-2xl lg:text-5xl">Evenimente următoare</h1>
      </motion.div>

      {eveniment ? (
        <div className="relative flex items-start gap-2 mt-6">
          <div className="mt-4">
            <Image
              src="/icons/diamond.svg"
              alt="diamond icon"
              width={24}
              height={24}
            />
          </div>

          <div className="text-white/70 mb-15">
            <div className="text-xl lg:text-2xl">
              {eveniment.nume_eveniment}
            </div>
            <div className="flex items-center gap-2 text-base">
              {eveniment.data &&
                new Intl.DateTimeFormat("ro-RO", {
                  day: "numeric",
                  month: "long",
                }).format(new Date(eveniment.data))}
              <Image
                src="/icons/dot.svg"
                alt="dot icon"
                width={24}
                height={24}
              />
              ora {eveniment.ora}
            </div>
          </div>
        </div>
      ) : (
        <p className=" mt-6 text-white/50">Nu există evenimente disponibile.</p>
      )}

      <div className="mt-10">

        <IconFrame bgColor="bg-[#55302f]" textColor="text-white/50">
          <Link href={"Evenimente"} className="text-base z-2 p-2 px-5">
            {"Vezi toate evenimentele"}
          </Link>
        </IconFrame>
      </div>
    </div>
  );
};

export default Events;
