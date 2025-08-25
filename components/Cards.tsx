'use client';
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

const cards = [
  {
    id: 1,
    content: 'Istoria locului',
    route: '/istoria-locului',
  },
  {
    id: 2,
    content: 'Situatie lucrari',
    route: '/situatie-lucrari',
  },
  {
    id: 3,
    content: 'Card 3',
    route: '/card3',
  },
];

export default function SmoothVerticalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateIndex = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= cards.length) return;
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 0) {
        updateIndex(currentIndex + 1);
      } else if (e.deltaY < 0) {
        updateIndex(currentIndex - 1);
      }
    };

    const node = containerRef.current;
    node?.addEventListener('wheel', handleWheel, { passive: false });
    return () => node?.removeEventListener('wheel', handleWheel);
  }, [currentIndex]);

  const currentCard = cards[currentIndex];

  return (
    <div className="flex flex-col items-center w-screen">
      <div
        ref={containerRef}
        className="relative h-[50vh] p-5 lg:h-[40vh] w-[90vw] lg:max-w-2/3 mx-auto flex items-center justify-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative container h-full mx-auto rounded-xl shadow-[0_0_50px_#c95d434a] bg-[#c95d43]  p-6 text-center text-lg font-medium text-white select-none flex flex-col justify-between items-center"
          >
            <div className="mt-8">{currentCard.content}</div>

            <Link
              href={currentCard.route}
              className="mb-4 px-4 py-2 bg-white text-[#c95d43] font-semibold rounded-md hover:bg-gray-100 transition"
            >
              Deschide pagina
            </Link>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
