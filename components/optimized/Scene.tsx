"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useDebug from "../hooks/useDebug";
import useFixedViewportHeight from "../hooks/useFixedViewport";

gsap.registerPlugin(ScrollTrigger);

type DailyQuote = {
  text: string;
  author?: string;
};

const QUOTE_STORAGE_KEY = "daily-quote";
const QUOTE_DATE_STORAGE_KEY = "daily-quote-date";

const fallbackQuote: DailyQuote = {
  text: "Bucurați-vă totdeauna în Domnul. Iarăși zic: Bucurați-vă!",
  author: "Filipeni 4,4"
};

type Setter = (value: number | string) => void;

const noopSetter: Setter = () => { };

const createSetter = (
  element: Element | null | undefined,
  property: string,
  unit?: string
): Setter => {
  if (!element) {
    return noopSetter;
  }

  if (property === "scale") {
    const setScaleX = gsap.quickSetter(element, "scaleX", unit);
    const setScaleY = gsap.quickSetter(element, "scaleY", unit);
    return (value: number | string) => {
      setScaleX(value);
      setScaleY(value);
    };
  }

  return gsap.quickSetter(element, property, unit) as any;
};

const clamp01 = gsap.utils.clamp(0, 1);

const mapRangeClamped = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => {
  if (inMax === inMin) {
    return outMin;
  }
  const ratio = clamp01((value - inMin) / (inMax - inMin));
  return outMin + (outMax - outMin) * ratio;
};

const segmentedOpacity = (
  value: number,
  fadeInStart: number,
  fadeInEnd: number,
  fadeOutStart: number,
  fadeOutEnd: number
) => {
  if (value <= fadeInStart) return 0;
  if (value < fadeInEnd) {
    return mapRangeClamped(value, fadeInStart, fadeInEnd, 0, 1);
  }
  if (value < fadeOutStart) return 1;
  if (value < fadeOutEnd) {
    return mapRangeClamped(value, fadeOutStart, fadeOutEnd, 1, 0);
  }
  return 0;
};

const stayOpacity = (value: number, start: number, fade: number) => {
  if (value <= start) return 0;
  if (value >= start + fade) return 1;
  return mapRangeClamped(value, start, start + fade, 0, 1);
};

const stayYOffset = (value: number, start: number, end: number, initialVh: number) => {
  if (value <= start) return initialVh;
  const midpoint = (start + end) / 2;
  if (value >= midpoint) return 0;
  return mapRangeClamped(value, start, midpoint, initialVh, 0);
};

const BG_SCROLL = -2500;
const SCALE = 1.25;
const PROGRESS_SCALE = 1.4;

const scaleProgress = (value: number) => value * PROGRESS_SCALE;

const scaleRange = (start: number, end: number): [number, number] => [
  scaleProgress(start),
  scaleProgress(end),
];

