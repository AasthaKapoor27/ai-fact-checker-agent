// app/page.tsx
'use client'

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LandingPage() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      router.push('/check');
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
      className="min-h-screen bg-white flex items-center justify-center"
    >
      <div
        className="flex items-center gap-8 cursor-pointer group"
        onClick={handleClick}
      >
        <motion.h1 
          className="text-7xl md:text-8xl font-bold text-gray-900 tracking-tight"
          style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}
        >
          Verify a claim?
        </motion.h1>
        
        <motion.div
          whileHover={{ x: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <ArrowRight 
            className="w-16 h-16 text-gray-900 group-hover:text-blue-600 transition-colors" 
            strokeWidth={2}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
