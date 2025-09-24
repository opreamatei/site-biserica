"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, ReactNode } from "react";
import useResize from "./hooks/useResize";

interface LogoLoaderProps {
  children: ReactNode;
}

export default function LogoLoader({ children }: LogoLoaderProps) {
  const [loading, setLoading] = useState(true);
  const [hideBackground, setHideBackground] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const size = useResize();

  function easeOutCirc(x: number): number {
    return Math.sqrt(1 - Math.pow(x - 1, 2));
  }

  return (
    <div className={`relative min-h-screen  transition-colors duration-1000 `}>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ y: -size.y, opacity: 0 }}
            animate={{
              y: -size.y / 2 + 40, 
              opacity: 1
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: easeOutCirc }}
          >
            <motion.img
              src="/logo_negru_1.webp"
              alt="Logo"
              className="w-20 h-20"
              initial={{ opacity: 0, scale: 1.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1.2, ease: easeOutCirc }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}
