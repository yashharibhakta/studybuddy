import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { LectureAnalysis } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Square, Loader2, Quote, Sparkles, Play, Wifi } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface SummaryViewProps {
  analysis: LectureAnalysis;
}

// --- Futuristic Audio Visualizer Component ---
const AudioWaveform = () => {
  return (
    <div className="flex items-center gap-[3px] h-4 mx-2">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-gradient-to-t from-indigo-500 to-cyan-300 rounded-full"
          animate={{
            height: [4, Math.random() * 14 + 4, 4],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 0.4 + Math.random() * 0.4,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: i * 0.05
          }}
        />
      ))}
    </div>
  );
};

export const SummaryView: React.FC<SummaryViewProps> = ({ analysis }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  // Refs for audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = () => {
    if (sourceRef.current) {
        try {
            sourceRef.current.stop();
        } catch (e) {
            // Ignore errors if already stopped
        }
        sourceRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  const handlePlayAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoadingAudio(true);

    try {
      const base64Audio = await generateSpeech(analysis.summary);

      // Initialize AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }
      const ctx = audioContextRef.current;

      // Resume context if suspended (browser requirement)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Decode and play
      const audioData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      
      source.start();
      sourceRef.current = source;
      setIsPlaying(true);

    } catch (error) {
      console.error("Failed to play audio:", error);
      // Optional: Add toast or alert here
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass-panel p-10 md:p-14 rounded-[32px] relative overflow-hidden group border-white/10"
      >
        {/* --- Futuristic Visuals --- */}
        
        {/* 1. Subtle Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* 2. Scanning Light Bar */}
        <motion.div 
            initial={{ top: "-20%", opacity: 0 }}
            animate={{ top: "120%", opacity: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-indigo-400/5 to-transparent pointer-events-none z-0 blur-xl"
        />

        {/* 3. HUD Corners */}
        <div className="absolute top-6 left-6 w-3 h-3 border-l border-t border-indigo-400/30 rounded-tl-sm opacity-50" />
        <div className="absolute top-6 right-6 w-3 h-3 border-r border-t border-indigo-400/30 rounded-tr-sm opacity-50" />
        <div className="absolute bottom-6 left-6 w-3 h-3 border-l border-b border-indigo-400/30 rounded-bl-sm opacity-50" />
        <div className="absolute bottom-6 right-6 w-3 h-3 border-r border-b border-indigo-400/30 rounded-br-sm opacity-50" />

        <div className="relative z-10">
            <div className="flex flex-col-reverse md:flex-row md:items-center justify-between mb-8 gap-4">
                
                {/* Tag */}
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold tracking-wider text-indigo-300 uppercase block">
                    AI Analysis
                    </span>
                </div>
                
                {/* --- Futuristic Audio Player --- */}
                <motion.div 
                    layout
                    className={`
                      relative flex items-center overflow-hidden rounded-full border backdrop-blur-md transition-colors
                      ${isPlaying 
                        ? 'bg-indigo-950/40 border-indigo-500/50 pr-2 pl-4 py-1.5' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 px-4 py-2'
                      }
                    `}
                >
                    <AnimatePresence mode="wait">
                        {isLoadingAudio ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3 text-indigo-300"
                            >
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-xs font-bold uppercase tracking-wider">Synthesizing Voice...</span>
                            </motion.div>
                        ) : isPlaying ? (
                            <motion.div 
                                key="playing"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex items-center gap-4"
                            >
                                <div className="flex items-center gap-2">
                                  <motion.div 
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" 
                                  />
                                  <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest">Live Feed</span>
                                </div>
                                
                                {/* The Waveform Animation */}
                                <AudioWaveform />
                                
                                <button
                                    onClick={stopAudio}
                                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center justify-center transition-colors border border-red-500/30"
                                >
                                    <Square size={12} fill="currentColor" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.button 
                                key="idle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={handlePlayAudio}
                                className="flex items-center gap-2 text-white group"
                            >
                                <Volume2 size={16} className="text-indigo-400 group-hover:text-indigo-300" />
                                <span className="text-xs font-bold uppercase tracking-wide">Read Aloud</span>
                                <div className="w-px h-3 bg-white/10 mx-1" />
                                <Play size={10} fill="currentColor" className="opacity-60" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-10 tracking-tight leading-tight">
            {analysis.title}
            </h1>
            
            {/* Enhanced Markdown Rendering */}
            <div className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown
                components={{
                    p: ({children}) => <p className="text-slate-300 font-light leading-8 mb-6">{children}</p>,
                    h1: ({children}) => <h1 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-semibold text-indigo-200 mt-8 mb-4 flex items-center gap-2 before:content-[''] before:w-1 before:h-5 before:bg-indigo-500 before:rounded-full">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-medium text-white mt-6 mb-3">{children}</h3>,
                    ul: ({children}) => <ul className="space-y-3 mb-6">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 space-y-2 mb-6 text-slate-300">{children}</ol>,
                    li: ({children}) => (
                        <li className="flex gap-3 text-slate-300 leading-relaxed">
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_currentColor] flex-shrink-0" />
                            <span>{children}</span>
                        </li>
                    ),
                    strong: ({children}) => (
                        <strong className="text-white font-semibold bg-white/5 px-1 rounded mx-0.5 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white/10">
                            {children}
                        </strong>
                    ),
                    blockquote: ({children}) => (
                        <div className="relative pl-8 py-2 my-8 border-l-2 border-indigo-500/50 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-r-xl">
                            <Quote className="absolute top-2 left-2 w-4 h-4 text-indigo-400 opacity-50" />
                            <div className="text-indigo-100 italic">{children}</div>
                        </div>
                    ),
                    code: ({children}) => (
                        <code className="font-mono text-sm bg-black/30 border border-white/10 px-1.5 py-0.5 rounded text-indigo-300">
                            {children}
                        </code>
                    )
                }}
            >
                {analysis.summary}
            </ReactMarkdown>
            </div>
        </div>
      </motion.div>

      {/* Key Points - Staggered Reveal */}
      <div className="grid gap-4">
        <div className="px-4 flex items-center gap-2 mb-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Key Takeaways</span>
            <div className="h-px bg-white/10 flex-1" />
        </div>
        
        {(analysis.keyPoints || []).map((point, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            whileHover={{ scale: 1.005, x: 5 }}
            className="glass-panel p-6 rounded-2xl flex items-start gap-5 border border-white/5 hover:border-indigo-500/30 transition-colors group"
          >
            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold flex items-center justify-center mt-0.5 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              {index + 1}
            </span>
            <span className="text-slate-300 font-light leading-relaxed text-lg group-hover:text-white transition-colors">
                {point}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Helper Functions for Audio Decoding (PCM 24kHz) ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // PCM data from Gemini is 16-bit little-endian
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
        // Convert 16-bit integer to float [-1.0, 1.0]
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
