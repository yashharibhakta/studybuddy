import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface GettingStartedViewProps {
  onGetStarted: () => void;
}

// Calm, premium easing
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const GettingStartedView: React.FC<GettingStartedViewProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div 
        key="getting-started-card"
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)', transition: { duration: 0.4, ease } }}
        transition={{ duration: 0.8, ease }}
        className="w-full max-w-[420px]"
      >
        <div className="glass-panel p-10 md:p-12 rounded-[32px] backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
          
          {/* Icon */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8, ease }}
            className="w-20 h-20 rounded-[24px] bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-lg mb-10"
          >
            <Sparkles className="text-white/90 w-8 h-8" strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-4"
          >
            Study Buddy
          </motion.h1>
          
          {/* Tagline */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="text-lg text-white/90 font-medium mb-2 tracking-tight"
          >
            Your calm AI companion for smarter studying
          </motion.p>

          {/* Subtext */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease }}
            className="text-slate-400 text-base font-light leading-relaxed mb-12 max-w-xs"
          >
            Turn lectures into summaries, flashcards, and exam-ready questions.
          </motion.p>

          {/* Action Area */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease }}
            className="w-full space-y-5"
          >
            <motion.button
              whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onGetStarted}
              className="w-full bg-white text-black font-medium py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-white/10 transition-all duration-300 flex items-center justify-center gap-2 text-[17px] tracking-tight"
            >
              Get Started
            </motion.button>

            <button
              onClick={onGetStarted}
              className="text-slate-500 hover:text-white/80 text-[15px] font-medium transition-colors duration-300"
            >
              Already have an account? Log in
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};