export default function Scene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState<DailyQuote>(fallbackQuote);
  const fixedViewportHeight = useFixedViewportHeight();
  const viewportHeightRef = useRef<number>(0);
  const viewportWidthRef = useRef<number>(0);
  const debug = useDebug();
  const doubledViewportHeight = fixedViewportHeight ? fixedViewportHeight * 2 : 0;
  const sceneHeightStyle = doubledViewportHeight ? `${doubledViewportHeight}px` : undefined;
  const pinnedHeight = fixedViewportHeight ? `${fixedViewportHeight}px` : undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const today = new Date().toISOString().slice(0, 10);

    const applyQuote = (value: DailyQuote, persist: boolean) => {
      if (cancelled) return;
      setQuote(value);
      if (!persist) return;

      try {
        window.localStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(value));
        window.localStorage.setItem(QUOTE_DATE_STORAGE_KEY, today);
      } catch (error) {
        console.warn("Failed to persist daily quote", error);
      }
    };

    const hydrateFromStorage = () => {
      try {
        const storedDate = window.localStorage.getItem(QUOTE_DATE_STORAGE_KEY);
        const storedValue = window.localStorage.getItem(QUOTE_STORAGE_KEY);

        if (storedValue && storedDate === today) {
          applyQuote(JSON.parse(storedValue), false);
          return true;
        }
      } catch { }
      return false;
    };

    if (hydrateFromStorage()) return;

    const QUOTE_POOL_KEY = "daily-quote-pool";

    const fetchQuote = async () => {
      try {
        const response = await fetch("/data/quote.json", { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);

        const quotes = (await response.json()) as DailyQuote[];

        if (!Array.isArray(quotes) || quotes.length === 0) {
          applyQuote(fallbackQuote, false);
          return;
        }

        let pool: number[];

        try {
          const storedPool = window.localStorage.getItem(QUOTE_POOL_KEY);
          pool = storedPool ? JSON.parse(storedPool) : [];
        } catch {
          pool = [];
        }

        // dacă pool-ul e gol, îl reumplem cu indexurile tuturor citatelor
        if (!pool || pool.length === 0) {
          pool = Array.from({ length: quotes.length }, (_, i) => i);
        }

        // alegem un index random din pool
        const randomIndex = Math.floor(Math.random() * pool.length);
        const quoteIndex = pool[randomIndex];

        const selectedQuote = quotes[quoteIndex] ?? fallbackQuote;

        // eliminăm indexul folosit
        pool.splice(randomIndex, 1);

        // salvăm pool-ul actualizat
        try {
          window.localStorage.setItem(QUOTE_POOL_KEY, JSON.stringify(pool));
        } catch { }

        applyQuote(selectedQuote, true);

      } catch (error) {
        console.warn("Failed to load quote of the day", error);
        applyQuote(fallbackQuote, false);
      }
    };

    fetchQuote();

    return () => { cancelled = true };
  }, []);


  useEffect(() => {
    if (typeof window === "undefined" || !fixedViewportHeight) {
      return;
    }
    viewportHeightRef.current = fixedViewportHeight;
    ScrollTrigger.refresh();
  }, [fixedViewportHeight]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window == 'undefined') {
      return;
    }

    const readViewportHeight = () => {
      const visual = window.visualViewport;
      return Math.round((visual?.height ?? window.innerHeight) || 0);
    };

    const readViewportWidth = () => {
      const visual = window.visualViewport;
      return Math.round((visual?.width ?? window.innerWidth) || 0);
    };

    viewportHeightRef.current =
      viewportHeightRef.current || fixedViewportHeight || readViewportHeight();
    viewportWidthRef.current = viewportWidthRef.current || readViewportWidth();

    const mediaElements = Array.from(
      container.querySelectorAll("img")
    ) as HTMLImageElement[];

    const handleMediaLoad = () => {
      ScrollTrigger.refresh();
    };

    const handleResize = () => {
      const nextHeight = readViewportHeight();
      const nextWidth = readViewportWidth();

      const widthDelta = Math.abs(nextWidth - viewportWidthRef.current);
      const heightDelta = Math.abs(nextHeight - viewportHeightRef.current);
      const orientationChanged = widthDelta > 80;
      const majorHeightChange = heightDelta > 160;

      if (!orientationChanged && !majorHeightChange) {
        return;
      }

      viewportHeightRef.current = nextHeight;
      viewportWidthRef.current = nextWidth;
      ScrollTrigger.refresh();
    };

    mediaElements.forEach((img) => {
      if (img.complete) {
        return;
      }
      img.addEventListener("load", handleMediaLoad);
      img.addEventListener("error", handleMediaLoad);
    });

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    let refreshRaf: number | null = null;

    const computeScrollDistance = () => {
      const height = container.scrollHeight || container.clientHeight || 0;
      const viewport = viewportHeightRef.current || readViewportHeight() || 1;
      const distance = height <= viewport ? viewport : height - viewport;
      return Math.max(1, Math.round(distance));
    };

    const ctx = gsap.context(() => {
      const select = gsap.utils.selector(container);

      const sky = select("[data-scene='sky']")[0];
      const saint = select("[data-scene='saint']")[0];
      const principal = select("[data-scene='principal']")[0];
      const falcon1 = select("[data-scene='falcon-1']")[0];
      const falcon2 = select("[data-scene='falcon-2']")[0];
      const falcon3 = select("[data-scene='falcon-3']")[0];
      const quoteWrapper = select("[data-scene='quote-wrapper']")[0];
      const quoteHint = select("[data-scene='quote-hint']")[0];

      const setSkyY = createSetter(sky, "y", "px");

      const setSaintY = createSetter(saint, "y", "px");
      const setSaintOpacity = createSetter(saint, "opacity");
      const setSaintScale = createSetter(saint, "scale");

      const setPrincipalScale = createSetter(principal, "scale");
      const setPrincipalOpacity = createSetter(principal, "opacity");
      const setPrincipalY = createSetter(principal, "y", "px");

      const setFalcon1X = createSetter(falcon1, "x", "px");
      const setFalcon1Opacity = createSetter(falcon1, "opacity");

      const setFalcon2X = createSetter(falcon2, "x", "px");
      const setFalcon2Opacity = createSetter(falcon2, "opacity");

      const setFalcon3X = createSetter(falcon3, "x", "px");
      const setFalcon3Opacity = createSetter(falcon3, "opacity");
      const setQuoteOpacity = createSetter(quoteWrapper, "opacity");
      const setQuoteScale = createSetter(quoteWrapper, "scale");
      const setQuoteY = createSetter(quoteWrapper, "y", "px");
      const setQuoteHintOpacity = createSetter(quoteHint, "opacity");


      const [saintRangeStart, saintRangeEnd] = scaleRange(0, 1.4);

      const [principalScaleStart, principalScaleEnd] = scaleRange(0, 0.4);
      const [principalYStart, principalYEnd] = scaleRange(0.2, 1);

      const falconOneRangeMobile = scaleRange(0.2, 0.35);
      const falconOneRangeDesktop = scaleRange(0.2, 0.6);
      const falconOneOpacityPointsMobile = [
        scaleProgress(0.2),
        scaleProgress(0.22),
        scaleProgress(0.33),
        scaleProgress(0.35),
      ];
      const falconOneOpacityPointsDesktop = [
        scaleProgress(0.2),
        scaleProgress(0.28),
        scaleProgress(0.55),
        scaleProgress(0.6),
      ];

      const falconTwoRangeMobile = scaleRange(0.2, 0.4);
      const falconTwoRangeDesktop = scaleRange(0.2, 0.65);
      const falconTwoOpacityPointsMobile = [
        scaleProgress(0.2),
        scaleProgress(0.27),
        scaleProgress(0.38),
        scaleProgress(0.4),
      ];
      const falconTwoOpacityPointsDesktop = [
        scaleProgress(0.2),
        scaleProgress(0.3),
        scaleProgress(0.6),
        scaleProgress(0.65),
      ];

      const falconThreeRangeMobile = scaleRange(0.25, 0.45);
      const falconThreeRangeDesktop = scaleRange(0.25, 0.7);
      const falconThreeOpacityPointsMobile = [
        scaleProgress(0.2),
        scaleProgress(0.32),
        scaleProgress(0.43),
        scaleProgress(0.45),
      ];
      const falconThreeOpacityPointsDesktop = [
        scaleProgress(0.3),
        scaleProgress(0.35),
        scaleProgress(0.65),
        scaleProgress(0.7),
      ];
      const [quoteFadeInStart, quoteFadeInEnd] = scaleRange(-0.5, 0.16);
      const [quoteFadeOutStart, quoteFadeOutEnd] = scaleRange(0.55, 0.75);
      const [quoteScaleStart, quoteScaleEnd] = scaleRange(-0.2, 0.6);
      const [quoteShiftStart, quoteShiftEnd] = scaleRange(-0.2, 0.7);
      const [quoteHintFadeInStart, quoteHintFadeInEnd] = scaleRange(-.05, 0);
      const [quoteHintFadeOutStart, quoteHintFadeOutEnd] = scaleRange(0.32, 0.4);



      [falcon1, falcon2, falcon3].forEach((element) => {
        if (element) {
          gsap.set(element, { scale: SCALE });
        }
      });
      if (quoteWrapper) {
        gsap.set(quoteWrapper, { opacity: 1, scale: 1, transformOrigin: "50% 50%" });
      }
      if (quoteHint) {
        gsap.set(quoteHint, { opacity: 0 });
      }

      const updateScene = (progress: number) => {
        if (typeof window == 'undefined') return;

        const viewportHeight = viewportHeightRef.current || readViewportHeight();
        const viewportWidth = viewportWidthRef.current || readViewportWidth();
        const vhUnit = viewportHeight * 0.01;
        const vwUnit = viewportWidth * 0.01;

        const isDesktop = viewportWidth >= 1024;

        const [falconOneRangeStart, falconOneRangeEnd] = isDesktop
          ? falconOneRangeDesktop
          : falconOneRangeMobile;
        const falconOneOpacityPoints = isDesktop
          ? falconOneOpacityPointsDesktop
          : falconOneOpacityPointsMobile;

        const [falconTwoRangeStart, falconTwoRangeEnd] = isDesktop
          ? falconTwoRangeDesktop
          : falconTwoRangeMobile;
        const falconTwoOpacityPoints = isDesktop
          ? falconTwoOpacityPointsDesktop
          : falconTwoOpacityPointsMobile;

        const [falconThreeRangeStart, falconThreeRangeEnd] = isDesktop
          ? falconThreeRangeDesktop
          : falconThreeRangeMobile;
        const falconThreeOpacityPoints = isDesktop
          ? falconThreeOpacityPointsDesktop
          : falconThreeOpacityPointsMobile;


        setSkyY(0);

        setSaintScale(
          mapRangeClamped(progress, saintRangeStart, saintRangeEnd, 0.8, isDesktop ? 1.7 : 1.2)
        );
        setSaintOpacity(mapRangeClamped(progress, saintRangeStart, saintRangeEnd - .4, 0.8, 1));
        const saintYOffset =
          mapRangeClamped(progress, saintRangeStart, saintRangeEnd, 90, -21) * 16; // rem -> px
        setSaintY(saintYOffset);

        const principalLift = isDesktop ? 25 : 30;
        setPrincipalScale(mapRangeClamped(progress, principalScaleStart, principalScaleEnd, 1, 1.2));
        setPrincipalY(
          mapRangeClamped(progress, principalYStart, principalYEnd, 0, -principalLift * vhUnit)
        );

        const falconOneX = mapRangeClamped(
          progress,
          falconOneRangeStart,
          falconOneRangeEnd,
          -20 * vwUnit,
          120 * vwUnit
        );
        setFalcon1X(falconOneX);
        setFalcon1Opacity(
          segmentedOpacity(
            progress,
            falconOneOpacityPoints[0],
            falconOneOpacityPoints[1],
            falconOneOpacityPoints[2],
            falconOneOpacityPoints[3]
          )
        );

        const falconTwoX = mapRangeClamped(
          progress,
          falconTwoRangeStart,
          falconTwoRangeEnd,
          120 * vwUnit,
          -20 * vwUnit
        );
        setFalcon2X(falconTwoX);
        setFalcon2Opacity(
          segmentedOpacity(
            progress,
            falconTwoOpacityPoints[0],
            falconTwoOpacityPoints[1],
            falconTwoOpacityPoints[2],
            falconTwoOpacityPoints[3]
          )
        );

        const falconThreeX = mapRangeClamped(
          progress,
          falconThreeRangeStart,
          falconThreeRangeEnd,
          -20 * vwUnit,
          120 * vwUnit
        );
        setFalcon3X(falconThreeX);
        setFalcon3Opacity(
          segmentedOpacity(
            progress,
            falconThreeOpacityPoints[0],
            falconThreeOpacityPoints[1],
            falconThreeOpacityPoints[2],
            falconThreeOpacityPoints[3]
          )
        );
        setQuoteOpacity(1);
        setQuoteScale(
          mapRangeClamped(
            progress,
            quoteScaleStart,
            quoteScaleEnd,
            isDesktop ? 1.05 : 1,
            isDesktop ? 0.9 : 0.92
          )
        );
        const quoteYOffset = mapRangeClamped(
          progress,
          quoteShiftStart,
          quoteShiftEnd,
          15 * vhUnit,
          -12 * vhUnit
        );
        setQuoteY(quoteYOffset);
        setQuoteHintOpacity(
          segmentedOpacity(
            progress,
            quoteHintFadeInStart,
            quoteHintFadeInEnd,
            quoteHintFadeOutStart,
            quoteHintFadeOutEnd
          )
        );

      };

      const scrollTrigger = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: () => "+=" + computeScrollDistance(),
        scrub: true,
        pin: true,
        pinSpacing: true,
        invalidateOnRefresh: true,
        markers: debug,
        onUpdate: ({ progress }) => updateScene(progress),
        onRefresh: ({ progress }) => updateScene(progress ?? 0),
      });

      refreshRaf = window.requestAnimationFrame(() => ScrollTrigger.refresh());
      updateScene(scrollTrigger.progress ?? 0);

      return () => {
        scrollTrigger.kill();
      };
    }, container);

    return () => {
      if (refreshRaf !== null) {
        cancelAnimationFrame(refreshRaf);
      }
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      mediaElements.forEach((img) => {
        img.removeEventListener("load", handleMediaLoad);
        img.removeEventListener("error", handleMediaLoad);
      });
      ctx.revert();
    };
  }, [debug, fixedViewportHeight]);

  return (
    <div
      ref={containerRef}
      className="relative h-[200vh] w-full overflow-visible"
      style={{
        height: sceneHeightStyle,
        WebkitMaskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 250px), transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, black 0%, black calc(100% - 250px), transparent 100%)",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
      }}
    >
      <div className="absolute inset-0 h-[200vh] w-full" style={{ height: sceneHeightStyle }}>
        <div data-scene="sky" className="relative h-full">
          <Image src="/assets/Sky.webp" alt="Sky" fill className="object-cover" priority />
        </div>

        <div
          className="absolute inset-0 h-[200vh] w-full overflow-hidden"
          style={{ height: sceneHeightStyle }}
        >
          <div className="sticky top-0 h-screen overflow-hidden" style={{ height: pinnedHeight }}>
            <div className="absolute inset-0 bg-transparent" aria-hidden data-scene="background" />

            <div
              data-scene="principal"
              className="absolute inset-y-0 left-1/2 z-30 flex w-full -translate-x-1/2 items-center justify-center md:hidden"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="relative h-full w-full ">
                <Image
                  src="/assets/principal(1).webp"
                  alt="Stalpi"
                  fill
                  className="object-cover object-top "
                  priority
                />
              </div>
            </div>


            <div
              data-scene="saint"
              className="absolute left-1/2  -translate-x-1/2 translate-y-1/2 z-120"
              style={{ willChange: "transform, opacity", top: fixedViewportHeight / viewportWidthRef.current < 16 / 9 * 1.1 ? -540 : -200 }}
            >
              <div className="relative aspect-[3/4] w-[70vw] max-w-[320px] sm:w-[50vw] md:w-[30vw] scale-120 md:scale-200 lg:scale-160">
                <Image
                  src="/assets/SfTrifon.webp"
                  alt="Sfantul Trifon"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div
              data-scene="falcon-1"
              className="absolute top-[26%]"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="relative aspect-[16/10] md:scale-150 lg:scale-100 w-[40vw] max-w-[520px] md:w-[22vw]">
                <Image
                  src="/assets/Falcon1.webp"
                  alt="Falcon 1"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div
              data-scene="falcon-2"
              className="absolute top-[30%]"
              style={{ willChange: "transform, opacity  " }}
            >
              <div className="relative aspect-[16/10] md:scale-150 lg:scale-100 w-[40vw] max-w-[520px] md:w-[22vw]">
                <Image
                  src="/assets/Falcon2.png"
                  alt="Falcon 2"
                  fill
                  className="object-contain "
                  priority
                />
              </div>
            </div>

            <div
              data-scene="falcon-3"
              className="absolute top-[35%]"
              style={{ willChange: "transform, opacity" }}
            >
              <div className="relative aspect-[16/10] md:scale-150 lg:scale-100 w-[42vw] max-w-[560px] md:w-[24vw]">
                <Image
                  src="/assets/Falcon3.webp"
                  alt="Falcon 3"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div
              data-scene="quote-wrapper"
              className="pointer-events-none absolute inset-x-4 top-[42%] z-[100] flex justify-center px-2 md:top-[40%]"
              style={{ willChange: "transform, opacity" }}
            >
              <div
                className="absolute inset-0 z-[1] pointer-events-none"
                aria-hidden="true"
              >
                <div className="pointer-events-auto mx-auto max-w-3xl select-text px-4 text-center bg-gradient-to-l from-[#C85C41] to-orange-400 bg-clip-text text-transparent sm:max-w-2xl md:max-w-4xl md:px-6">
                  <p className=" text-shadow-lg text-xl font-medium leading-snug sm:text-2xl md:text-3xl lg:text-4xl">
                    <span className="pr-2 text-[#c95d43]/90">„</span>
                    {quote.text}
                    <span className="pl-2 text-[#c95d43]/90">”</span>
                  </p>
                  {quote.author ? (
                    <p className="text-shadow-black/10 text-shadow-lg mt-7 text-sm uppercase tracking-wide bg-gradient-to-l from-red-300 to-zinc-500 bg-clip-text text-transparent md:text-base">
                      - {quote.author}
                    </p>
                  ) : null}
                  <div
                    data-scene="quote-hint"
                    className="text-shadow-black/20 text-shadow-lg mt-20 flex items-center justify-center gap-2 text-xs text-white/80 animation-pulse animate-candleColor md:text-sm"
                  >
                    <span className="text-[2.5vh]">Glisează în jos</span>
                    <Image
                      src="/icons/curve-arrow-down.svg"
                      alt="Scroll down"
                      width={20}
                      height={20}
                      unoptimized
                      className="animate-bounce mt-3 block md:hidden"
                    />
                    <Image
                      src="/icons/curve-arrow-down.svg"
                      alt="Scroll down"
                      width={30}
                      height={30}
                      unoptimized
                      className="animate-bounce mt-3 hidden md:block"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
