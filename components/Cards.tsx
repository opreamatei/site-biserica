"use client";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import useDebug from "../components/hooks/useDebug";

type CardVariant = "Card1" | "Card2" | "Card3";

 type Card = {
  title: string;
  desc: ReactNode;
  btnTxt: string;
  btnHref: string;
  imageSrc: string | null;
  variant: CardVariant;
};
type Eveniment = {
  title: string;
  date: string;
  hour?: string;
  location?: string;
  adresa?: string;
};

const Cards: Card[] = [
     {
      title: "Evenimente viitoare",
      desc: null,
      btnTxt: "Află mai multe",
      btnHref: "/Evenimente",
      imageSrc: "/assets/mozaic.webp",
      variant: "Card1",
    },
  {
    title: "Scurta monografie",
    desc: "Prezentare succintă a Bisericii Foișorul Mavrocordaților",
    btnTxt: "Citește mai multe",
    btnHref: "/About",
    imageSrc: "/assets/imgpictura.png",
    variant: "Card2",
  },
  {
    title: "Cateheze",
    desc: "Dialoguri catehetice și cuvântări cu caracter mistagogic",
    btnTxt: "Ascultă aici",
    btnHref: "/Cateheze",
    imageSrc: "/assets/imaginecard2.jpg",
    variant: "Card3",
  }
];

const variantClasses = {
  Card1: "h-48 sm:h-64 md:h-80 lg:h-[400px] object-contain object-cover",
  Card2: "h-48 sm:h-64 md:h-[300px] object-contain object-cover",
  Card3: "h-48 sm:h-64 md:h-80 lg:h-[400px]",
};

export default function CardSection() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const debug = useDebug();
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const [eveniment, setEveniment] = useState<Eveniment | null>(null);

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

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".c-card");
      if (!cards.length) return;

      const lastCardIndex = cards.length - 1;



      //  Pin, scale and fade logic
      cards.forEach((card, index) => {
        const isLast = index === lastCardIndex;

        // Reference ScrollTrigger for the last card
        const lastCardST = ScrollTrigger.create({
          trigger: cards[isLast ? index : index + 1],
          start: "center center",
        });

        gsap.set(card, { opacity: 1, scale: 1 }); // Start fully visible

        // When card leaves, fade out + scale down
        const anim = gsap.to(card, {
          opacity: isLast ? 1 : 0, // Last one stays visible
          scale: isLast ? 1 : .7,
          ease: "power2.inOut",
        });

        ScrollTrigger.create({
          trigger: card,
          start: "top top+=100",
          end: () => lastCardST.start,
          pin: true,
          pinSpacing: false,
          scrub: 0.6,
          animation: anim,
          markers: debug

        });

        const image = card.querySelector("figure img");
        if (image) {
          gsap.to(image, {
            yPercent: -15,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, [debug]);


  return (
    <section ref={rootRef} className="relative text-white mt-40 overflow-hidden">
      <div className="l-cards mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pb-42">
        {Cards.map((card, idx) => (
          <article
            key={card.title}
             className="c-card relative flex flex-col overflow-hidden 
             border border-[#202330] rounded-xl text-[#202330] bg-[#E1D4B7]
             shadow-2xl shadow-black/40 w-full md:w-3/4! md:mx-auto!"
          >
            {card.imageSrc && (
              <figure
                className={`c-card__figure relative ${variantClasses[card.variant]}`}
              >
                <Image
                  src={card.imageSrc}
                  alt=""
                  fill
                  sizes="100vw"
                  // className = {idx == 1 ? "object-fit max-w-150 mx-auto object-top" : ""}
                />
              </figure>
            )}

            <div
              className={`c-card__description flex flex-col justify-center gap-6 p-10 sm:p-12 lg:p-16 ${idx === 0 ? "text-center items-center" : "text-left"}`}
            >
              <h2
                className={`c-card__title text-3xl font-semibold text-[#202330] md:text-5xl ${idx === 0 ? "text-center" : "text-left"}`}
              >
                {card.title}
              </h2>

              {idx === 0 ? (
                <div className="c-card__excerpt text-base leading-relaxed text-[#202330]/80 md:text-lg w-full">
                  {eveniment ? (
                    <div className="relative flex items-start gap-2 justify-center">
                      <div>
                        {/* <Image
                          src="/icons/sculptura.png"
                          alt="icon"
                          width={40}
                          height={30}
                          className="mt-1 pointer-events-none"
                        /> */}
                      </div>

                      <div className="text-[#202330] text-left">
                        <div className="text-xl lg:text-3xl">{eveniment.title}</div>
                        <div className="flex items-center gap-2 text-base text-[#202330]/80">
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
                    <p className="text-[#202330]/80">
                      Nu există evenimente anunțate în viitorul apropiat.
                    </p>
                  )}
                </div>
              ) : (
                <p className="c-card__excerpt text-base leading-relaxed text-[#202330]/80 md:text-lg">
                  {card.desc}
                </p>
              )}

       
              <div
                className={`c-card__cta mt-4 flex items-center w-full ${idx === 0 ? "justify-center" : "justify-start"}`}
              >
                <Link
                  href={card.btnHref}
                  onTouchStart={() => setPressedIndex(idx)}
                  onTouchEnd={() => setPressedIndex(null)}
                  className={`inline-flex items-center justify-center rounded-full 
       border border-[#202330] px-5 py-3 text-sm text-nowrap 
       font-semibold uppercase tracking-[0.2em] text-[#202330] 
       transition-colors duration-200 hover:bg-[#202330] hover:text-white transition-transform duration-150 ${pressedIndex === idx ? "scale-85 opacity-60" : "scale-100"}`}
                >
                  {card.btnTxt}
                </Link>
              </div>
            </div>

          </article>
        ))}
      </div>

      <div className="absolute bottom-0 w-full h-15 overflow-hidden z-1">
        <Image
          src="/patterns/top-bar.png"
          alt="top-bar-pattern"
          fill
          className="object-cover object-center"
        />
      </div>


    </section>
  );
}
