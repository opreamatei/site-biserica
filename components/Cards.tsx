"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";

type BandMember = {
  tagline: string;
  title: string;
  excerpt: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
};


const MEMBERS: BandMember[] = [
  {
    tagline: "Amon The Sign",
    title: "Zzor / Bass",
    excerpt:
      "Zzor es el bajista de la banda de Darkwave española: Amon The Sign.",
    ctaLabel: "Escuchar en Youtube",
    ctaHref:
      "https://www.youtube.com/watch?v=aqacOQpfbxc&ab_channel=AmonTheSign",
    imageSrc:
      "",
    imageAlt: "Zzor",
  },
  {
    tagline: "Amon The Sign",
    title: "Amón Lopez / Vocals",
    excerpt:
      "Amón Lopez es la voz masculina de la banda de Darkwave española: Amon The Sign.",
    ctaLabel: "Escuchar en Youtube",
    ctaHref:
      "https://www.youtube.com/watch?v=aqacOQpfbxc&ab_channel=AmonTheSign",
    imageSrc:
      "",
    imageAlt: "Amón Lopez",
  },
  {
    tagline: "Amon The Sign",
    title: "Marisa / Vocals",
    excerpt:
      "Marisa es la voz femenina de la banda de Darkwave española: Amon The Sign.",
    ctaLabel: "Escuchar en Youtube",
    ctaHref:
      "https://www.youtube.com/watch?v=aqacOQpfbxc&ab_channel=AmonTheSign",
    imageSrc:
      "",
    imageAlt: "Marisa",
  },
  
];

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CardSection() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!rootRef.current) {
      return;
    }

    let lastCardTrigger: ScrollTrigger | null = null;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".c-card");
      if (cards.length === 0) {
        return;
      }

      const lastCardIndex = cards.length - 1;

      lastCardTrigger = ScrollTrigger.create({
        trigger: cards[lastCardIndex],
        start: "center center",
      });

      cards.forEach((card, index) => {
        const scaleTarget = index === lastCardIndex ? 1 : 0.5;

        gsap.set(card, { transformOrigin: "center center" });

        gsap.to(card, {
          scale: scaleTarget,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top top+=80",
            end: () => lastCardTrigger?.start ?? "bottom top",
            pin: true,
            pinSpacing: false,
            scrub: 0.5,
            toggleActions: "restart none none reverse",
          },
        });
      });

      ScrollTrigger.refresh();
    }, rootRef);

    return () => {
      ctx.revert();
      lastCardTrigger?.kill();
    };
  }, []);

  return (
    <section ref={rootRef} className="text-white mt-40">
     

      <div className="l-cards mx-auto flex max-w-[1200px] flex-col gap-6 px-6 pb-24">
        {MEMBERS.map((card, index) => (
          <article
            key={card.title}
            className="c-card relative grid h-[90vh] min-h-[600px] w-full grid-cols-1 overflow-hidden border border-[#202330] rounded-xl bg-white text-[#202330] shadow-2xl shadow-black/40 lg:grid-cols-2 lg:gap-6"
          >
            <div className="c-card__description flex flex-col justify-center gap-6 p-10 sm:p-12 lg:p-16">
              <span className="c-card__tagline text-sm font-semibold uppercase tracking-[0.2em] text-[#202330]/70">
                {card.tagline}
              </span>
              <h2 className="c-card__title text-3xl font-semibold text-[#202330] md:text-[40px]">
                {card.title}
              </h2>
              <p className="c-card__excerpt text-base leading-relaxed text-[#202330]/80 md:text-lg">
                {card.excerpt}
              </p>
              <div className="c-card__cta mt-4 flex items-center gap-4">
                <a
                  href={card.ctaHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-[#202330] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#202330] transition-colors duration-200 hover:bg-[#202330] hover:text-white"
                >
                  {card.ctaLabel}
                </a>
              </div>
            </div>

            <figure className="c-card__figure relative hidden overflow-hidden lg:block">
              <Image
                src={card.imageSrc}
                alt={card.imageAlt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
                priority={index === 0}
              />
            </figure>
          </article>
        ))}
      </div>

       <div className="relative w-full h-15 -mb-3 absolute -bottom-15 transform translate-y-1/2 z-10">
        <Image
          src={"/patterns/top-bar.png"}
          alt="top-bar-pattern"
          className="object-cover"
          fill
        />
      </div>
    </section>
  );
}
