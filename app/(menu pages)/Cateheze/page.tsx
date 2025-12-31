'use client';

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import type { WaveSurferOptions } from "wavesurfer.js";
import Logo from "@/components/optimized/components/Logo";

type Cateheza = {
  id: number;
  title: string;
  description: string;
  audioUrl: string;
};

type CatehezaCardProps = {
  item: Cateheza;
  isActive: boolean;
  onRequestPlay: (id: number) => void;
  onRequestPause: (id: number) => void;
};

const defaultWsOptions: Partial<WaveSurferOptions> = {
  waveColor: "#ffffff33",
  progressColor: "#ffcc77",
  cursorColor: "#ffffff55",
  barWidth: 2,
  barGap: 2,
  height: 80,
  normalize: true,
};

const CatehezaCard: React.FC<CatehezaCardProps> = ({
  item,
  isActive,
  onRequestPlay,
  onRequestPause,
}) => {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<any>(null);
  const pendingPlayRef = useRef(false);

  const [isReady, setIsReady] = useState(false); // visual "ready" used by UI
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // real load progress reported by WaveSurfer (0-100)
  const [realLoadProgress, setRealLoadProgress] = useState(0);
  // visual progress shown to user (0-100) — this is "fake"/smoothed
  const [visualProgress, setVisualProgress] = useState(0);
  // set to true when WaveSurfer emits "ready"
  const [audioIsReady, setAudioIsReady] = useState(false);

  // a short flag to control "loading state" UI
  const [hasRequestedLoading, setHasRequestedLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      setVisualProgress(0);
      setRealLoadProgress(0);
      setAudioIsReady(false);
      setIsReady(false);
    };
  }, []);

  // Animate visualProgress toward a target (realLoadProgress while loading,
  // and 100 when audioIsReady). Uses requestAnimationFrame for smoothness.
  useEffect(() => {
    let raf = 0;
    const easeFactor = 0.08; // lower = slower catch-up; tweak for natural feel
    const tick = () => {
      setVisualProgress((prev) => {
        const target = audioIsReady ? 100 : realLoadProgress;
        if (Math.abs(target - prev) < 0.5) {
          return Math.min(100, Math.max(0, target));
        }
        const next = prev + (target - prev) * easeFactor;
        return Math.min(100, Math.max(0, next));
      });
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [realLoadProgress, audioIsReady]);

  // When visualProgress reaches 100 and audioIsReady true -> mark visual ready
  useEffect(() => {
    if (!isReady && audioIsReady && visualProgress >= 99.9) {
      // small timeout to make the finalization feel natural (optional)
      const t = setTimeout(() => {
        setIsReady(true);
        setHasRequestedLoading(false);
        setVisualProgress(100);
        if (pendingPlayRef.current && wavesurferRef.current) {
          wavesurferRef.current.play();
          pendingPlayRef.current = false;
        }
      }, 150); // tweak between 0..400ms as you like
      return () => clearTimeout(t);
    }
  }, [visualProgress, audioIsReady, isReady]);

  const initializeWaveSurfer = useCallback(async () => {
    if (wavesurferRef.current || !waveformRef.current || typeof window === "undefined") {
      return wavesurferRef.current;
    }

    const WaveSurfer = (await import("wavesurfer.js")).default;

    // reset states
    setIsReady(false);
    setDuration(0);
    setCurrentTime(0);
    setRealLoadProgress(0);
    setVisualProgress(0);
    setAudioIsReady(false);

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      ...defaultWsOptions,
    });

    wavesurferRef.current = ws;

    ws.on("loading", (percent: number) => {
      // WaveSurfer reports 0..100; store it as real progress
      setRealLoadProgress(Math.max(0, Math.min(100, percent)));
    });

    ws.on("ready", () => {
      // mark audio as ready so visual progress will animate to 100
      setDuration(ws.getDuration());
      setAudioIsReady(true);
      // Do not call setIsReady(true) here — wait for visualProgress to hit 100
    });

    ws.on("audioprocess", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("timeupdate", () => {
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on("finish", () => {
      // reset playing UI but keep the waveform shown (since it is loaded)
      setIsReady(true);
      onRequestPause(item.id);
      pendingPlayRef.current = false;
      ws.seekTo(0);
      setCurrentTime(0);
    });

    ws.on("play", () => {
      // keep isReady true once playing started
    });

    ws.on("pause", () => {
      pendingPlayRef.current = false;
    });

    ws.load(item.audioUrl);
    return ws;
  }, [item.audioUrl, item.id, onRequestPause]);

  // Pause if card not active
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    if (!isActive && ws.isPlaying()) ws.pause();
    if (!isActive) {
      pendingPlayRef.current = false;
      setHasRequestedLoading(false);
    }
  }, [isActive]);

  const togglePlayback = useCallback(async () => {
    const requestAutoplay = () => {
      pendingPlayRef.current = true;
      setHasRequestedLoading(true);
      // reset visual progress so loading UI is visible from start
      setVisualProgress((v) => (v > 0 ? v : 0));
      onRequestPlay(item.id);
    };

    let ws = wavesurferRef.current;

    if (!ws) {
      requestAutoplay();
      const instance = await initializeWaveSurfer();
      if (!instance) {
        pendingPlayRef.current = false;
        setHasRequestedLoading(false);
        onRequestPause(item.id);
        return;
      }
      ws = instance;
      // do not require isReady here — we will play once ready+visual==100
    } else if (!isReady && !audioIsReady) {
      // wave is not initialized and audio not ready; show loading UI
      requestAutoplay();
      return;
    }

    if (ws.isPlaying()) {
      ws.pause();
      onRequestPause(item.id);
    } else {
      // If audio already loaded but visual not yet 100 we should still call onRequestPlay
      onRequestPlay(item.id);
      // If audio already ready and visual reached 100, play instantly
      if (audioIsReady && visualProgress >= 99.9) {
        ws.play();
        pendingPlayRef.current = false;
      } else {
        // otherwise, set the pending flag and wait for the visual progress to reach 100
        pendingPlayRef.current = true;
        setHasRequestedLoading(true);
      }
    }
  }, [initializeWaveSurfer, isReady, audioIsReady, visualProgress, item.id, onRequestPause, onRequestPlay]);

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative mb-6 rounded-xl p-6 transition-all duration-500 hover:border-white/20 overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-4">
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={`${isReady ? "Pauza" : "Play"} ${item.title}`}
            className={`flex items-center justify-center rounded-full 
              h-[60px] w-[60px] min-w-[60px] min-h-[60px]
              border border-white/20 bg-black/30 
              transition hover:scale-105
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400
              ${isReady && pendingPlayRef.current ? "border-amber-400 bg-amber-400/20" : ""}`}
          >
            {/* Use isReady && audioIsReady && visualProgress >= 99.9 to decide play/pause icon */}
            {wavesurferRef.current && wavesurferRef.current.isPlaying() ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-200" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.5v13a1 1 0 0 0 1.52.85l9.36-6.5a1 1 0 0 0 0-1.7l-9.36-6.5A1 1 0 0 0 8 5.5Z" />
              </svg>
            )}
          </button>
          <div>
            <h2 className="text-xl md:text-3xl font-semibold text-white ">{item.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-white/70">{item.description}</p>
          </div>
        </div>

        {isActive && isReady && (
          <div className="whitespace-nowrap -ml-7 text-right text-sm text-white/60 transition-opacity duration-300">
            <span className="text-white">{formatTime(currentTime)}</span>
            <span className="text-white/40"> / {formatTime(duration)}</span>
          </div>
        )}
      </div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="mt-6 h-20 w-full">
          <div ref={waveformRef} className="h-full w-full"></div>
        </div>

        {hasRequestedLoading && (
          <div className="mt-4">
            <div className="w-full h-2 bg-white/10 rounded-xl overflow-hidden">
              <div
                className="h-full bg-[#C59D30]/80 transition-all duration-100"
                style={{ width: `${visualProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-white/70 text-center">
              Se încarcă... {Math.min(100, Math.floor(visualProgress))}%
            </p>
          </div>
        )}

      </motion.div>
    </div>
  );
};

const CatehezePage: React.FC = () => {
  const [cateheze, setCateheze] = useState<Cateheza[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    const loadCateheze = async () => {
      try {
        const res = await fetch("/data/cateheze.json");
        const data = await res.json();
        setCateheze(data);
      } catch (error) {
        console.error("Eroare la incarcarea catehezelor:", error);
      }
    };
    loadCateheze();
  }, []);

  const handleRequestPlay = useCallback((id: number) => setActiveId(id), []);
  const handleRequestPause = useCallback((id: number) => setActiveId((prev) => (prev === id ? null : prev)), []);

  return (
    <div className="bg-[#0A0004] selection:bg-yellow-600 selection:text-white/90">
      <motion.div
        initial={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        animate={{ scale: 1, borderRadius: "0px", opacity: 1 }}
        exit={{ scale: 0.95, borderRadius: "30px", opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="min-h-screen w-screen px-6 py-12 text-white relative"
      >
        <div className="absolute  mask-b-from-0 inset-0  w-full   opacity-50 md:opacity-100 ">
          <div className="relative w-full h-full">

            <Image
              className="z-2 object-cover md:hidden "
              src={"/assets/fundal-phone.png"}
              alt="program-background"
              fill
            />

            <Image
              className="z-2 object-cover hidden md:block opacity-40 "
              src={"/assets/fundal2.png"}
              alt="program-background"
              fill
            />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold flex justify-center text-white mt-[130px] mb-20">
          Cateheze
        </h1>

        {cateheze.length === 0 && <p>Nu exista date de afisat.</p>}

        <div className="flex flex-col items-center">
          {cateheze.map((item) => (
            <div className="w-full sm:w-3/4 lg:w-2/3 border-b border-[#C59D30]/30 pb-4 mb-9" key={item.id}>
              <CatehezaCard
                item={item}
                isActive={activeId === item.id}
                onRequestPlay={handleRequestPlay}
                onRequestPause={handleRequestPause}
              />
            </div>
          ))}
        </div>
        <Logo theme='light' />
      </motion.div>
    </div>
  );
};

export default CatehezePage;
