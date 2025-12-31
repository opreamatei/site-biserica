"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Logo from "@/components/optimized/components/Logo";

const GoogleMap = dynamic(() => import('@/components/Map'), { ssr: false });

const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

const Page = () => {
  const [usePhoneImages, setUsePhoneImages] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    setUsePhoneImages(media.matches);
    const handler = (e: MediaQueryListEvent) => setUsePhoneImages(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (showPolicy) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [showPolicy]);

  const diffuseSrc = usePhoneImages
    ? "/background/concrete_wall_003_diff_8k_phone.jpg"
    : "/background/concrete_wall_003_diff_8k.jpg";

  const displacementSrc = usePhoneImages
    ? "/background/concrete_wall_003_disp_8k_phone.png"
    : "/background/concrete_wall_003_disp_8k.png";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="relative min-h-screen bg-[#c59d30] px-6 py-12 text-white overflow-x-hidden selection:bg-yellow-600 selection:text-black/90"
    >
      {/* BACKGROUND */}
      <motion.div
        className="absolute inset-0 h-full w-full opacity-10 overflow-hidden"
      >
        {/* Diffuse layer */}
        <Image
          fill
          priority
          quality={100}
          sizes="100vw"
          className="object-cover"
          alt="background diffuse"
          src={diffuseSrc}
        />

        {/* Displacement / overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-color-burn"
        >
          <Image
            fill
            priority
            quality={100}
            sizes="100vw"
            className="object-cover"
            alt="background displacement"
            src={displacementSrc}
          />
        </motion.div>

        <div className="h-full absolute" />
      </motion.div>

      <div className="relative z-2 max-w-3xl mx-auto flex flex-col gap-10 text-black">
        <h1 className="text-5xl  lg:text-6xl text-center mt-[100px] mb-12 text-black/90">
          Contact
        </h1>

        <div className="flex items-start gap-4">
          <Image src="/icons/phone.svg" alt="phone" width={28} height={28} />
          <div>
            <p className="text-2xl lg:text-3xl font-medium">Telefon</p>
            <div className="mt-2 flex flex-col text-black/70 text-lg lg:text-xl lg:text-base">
              <div className="flex flex-col italic mt-1">
                <span>Preot Sorin Petre Georgescu</span>
                <a href="tel:+40742039585" className="text-[#A33B20] hover:underline">
                  +40 742 039 585
                </a>
              </div>
              <div className="flex flex-col italic mt-1 ">
                <span>Preot Constantin Sandu</span>
                <a href="tel:+40723929011" className="text-[#A33B20] hover:underline">
                  +40 723 929 011
                </a>
              </div>
              <div className="flex flex-col italic mt-1">
                <span>Preot Gheorghe Oprea</span>
                <a href="tel:+40723257569" className="text-[#A33B20] hover:underline">
                  +40 723 257 569
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <MapPin className="w-6 h-6 mt-1 text-[#A33B20]" />
          <div>
            <p className="text-2xl lg:text-3xl font-medium">Adresă</p>
            <p className="text-black/70 text-lg lg:text-xl lg:text-base">
              Strada Foișorului Nr. 119, București
            </p>
            <a
              href="https://www.google.com/maps/place/Biserica+Foi%C8%99or/@44.4148078,26.1232117,816m/data=!3m1!1e3!4m15!1m8!3m7!1s0x40b1fee4b6582d25:0x1bdf1cb467c8b482!2sStrada+Foi%C8%99orului+119,+Bucure%C8%99ti+031178!3b1!8m2!3d44.4148018!4d26.1231604!16s%2Fg%2F11bw3z8s2j!3m5!1s0x40b1fee4b6582d25:0x456acf0f90f184d1!8m2!3d44.4147651!4d26.1230983!16s%2Fg%2F11bw8jsv4v?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="text-md lg:text-base text-[#A33B20] hover:underline"
            >
              Vezi pe Google Maps
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Mail className="w-6 h-6 mt-1 text-[#A33B20]" />
          <div>
            <p className="text-2xl lg:text-3xl font-medium">Email</p>
            <div className="flex flex-col gap-1 mt-1">
              <a
                href="mailto:contact@bisericafoisor.ro"
                className="text-[#A33B20] lg:text-base text-lg lg:text-xl hover:underline "
              >

                contact@bisericafoisor.ro
              </a>
              <a
                href="mailto:bisericafoisor@gmail.com"
                className="text-[#A33B20] lg:text-base text-lg lg:text-xl hover:underline "
              >

                bisericafoisor@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <Image src="/icons/info.svg" alt="informații" width={24} height={24} />
          <div>
            <p className="text-2xl lg:text-3xl font-medium">Info</p>
            <div className="mt-2 flex flex-col text-black/70 text-lg lg:text-xl lg:text-base">
              <button
                type="button"
                onClick={() => setShowPolicy(true)}
                className="text-lg lg:text-xl text-black/80 underline cursor-pointer hover:text-black/100"
              >
                Politica de confidențialitate
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-black/20 pt-6 mt-6">
          <GoogleMap />
        </div>
        

      </div>


      <div className="flex justify-center mt-10">
        <Logo theme="dark" />
      </div>

      {showPolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setShowPolicy(false)}
        >
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-black/20 bg-[#f7f0e2] text-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
              <p className="text-xl lg:text-2xl font-semibold">
                Politica de confidențialitate 
              </p>
              <button
                type="button"
                onClick={() => setShowPolicy(false)}
                className="rounded-full border border-black/20 px-3 py-1 text-sm font-semibold text-black/70 hover:bg-black/10"
                aria-label="Inchide"
              >
                x
              </button>
            </div>
            <div
              className="max-h-[calc(80vh-64px)] overflow-y-auto px-6 py-4 text-sm lg:text-base leading-relaxed text-black/80"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="font-semibold text-black/90">1. Introducere</p>
              <p className="mt-2">
                Politica de Confidențialitate explică ce date colectăm, cum le folosim și care sunt drepturile
                utilizatorilor atunci când folosesc site-ul nostru (programări, cont, resetare parolă).
              </p>

              <p className="mt-4 font-semibold text-black/90">2. Operatorul de date</p>
              <p className="mt-2">
                Operator: Biserica Foișor
                <br />
                Adresa: Str. Foișorului Nr. 119, București
                <br />
                Email: contact@bisericafoisor.ro
                <br />
                Telefon: +40 723 257 569
              </p>

              <p className="mt-4 font-semibold text-black/90">3. Ce date colectăm</p>
              <p className="mt-2">
                - Date de contact: nume, email, telefon (pentru cont și confirmarea programărilor).
                <br />
                - Date de programare: data, ora, tipul programarii și alte informații necesare.
                <br />
                - Date de autentificare: parola (stocată criptat/hashed).
                <br />
                - Date tehnice minime: informații necesare funcționării site-ului (ex. cod de resetare).
              </p>

              <p className="mt-4 font-semibold text-black/90">4. Scopurile prelucrării</p>
              <p className="mt-2">
                - Creare cont și autentificare.
                <br />
                - Gestionarea programărilor și comunicarea lor.
                <br />
                - Resetarea parolei prin email.
                <br />
                - Siguranța și funcționarea platformei.
              </p>

              <p className="mt-4 font-semibold text-black/90">5. Temeiul legal</p>
              <p className="mt-2">
                Prelucrăm datele pe baza:
                <br />
                - executării unui contract (art. 6(1)(b) GDPR) pentru cont și programări;
                <br />
                - consimțământului (art. 6(1)(a)) acolo unde este cazul;
                <br />
                - interesului legitim (art. 6(1)(f)) pentru securitatea și integritatea serviciului.
              </p>

              <p className="mt-4 font-semibold text-black/90">6. Destinatari / terți</p>
              <p className="mt-2">
                Datele pot fi prelucrate de furnizori terți, strict pentru funcționarea serviciului:
                <br />
                - Sanity – stocarea datelor de programări și conturi;
                <br />
                - Resend – trimiterea emailurilor pentru resetarea parolei.
                <br />
                Acești furnizori acționează ca împuterniciți și au obligații GDPR.
              </p>

              <p className="mt-4 font-semibold text-black/90">7. Transferuri internaționale</p>
              <p className="mt-2">
                Dacă datele sunt transferate în afara SEE prin furnizori (ex. servicii cloud), acestea sunt
                protejate prin garanții adecvate (ex. clauze contractuale standard).
              </p>

              <p className="mt-4 font-semibold text-black/90">8. Durata stocării</p>
              <p className="mt-2">
                - Datele de programare: păstrate până la finalizarea programării, apoi șterse/anonimizate
                conform politicii interne.
                <br />
                - Datele de cont: păstrate cât timp contul este activ.
                <br />
                - Date de resetare: păstrate doar până la expirarea programării.
                <br />
              </p>

              <p className="mt-4 font-semibold text-black/90">9. Drepturile dumneavoastră</p>
              <p className="mt-2">
                Aveți dreptul la:
                <br />
                - acces, rectificare, ștergere;
                <br />
                - restricționare, portabilitate;
                <br />
                - opoziție la prelucrare;
                <br />
                - retragerea consimțământului;
                <br />
                - depunerea unei plângeri la ANSPDCP.
                <br />
                Cereri: anspdcp@dataprotection.ro
              </p>

              <p className="mt-4 font-semibold text-black/90">10. Securitatea datelor</p>
              <p className="mt-2">
                Aplicăm măsuri tehnice și organizatorice adecvate pentru protecția datelor, inclusiv
                criptare/hashed pentru parole, acces controlat și monitorizare.
              </p>

              <p className="mt-4 font-semibold text-black/90">11. Modificări ale politicii</p>
              <p className="mt-2">
                Putem actualiza periodic această politică. Versiunea curentă este disponibilă pe această
                pagină.
              </p>

              <p className="mt-4 font-semibold text-black/90">12. Contact</p>
              <p className="mt-2">
                Pentru întrebări:
                <br />
                Email: contact@bisericafoisor.ro
                <br />
                Telefon: +40 723 257 569
                <br />
                Adresa: Str. Foișorului Nr. 119, București
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Page;
