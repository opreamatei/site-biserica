"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import useFixedViewportHeight from "@/components/hooks/useFixedViewport";
import useIsMobile from "@/components/hooks/useMobile";
import IconFrame from "../components/FrameButton";

export default function DonatePage({ opacity = 1, x = 0, y = 0 }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const fixedViewportHeight = useFixedViewportHeight();
  const pinnedHeight = fixedViewportHeight ? `${fixedViewportHeight}px` : undefined;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const clampedProgress = useTransform(scrollYProgress, (value) =>
    Math.min(Math.max(value, 0), 1)
  );

  const scale = useTransform(clampedProgress, [0, 0.5, .8], [1.15, 1.3, 1.2]);
  const baseY = useTransform(clampedProgress, [0, 0.65, .7], [-120, 40, 0]);
  const imageY = useTransform(baseY, (value) => value + y);

  const titleOpacity = useTransform(clampedProgress, [0.35, 0.55], [0, 1]);
  const titleY = useTransform(clampedProgress, [0.35, 0.45, 0.55, 0.9], [-100, 50, 80, -50]);
  const subtitleY = useTransform(clampedProgress, [0.4, 0.5, 0.6, 0.95], [-30, 60, 80, -50]);
  const subtitleOpacity = useTransform(clampedProgress, [0.3, 0.4], [0, 1]);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const popOutElement = useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const click_event = (ev: MouseEvent)=>{
      const el = popOutElement.current;
      if(!el) return;
      
      const {x, y} = {x : ev.clientX, y : ev.clientY};
      const { left, right, top, bottom } = el.getBoundingClientRect();

      if (!(x > left && x < right && y > top && y < bottom)){
        setShowPopup(false);
      }
    }

    window.addEventListener('mousedown', click_event);
    return ()=>{
      window.removeEventListener('mousedown', click_event);
    }
  }, []);

  // Disable page scroll when popup is open
  useEffect(() => {

    const html = document.documentElement;
    const body = document.body;

    if (showPopup) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
    } else {
      html.style.overflow = "";
      body.style.overflow = "";
    }

    return () => {
      html.style.overflow = "";
      body.style.overflow = "";

    };
}, [showPopup]);

  const handleTouchStart = () => {
    setIsPressed(true);
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };


  const isMobile = useIsMobile(700);

  return (
    <section
      ref={sectionRef}
      className="relative z-2 w-screen text-lg text-black bg-[#171813] mask-top-fade"
  
      >
      <div
        className="sticky top-0 h-screen w-screen overflow-hidden bg-black"
        style={
          !isMobile ? { height: pinnedHeight ,
          WebkitMaskImage:
            "linear-gradient(to top, black 0%, black calc(100% - 200px), transparent 100%)",
          maskImage:
            "linear-gradient(to top, black 0%, black calc(100% - 200px), transparent 100%)",
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",

        } : {
          height: pinnedHeight
        }}

      >

      {/* <div className="absolute top-0 md:block hidden w-full h-15 overflow-hidden z-1">
        <Image
          src="/patterns/top-bar.png"
          alt="top-bar-pattern"
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/10 z-2  " />
      </div> */}

        <motion.div
          className="relative h-full  w-full object-top left-1/2 top-1/2 -translate-1/2"
          style={{
            scale,
            opacity,
            x,
            y: imageY,
            transformOrigin: "center bottom",
          }}
        >
          <Image
            fill
            sizes="100vw"
            src="/assets/iesire(1).png"
            priority
            quality={100}
            className="object-cover object-bottom md:hidden z-2"
            alt="background"
          />
          <div>
          <Image
            fill
            sizes="100vw"
            src="/assets/poza-wide-md.png"
            priority
            quality={100}
            className="object-cover object-top hidden md:block  z-2"
            alt="background"
          />
            <div className="absolute inset-0 bg-black/50 z-2 hidden md:block " />

          </div>
            
          <div className="absolute inset-0 z-0 md:hidden md:scale-250 scale-180 left-1/2 top-2/3 -translate-1/2">
            <Image
              fill
              sizes="100vw"
              src="/assets/poza-wide-md.png"
              quality={100}
              className="object-cover object-bottom"
              alt="stars background"
            />
            <div className="absolute inset-0 bg-black/50 z-2  md:hidden " />
          </div>

          <div className="absolute  inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <motion.h2
              style={{ opacity: titleOpacity, y: titleY }}
              className="text-2xl lg:text-5xl font-semibold tracking-tight drop-shadow-2xl z-3 text-shadow-black/20 text-shadow-xs bg-gradient-to-b from-yellow-600 to-orange-50 bg-clip-text text-transparent "
            >
              Daruind <span className="text-2xl lg:text-4xl byzantin">vei</span> dobandi
            </motion.h2>

            <div className=" flex flex-col items-center z-15">
              <motion.p
                style={{ opacity: subtitleOpacity, y: subtitleY }}
                className="max-w-[60vw] text-base sm:text-lg text-white/90 z-13 "
              >
                <p className="mb-8 text-shadow-xs text-shadow-black">
                „Foișorul” Smarandei Doamna, numit și al Mavrocordaților, are atâta nevoie
                de ajutorul tău, privitorule și omule drag, pentru a renaște din negura vremii.
                  </p>
                  <motion.div
                    whileHover={{scale : 1.1}}
                    onTap={() => setShowPopup(true)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <IconFrame
                      bgColor="bg-[#786543]"
                      textColor="text-[#ddd] text-sm w-fit px-2 md:max-w-60 mx-auto active:brightness-90
"
                      >
                      <p
                      className={`py-1 px-2 p-2 z-2 transition-transform duration-150 inline-flex ${isPressed ? "scale-95" : "scale-100"}`} 
                      >
                        Detalii pentru donație
                      </p>
                    </IconFrame>
                  </motion.div>
              </motion.p>
              {/* <motion.p
                style={{ opacity: subtitleOpacity, y: subtitleY }}
                className="max-w-[60vw] text-base sm:text-lg text-white/90 z-3 drop-shadow-xl flex flex-col items-center"
              >
                vremii și cenușa veacului trecut la mareția-i de odinioară. Dacă ai dare
                de suflet și dare de mână poți ajuta chiar acum lăsând darul tău
                <strong> aici </strong>.

              </motion.p> */}
            </div>


          </div>
        </motion.div>
      </div>

      {showPopup && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
        >
          <div
          ref={popOutElement}
            className="relative max-w-md z-5 w-full bg-[#02021fd5] shadow-xl backdrop-blur-xl text-white p-6 rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()} // prevents closing when tapping inside
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute z-5 top-3 right-3 w-4 h-4  flex items-center justify-center 
  cursor-pointer hover:scale-110 transition z-6"
            >
              <Image
                src="/icons/close-circle.svg"
                alt="Close"
                width={24}
                height={24}
                className="w-full h-full object-contain"
              />
            </button>


            <p className="text-base leading-relaxed pt-2">
              Dacă ai dare
                de suflet și dare de mână poți ajuta chiar acum, lăsând darul tău
                <strong> aici </strong>.
                <br />
                Pentru depunerile ce le efectuați, contul Bisericii Foișor este
              <strong className="text-[#C59D30] animate-pulse"> RO77RNCB0069148541980001 </strong> deschis la BCR, CIF 13360648.
              <br /><br />
              Pentru sumele ce le depuneți vă rugăm să menționați la detalii:
              <strong className="text-[#C59D30]"> DONAȚIE </strong>.
            </p>
          </div>
        </div>
      )}

    </section>
  );
}
