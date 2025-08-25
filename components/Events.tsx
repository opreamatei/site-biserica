'use client'

import { useRef, useEffect, useState, PropsWithChildren } from 'react';
import { motion, useInView,  useMotionTemplate, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import VerticalParallax from './Parallax';

function easeInOutCirc(x: number): number {
return x < 0.5
  ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
  : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

const MaskedImage = (props : PropsWithChildren) => {
  const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
      target: ref,
      offset: ["start end", "end start"],
    });
    const newScale = useTransform(scrollYProgress, [0.05, .35, .8], [0.6, 1, 1.1],{ease :easeInOutCirc});
    const newRadius = useTransform(scrollYProgress, [0.05, .3, .4], [32, 5,0],{ease :easeInOutCirc});

    return (
        <motion.div style={{
          scale : newScale,
          borderRadius : newRadius
        }} ref={ref} className='absolute bg-black mx-auto w-screen rounded-xl py-3'>
            <div className='w-full  relative h-full  '>
                {/* <Image
                    fill
                    src='/clay.webp'
                    alt="semn"
                /> */}
                {props.children}
                            </div>
        </motion.div>
    );
};

type Eveniment = {
    nume_eveniment: string;
    ora: string;
    adresa: string;
    data?: string;
};

const Events = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    const [eveniment, setEveniment] = useState<Eveniment | null>(null);

    useEffect(() => {
        const fetchEvenimente = async () => {
            try {
                const res = await fetch('/data/evenimente.json');
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
                console.error('Eroare la citirea evenimentelor:', err);
            }
        };

        fetchEvenimente();
    }, []);

    return (
        <MaskedImage >

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="z-12 ml-[10%] text-[26px] font-bold text-white/70"
            >
                Evenimente următoare
            </motion.div>


            {eveniment ? (
                <div className="relative z-12 flex items-start gap-2 mt-6 ml-[10%]">
                    <div className="mt-4">
                        <Image src="/icons/diamond.svg" alt="diamond icon" width={24} height={24} />
                    </div>

                    <div className='text-white/70'>
                        <div className="text-[22px]">{eveniment.nume_eveniment}</div>
                        <div className="flex items-center gap-2 mt-[-2.5px] text-[15px]">
                            {eveniment.data &&
                                new Intl.DateTimeFormat('ro-RO', {
                                    day: 'numeric',
                                    month: 'long'
                                }).format(new Date(eveniment.data))
                            }
                            <Image src="/icons/dot.svg" alt="dot icon" width={24} height={24} />
                            ora {eveniment.ora}
                        </div>
                    </div>
                </div>
            ) : (
                <p className="ml-[10%] mt-6 text-white/50">Nu există evenimente disponibile.</p>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, ease: 'easeIn' }}
                className="relative z-12 ml-[15%] text-xs inline-block leading-tight mt-[40px] mb-[20px] px-4 py-2 border border-[#c95d43] text-white/70 font-normal cursor-pointer rounded-md hover:bg-gray-100 transition"
            >
                <Link href="/Evenimente">
                    Vezi toate evenimentele
                </Link>
            </motion.div>
        </MaskedImage>
    );
};

export default Events;



export const SmoothScrollHero = () => {
  return (
    <div className="bg-zinc-950">
      {/* <ReactLenis
        root
        options={{
          // Learn more -> https://github.com/darkroomengineering/lenis?tab=readme-ov-file#instance-settings
          lerp: 0.05,
          //   infinite: true,
          //   syncTouch: true,
        }}
      > */}
        <Hero />
      {/* </ReactLenis> */}
    </div>
  );
};


const SECTION_HEIGHT = 1500;

const Hero = () => {
  return (
    <div
      style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      className="relative w-full"
    >
      <CenterImage />

      <ParallaxImages />

      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-zinc-950/0 to-zinc-950" />
    </div>
  );
};

const CenterImage = () => {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
          "url(https://images.unsplash.com/photo-1460186136353-977e9d6085a1?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImg
        src="https://images.unsplash.com/photo-1484600899469-230e8d1d59c0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="And example of a space launch"
        start={-200}
        end={200}
        className="w-1/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="An example of a space launch"
        start={200}
        end={-250}
        className="mx-auto w-2/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Orbiting satellite"
        start={-200}
        end={200}
        className="ml-auto w-1/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1494022299300-899b96e49893?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Orbiting satellite"
        start={0}
        end={-500}
        className="ml-24 w-5/12"
      />
    </div>
  );
};

// const ParallaxImg = ({ className, alt, src, start, end }) => {
//   const ref = useRef(null);

//   const { scrollYProgress } = useScroll({
//     target: ref,
//     offset: [`${start}px end`, `end ${end * -1}px`],
//   });

//   const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
//   const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

//   const y = useTransform(scrollYProgress, [0, 1], [start, end]);
//   const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

//   return (
//     <motion.img
//       src={src}
//       alt={alt}
//       className={className}
//       ref={ref}
//       style={{ transform, opacity }}
//     />
//   );
// };
