import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard } from '../types';
import { ChevronLeft, ChevronRight, RotateCw, RefreshCw, AlertCircle, Quote, Keyboard } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 200);
  }, [flashcards?.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 200);
  }, [flashcards?.length]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault(); 
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleFlip]);

  // Guard Clause for Empty Data
  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-400 p-10 glass-panel rounded-3xl border border-white/5">
         <AlertCircle size={32} className="mb-4 opacity-50" />
         <p>No flashcards were generated for this content.</p>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-slate-500 tracking-wide">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          <div className="flex gap-1.5">
            {flashcards.map((_, i) => (
              <div 
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === currentIndex ? 'w-8 bg-indigo-400' : 'w-2 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Container */}
        <div className="relative aspect-[1.5/1] min-h-[400px] perspective-1000">
          <motion.div
            className="w-full h-full relative preserve-3d cursor-pointer"
            onClick={handleFlip}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Front (Question) */}
            <div 
              className="absolute inset-0 backface-hidden glass-panel rounded-[32px] p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 bg-gradient-to-br from-white/5 to-transparent"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-8 border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/10">
                Question
              </div>
              
              <div className="w-full flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar">
                <ReactMarkdown
                   components={{
                     p: ({children}) => <p className="text-2xl md:text-3xl font-medium text-white leading-snug">{children}</p>,
                     code: ({children}) => <code className="bg-white/10 px-2 py-0.5 rounded text-lg font-mono text-indigo-200">{children}</code>
                   }}
                >
                  {currentCard.front || "Empty Question"}
                </ReactMarkdown>
              </div>

              <div className="mt-8 text-slate-500/60 flex items-center gap-2 text-sm font-medium">
                <RotateCw size={14} /> <span>Tap or Space to flip</span>
              </div>
            </div>

            {/* Back (Answer) */}
            <div 
              className="absolute inset-0 backface-hidden glass-panel bg-[#151518] rounded-[32px] p-8 md:p-12 flex flex-col items-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-indigo-500/20"
              style={{ 
                backfaceVisibility: 'hidden', 
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)' 
              }}
            >
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6 border border-emerald-500/20 px-3 py-1 rounded-full bg-emerald-500/10 flex-shrink-0">
                Answer
              </div>

              {/* Content Container */}
              <div className="w-full flex-1 overflow-y-auto custom-scrollbar flex flex-col text-left pr-2">
                 <div className="mx-auto w-full max-w-lg">
                    {currentCard.back ? (
                        <ReactMarkdown
                        components={{
                            p: ({children}) => <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-4 last:mb-0 font-light">{children}</p>,
                            strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                            ul: ({children}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-slate-300 text-lg marker:text-indigo-500">{children}</ul>,
                            ol: ({children}) => <ol className="list-decimal pl-5 mb-4 space-y-2 text-slate-300 text-lg marker:text-indigo-500">{children}</ol>,
                            li: ({children}) => <li className="pl-1">{children}</li>,
                            blockquote: ({children}) => (
                            <div className="flex gap-3 my-4 p-4 rounded-xl bg-white/5 border-l-2 border-indigo-500">
                                <Quote className="flex-shrink-0 text-indigo-400 opacity-50 mt-1" size={16} />
                                <div className="italic text-slate-300 text-base">{children}</div>
                            </div>
                            ),
                            code: ({children}) => (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-300 border border-white/5 align-middle">
                                {children}
                            </code>
                            ),
                        }}
                        >
                        {currentCard.back}
                        </ReactMarkdown>
                    ) : (
                        <div className="text-center text-slate-500 italic mt-10">
                            No detailed answer provided.
                        </div>
                    )}
                 </div>
              </div>

              <div className="mt-6 text-slate-500/60 flex items-center gap-2 text-sm font-medium flex-shrink-0">
                <RotateCw size={14} /> <span>Tap to flip back</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mt-8">
          <button 
            onClick={handlePrev}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group"
            title="Previous"
          >
            <ChevronLeft className="text-slate-300 group-hover:text-white" size={20} />
          </button>
          
          <button 
            onClick={() => {
              setIsFlipped(false);
              setTimeout(() => setCurrentIndex(0), 200);
            }}
            className="px-6 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 text-slate-300 hover:text-white text-sm font-medium gap-2"
          >
             <RefreshCw size={16} /> <span className="hidden sm:inline">Reset</span>
          </button>

          <button 
            onClick={handleNext}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group"
            title="Next"
          >
            <ChevronRight className="text-slate-300 group-hover:text-white" size={20} />
          </button>
        </div>
        
        {/* Keyboard Hint */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
          <Keyboard size={12} />
          <span>Use arrow keys to navigate</span>
        </div>
      </div>
    </div>
  );
};