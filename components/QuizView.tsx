import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Check, X, ArrowRight, RotateCcw, AlertCircle, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface QuizViewProps {
  quizzes: QuizQuestion[];
}

export const QuizView: React.FC<QuizViewProps> = ({ quizzes }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  // Robust filtering of malformed questions
  const validQuizzes = (quizzes || []).filter(q => 
    q && 
    q.question && 
    Array.isArray(q.options) && 
    q.options.length >= 2 // Need at least 2 options for a quiz
  );

  // Helper to safely get the correct answer index
  const getSafeCorrectIndex = (q: QuizQuestion) => {
    // Parse to ensure number, handle if AI sends string "0"
    const raw = Number(q.correctAnswerIndex);
    const index = isNaN(raw) ? 0 : Math.floor(raw);
    
    // Clamp between 0 and last index
    return Math.min(Math.max(0, index), q.options.length - 1);
  };

  // Guard Clause for Empty Data
  if (validQuizzes.length === 0) {
    return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-slate-400 p-10 glass-panel rounded-3xl border border-white/5 text-center">
            <AlertCircle size={32} className="mb-4 opacity-50" />
            <p>No valid quiz questions could be generated from this content.</p>
            <p className="text-sm mt-2 opacity-60">The content might be too short or unstructured.</p>
        </div>
    );
  }

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let score = 0;
    validQuizzes.forEach((q, idx) => {
      const safeCorrectIndex = getSafeCorrectIndex(q);
      if (selectedAnswers[idx] === safeCorrectIndex) score++;
    });
    return score;
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setShowResults(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto pb-40">
      <div className="flex items-end justify-between mb-10 pl-2">
        <div>
           <h2 className="text-3xl font-semibold text-white mb-2">Knowledge Check</h2>
           <p className="text-slate-400 font-light">Assess your understanding of the material.</p>
        </div>
        {showResults && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             className="text-right"
           >
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Final Score</div>
              <div className="text-4xl font-bold text-white leading-none">
                 {Math.round((calculateScore() / validQuizzes.length) * 100)}%
              </div>
           </motion.div>
        )}
      </div>

      <div className="space-y-16">
        {validQuizzes.map((quiz, qIdx) => {
          const safeCorrectIndex = getSafeCorrectIndex(quiz);
          const userSelected = selectedAnswers[qIdx];
          
          return (
            <motion.div 
              key={qIdx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIdx * 0.1 }}
              className="relative"
            >
              {/* Question Number & Text */}
              <div className="mb-6 px-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-3">
                  Question {qIdx + 1}
                </span>
                <p className="text-xl text-slate-200 font-medium leading-relaxed">{quiz.question}</p>
              </div>

              {/* Options */}
              <div className="grid gap-3">
                {quiz.options.map((option, oIdx) => {
                  let status = 'default';
                  
                  if (showResults) {
                    if (oIdx === safeCorrectIndex) status = 'correct'; 
                    else if (userSelected === oIdx) status = 'incorrect';
                  } else if (userSelected === oIdx) {
                    status = 'selected';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelect(qIdx, oIdx)}
                      disabled={showResults}
                      className={`
                        w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between group relative overflow-hidden
                        ${status === 'default' ? 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300' : ''}
                        ${status === 'selected' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : ''}
                        ${status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}
                        ${status === 'incorrect' ? 'bg-red-500/10 border-red-500/40 text-red-200' : ''}
                        ${showResults && status === 'default' ? 'opacity-50 grayscale' : ''} 
                      `}
                    >
                      <div className="flex items-center gap-4 relative z-10 w-full">
                         <div className={`
                            w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-colors shrink-0
                            ${status === 'selected' ? 'border-white bg-white text-indigo-600' : 
                              status === 'correct' ? 'border-emerald-400 bg-emerald-400 text-black' :
                              status === 'incorrect' ? 'border-red-400 bg-red-400 text-black' :
                              'border-slate-600 text-slate-400 group-hover:border-slate-400'
                            }
                         `}>
                            {status === 'correct' ? <Check size={14} /> : 
                             status === 'incorrect' ? <X size={14} /> :
                             String.fromCharCode(65 + oIdx)}
                         </div>
                         <span className="font-light text-lg flex-1">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (Revealed after results) */}
              <AnimatePresence>
                {showResults && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 py-6 rounded-2xl bg-gradient-to-br from-indigo-900/30 to-indigo-900/10 border border-indigo-500/30 shadow-inner">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            <BookOpen size={14} className="text-indigo-300" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                          Explanation
                        </span>
                      </div>
                      
                      <div className="text-slate-300 font-light leading-relaxed text-[15px]">
                        <ReactMarkdown 
                          components={{
                            p: ({children}) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                            strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                            em: ({children}) => <em className="text-indigo-200 not-italic">{children}</em>,
                            code: ({children}) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300 border border-white/10">{children}</code>
                          }}
                        >
                          {quiz.explanation || "No explanation provided for this question."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Controls */}
      <div className="fixed bottom-10 left-0 right-0 z-40 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          {!showResults ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResults(true)}
              disabled={Object.keys(selectedAnswers).length < validQuizzes.length}
              className="px-8 py-4 bg-white text-black font-semibold rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-3"
            >
              <span>Complete Quiz</span>
              <ArrowRight size={18} />
            </motion.button>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="glass-panel px-6 py-2 rounded-full flex items-center gap-4 shadow-[0_20px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl bg-[#1a1a1e]/90"
            >
              <div className="text-center px-2">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">You Scored</span>
                <span className={`text-xl font-bold leading-none ${calculateScore() === validQuizzes.length ? 'text-emerald-400' : 'text-white'}`}>
                  {calculateScore()} / {validQuizzes.length}
                </span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-medium text-indigo-300 hover:text-white transition-colors"
              >
                <RotateCcw size={16} />
                <span>Retry</span>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};