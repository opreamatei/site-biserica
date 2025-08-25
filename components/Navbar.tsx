'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { label: 'Program Liturgic', path: 'Program-Liturgic' },
    { label: 'Evenimente', path: 'Evenimente' },
    { label: 'Calendar', path: 'Calendar' },
    { label: 'Prezentare Biserică', path: 'About' },
    { label: 'Cateheze', path: 'Cateheze' },
    { label: 'Contact', path: 'Contact' },
  ];

  useEffect(() => {
    if (open) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    // Clean up just in case
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [open]);

  return (
    <div className="max-w-[100vw] max-h-screen">
      {/* Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-4 w-8 h-8 z-50 flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <span
          className={`absolute w-8 h-0.5 bg-white/60 transition-transform duration-300 ease-in-out ${open ? 'rotate-45 translate-y-0' : '-translate-y-1.5'
            }`}
        />
        <span
          className={`absolute w-8 h-0.5 bg-white/60 transition-transform duration-300 ease-in-out ${open ? '-rotate-45 translate-y-0' : 'translate-y-1.5'
            }`}
        />
      </button>

      <div className="fixed inset-x-0 top-0 z-40 flex items-center bg-[#000E29] justify-between px-4 py-1 max-w-screen shadow-md">
        <div className="w-full flex justify-center">
          <Link href="/">
            <Image src="/logo alb.jpg" alt="logo" width={80} height={80} />
          </Link>
        </div>

      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="fixed inset-0 z-40 bg-gray/70 backdrop-blur-md flex flex-col"
          >
            <nav className="flex flex-col items-end justify-center h-full px-10 gap-10 text-right text-white/80">
              {links.map(({ label, path }, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    ease: 'easeInOut',
                    delay: index * 0.07,
                  }}
                >
                  <Link
                    href={`/${path}`}
                    onClick={() => setOpen(false)}
                    className="text-2xl md:text-3xl lg:text-4xl hover:underline"
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
