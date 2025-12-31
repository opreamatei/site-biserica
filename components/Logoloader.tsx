"use client";

import { useLayoutEffect, useRef, useState, ReactNode } from "react";
import { gsap } from "gsap";

interface LogoLoaderProps {
  children: ReactNode;
}

export default function LogoLoader({ children }: LogoLoaderProps) {
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    if (typeof window == "undefined"){
      return;
    }
    if (!overlayRef.current || !logoRef.current) {
      return;
    }

    let cancelled = false;
    const ctx = gsap.context(() => {
      const getOverlayHeight = () =>
        overlayRef.current?.offsetHeight ?? window.innerHeight;
      const getLogoHeight = () =>
        logoRef.current?.offsetHeight ?? 0;
      const topMarginPx = 12;

      const startY = () => {
        const halfOverlay = getOverlayHeight() / 2;
        const halfLogo = getLogoHeight() / 2;
        return halfOverlay + halfLogo + topMarginPx;
      };

      const endY = () => {
        const halfOverlay = getOverlayHeight() / 2;
        const halfLogo = getLogoHeight() / 2;
        return -(halfOverlay - halfLogo - topMarginPx);
      };

      const timeline = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          if (!cancelled) {
            setLoading(false);
          }
        },
      });

      timeline
        .fromTo(
          logoRef.current,
          { y: startY(), autoAlpha: 0, scale: 0.92 },
          { y: endY(), autoAlpha: 1, scale: 1, duration: 1.05 }
        )
        .to(
          logoRef.current,
          {
            y: endY() - 16,
            autoAlpha: 0,
            duration: 0.55,
            ease: "power1.inOut",
          },
          "+=0.15"
        )
        .to(
          overlayRef.current,
          {
            autoAlpha: 0,
            duration: 1.1,
            ease: "power2.out",
          },
          "-=0.1"
        )
        .set(overlayRef.current, { pointerEvents: "none" });
    }, overlayRef);

    return () => {
      cancelled = true;
      ctx.revert();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[var(--background)] transition-colors duration-1000">
      <div>{children}</div>

      {loading && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[65] flex h-screen items-center justify-center bg-[var(--background)]"
          style={{ willChange: "transform, opacity" }}
        >
          <img
            ref={logoRef}
            src="/logo_negru_1.webp"
            alt="Logo"
            className="h-[3.57rem] w-[3.57rem] invert-100"
            style={{ willChange: "transform, opacity" }}
          />
        </div>
      )}
    </div>
  );
}
