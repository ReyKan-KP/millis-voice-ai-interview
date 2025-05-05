'use client';

import Interview from '@/components/Interview';
import { motion } from 'framer-motion';

export default function InterviewPage() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center"
    >
      <Interview />
    </motion.main>
  );
} 