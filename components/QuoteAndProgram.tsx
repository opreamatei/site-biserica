'use client';

import { useRef, useState } from 'react';
import { motion, useScroll } from 'framer-motion';
import Quote from './Quote';
import Program from './Program';
import FalconScene from './FalconScene';

const QuoteAndProgram = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const [bg, setBg] = useState('#5c94b5');
  scrollYProgress.onChange(() => {
    const v = scrollYProgress.get();
    if (v < 0.3) {
      setBg('#6cb0e9');
    } else if (v < 0.6) {
      setBg('#dcc896');
    }
  });

  return (
    <motion.div
      ref={containerRef}
      className="transition-colors duration-1000"
      >
      <div
      style={{
        background: bg,
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 700px), transparent 100%)',
        maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 700px), transparent 100%)',
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
      }}
      
      >

      <Quote />
      <FalconScene />    
        </div>
      <Program />
    </motion.div>
  );
};

export default QuoteAndProgram;
