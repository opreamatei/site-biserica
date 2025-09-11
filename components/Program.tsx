"use client";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IconFrame from "./gen/IconFrame";
import Loader from "./Loader";

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
  const router = useRouter();

  // Loader state
  const [loading, setLoading] = useState(false);

  const [ziAzi, setZiAzi] = useState<Zi | null>(null);

  // Fetch today's program
  useEffect(() => {
    const getProgram = async () => {
      setLoading(true); // show loader while fetching
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
      } finally {
        setLoading(false); 
      }
    };

    getProgram();
  }, []);

  const handleNavigation = async () => {
    setLoading(true);

    //  artificial delay for demo purposes
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('loadingbar!!');
    router.push("/Program-Liturgic");
  };

  const ziAfisata = ziAzi;

  return (
    <>
      <Loader isLoading={loading} />

      <div className="z-2 px-4 mb-2 flex flex-col items-center gap-6">
        <div className="w-full max-w-3xl p-4 md:p-6 flex flex-col sm:flex-row md:items-center sm:items-start justify-center gap-4">
       
          <h3 className="text-6xl md:text-8xl font-bold text-gray text-center sm:text-left sm:flex-1 text-[#2b220a]">
            Astăzi
          </h3>

          {/* Divider */}
          <span className="bg-[#2c2209] w-full h-[1.4px] sm:w-[1.4px] sm:h-[60px] md:h-[140px]"></span>

          <div className="text-sm md:text-base mt-4 text-gray sm:flex-1 text-center sm:text-left">
            {ziAfisata?.activitati.some(
              (act) => !act.ora && normalize(act.nume).includes("inchisă")
            ) ? (
              <p className="text-white">Biserica este închisă.</p>
            ) : (
              <div className="flex flex-col space-y-3">
                {ziAfisata?.activitati.map((act, i) => (
                  <div key={i} className="flex">
                    <p className="text-left text-lg text-[#2b220a]">
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
                    <span className="text-lg text-[#302508] pl-14 w-full text-left">
                      {act.nume}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <IconFrame bgColor="bg-[#2c2209]" textColor="text-white/50">
          <button
            onClick={handleNavigation}
            className="text-base z-2 p-2 px-5"
          >
            Vezi programul săptămânii
          </button>
        </IconFrame>
      </div>
    </>
  );
};

export default Program;
