import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, MessageSquare, CheckSquare, Zap, ArrowLeft, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { SummaryView } from './components/SummaryView';
import { FlashcardsView } from './components/FlashcardsView';
import { QuizView } from './components/QuizView';
import { ChatView } from './components/ChatView';
import { AuthView } from './components/AuthView';
import { GettingStartedView } from './components/GettingStartedView';
import { SubjectDashboard } from './components/SubjectDashboard';
import { analyzeLectureContent } from './services/geminiService';
import { LectureAnalysis, Subject, SavedMaterial } from './types';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'summary' | 'flashcards' | 'quiz' | 'chat';
type AppView = 'dashboard' | 'upload' | 'analysis';

// Background Component
const Background = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#050507]">
      <div className="bg-noise" />
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.5, 0.3], 
          scale: [1, 1.1, 1],
          filter: ["blur(100px)", "blur(120px)", "blur(100px)"]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-slate-800/20" 
      />
      <motion.div 
        animate={{ 
          opacity: [0.2, 0.4, 0.2],
          scale: [1, 1.2, 1],
          filter: ["blur(100px)", "blur(130px)", "blur(100px)"]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/10" 
      />
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<{name: string; email: string} | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  
  // Data State
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name: 'Biology 101', materials: [], color: 'bg-emerald-500' },
    { id: '2', name: 'Art History', materials: [], color: 'bg-purple-500' },
  ]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [currentMaterial, setCurrentMaterial] = useState<SavedMaterial | null>(null);

  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'subject' | 'material';
    subjectId: string;
    materialId?: string;
    title: string;
  } | null>(null);

  // Progress Bar Simulation
  useEffect(() => {
    if (isProcessing) {
      const texts = [
        "Connecting to Neural Network...",
        "Deep Reasoning & Analysis...",
        "Checking Factual Consistency...",
        "Generating High-Yield Flashcards...",
        "Crafting Quiz Questions...",
        "Finalizing Study Guide..."
      ];
      let i = 0;
      setLoadingText(texts[0]);
      
      const textInterval = setInterval(() => {
        i++;
        setLoadingText(texts[i % texts.length]);
      }, 3500);

      return () => {
        clearInterval(textInterval);
      };
    }
  }, [isProcessing]);

  // --- ACTIONS ---

  const handleCreateSubject = (name: string) => {
    const newSubject: Subject = {
      id: Date.now().toString(),
      name,
      materials: [],
      color: `bg-${['blue', 'indigo', 'purple', 'pink', 'teal'][Math.floor(Math.random() * 5)]}-500`
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  // Replaced native confirm with Modal trigger
  const handleDeleteSubject = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    setDeleteConfirmation({
      type: 'subject',
      subjectId,
      title: subject.name
    });
  };

  // Replaced native confirm with Modal trigger
  const handleDeleteMaterial = (subjectId: string, materialId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const material = subject?.materials.find(m => m.id === materialId);
    if (!material) return;

    setDeleteConfirmation({
      type: 'material',
      subjectId,
      materialId,
      title: material.title
    });
  };

  // Executed after Modal confirmation
  const executeDelete = () => {
    if (!deleteConfirmation) return;

    if (deleteConfirmation.type === 'subject') {
      setSubjects(prev => prev.filter(s => s.id !== deleteConfirmation.subjectId));
      if (activeSubjectId === deleteConfirmation.subjectId) {
        setActiveSubjectId(null);
        setCurrentView('dashboard');
      }
    } else if (deleteConfirmation.type === 'material' && deleteConfirmation.materialId) {
      setSubjects(prev => prev.map(sub => {
        if (sub.id === deleteConfirmation.subjectId) {
          return {
            ...sub,
            materials: sub.materials.filter(m => m.id !== deleteConfirmation.materialId)
          };
        }
        return sub;
      }));
      
      if (currentMaterial?.id === deleteConfirmation.materialId) {
        setCurrentMaterial(null);
        setCurrentView('dashboard');
      }
    }
    setDeleteConfirmation(null);
  };

  const handleMoveMaterial = (materialId: string, targetSubjectId: string) => {
    setSubjects(prev => {
      // Robust Move Logic: Find source and material in the current state snapshot
      let materialToMove: SavedMaterial | undefined;
      let sourceSubjectId: string | undefined;

      for (const subject of prev) {
        const found = subject.materials.find(m => m.id === materialId);
        if (found) {
          materialToMove = found;
          sourceSubjectId = subject.id;
          break;
        }
      }

      // If not found or moving to same subject, return unchanged
      if (!materialToMove || !sourceSubjectId || sourceSubjectId === targetSubjectId) {
        return prev;
      }

      // Execute Move
      return prev.map(sub => {
        if (sub.id === sourceSubjectId) {
          return {
            ...sub,
            materials: sub.materials.filter(m => m.id !== materialId)
          };
        }
        if (sub.id === targetSubjectId) {
          return {
            ...sub,
            materials: [materialToMove!, ...sub.materials]
          };
        }
        return sub;
      });
    });

    // If we moved the currently active material out of the active subject, close the view
    if (currentMaterial?.id === materialId && activeSubjectId && targetSubjectId !== activeSubjectId) {
        setCurrentMaterial(null);
        setCurrentView('dashboard');
        // Optionally switch active subject, but staying on dashboard is safer
    }
  };

  const handleInputSubmit = async (type: 'file' | 'url', value: File | string, title?: string) => {
    if (!activeSubjectId) return;

    setIsProcessing(true);
    setError(null);

    try {
      let analysisResult: LectureAnalysis;
      let sourceName = '';

      if (type === 'file' && value instanceof File) {
        sourceName = value.name;
        const reader = new FileReader();
        
        const fileData = await new Promise<{content: string, mime: string}>((resolve, reject) => {
          reader.onload = () => {
             const base64Data = reader.result as string;
             resolve({
                content: base64Data.split(',')[1],
                mime: value.type
             });
          };
          reader.onerror = reject;
          reader.readAsDataURL(value);
        });

        analysisResult = await analyzeLectureContent({
          type: 'file',
          data: fileData.content,
          mimeType: fileData.mime
        });

      } else if (type === 'url' && typeof value === 'string') {
        sourceName = title || "YouTube Video"; // Use title from metadata if available
        analysisResult = await analyzeLectureContent({
          type: 'text',
          data: value,
          title: title // Pass title to analysis service
        });
      } else {
        throw new Error("Invalid input type provided.");
      }

      const newMaterial: SavedMaterial = {
        id: Date.now().toString(),
        title: analysisResult.title,
        type: type,
        date: new Date(),
        analysis: analysisResult,
        originalSource: sourceName
      };

      setSubjects(prev => prev.map(sub => {
        if (sub.id === activeSubjectId) {
          return { ...sub, materials: [newMaterial, ...sub.materials] };
        }
        return sub;
      }));

      setCurrentMaterial(newMaterial);
      setCurrentView('analysis');
      setActiveTab('summary');

    } catch (err: any) {
      console.error(err);
      let errorMsg = "An unexpected error occurred.";

      // Check for network connectivity first
      if (!navigator.onLine) {
         errorMsg = "Network Error: Please check your internet connection.";
      }
      else if (err.message === "AI_CONTENT_ACCESS_ERROR") {
         errorMsg = "Content Access Error: The AI could not access the transcript or content of this video. It might be private, age-restricted, or lacking captions.";
      }
      else if (err.message === "AI_JSON_PARSE_ERROR") {
         errorMsg = "Analysis Error: The AI response was malformed. Please try a different video or shorter file.";
      }
      else if (err.message) {
         if (err.message.includes("400")) errorMsg = "Input Error: The file might be corrupted or the format invalid.";
         else if (err.message.includes("503") || err.message.includes("Overloaded")) errorMsg = "Server Busy: AI Service is temporarily overloaded. Please try again.";
         else if (err.message.includes("SAFETY")) errorMsg = "Content Filtered: The lecture content was flagged by safety filters.";
         else errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('dashboard');
    setActiveSubjectId(null);
    setCurrentMaterial(null);
    setShowLanding(true);
  };

  // --- RENDER ---

  if (!user) {
    return (
      <>
        <Background />
        <AnimatePresence mode="wait">
          {showLanding ? (
            <GettingStartedView key="landing" onGetStarted={() => setShowLanding(false)} />
          ) : (
            <AuthView key="auth" onLogin={setUser} />
          )}
        </AnimatePresence>
      </>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-[#050507]">
        <Background />
        
        <div className="relative z-10 flex flex-col items-center justify-center w-full">
          
          {/* DIGITAL SINGULARITY VISUALIZER */}
          <div className="relative w-80 h-80 flex items-center justify-center mb-16">
            
            {/* 1. Deep Atmospheric Glow (Breathing) */}
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-indigo-500/30 blur-[60px] rounded-full"
            />

            {/* 2. Outer Dashed Ring (Slow Rotate) */}
            <motion.div
               animate={{ rotate: 360 }}
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border border-white/10 rounded-full border-dashed"
            />

            {/* 3. Gyroscopic Middle Ring (Tilted & Fast Reverse) */}
            <motion.div 
               className="absolute inset-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-400 border-r-transparent"
               animate={{ rotate: -360, scale: [0.98, 1.02, 0.98] }}
               transition={{ 
                 rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                 scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
               }}
            />

            {/* 4. Scanning Orbital (Fastest) */}
            <motion.div 
               className="absolute inset-0 rounded-full"
               animate={{ rotate: 360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
                <div className="absolute top-0 left-1/2 w-[2px] h-12 -translate-x-1/2 bg-gradient-to-b from-white to-transparent opacity-80 blur-[1px]" />
            </motion.div>

            {/* 5. The Core (Morphing Shape) */}
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Outer Geometrics */}
                <motion.div
                   animate={{ rotate: [0, 90, 180, 270, 360], borderRadius: ["50%", "30%", "50%", "30%", "50%"] }}
                   transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-0 border border-white/20"
                />
                
                {/* Inner Core Light */}
                <motion.div
                   animate={{ 
                     scale: [0.8, 1.1, 0.8], 
                     boxShadow: [
                       "0 0 20px rgba(99,102,241,0.3)", 
                       "0 0 50px rgba(99,102,241,0.6)", 
                       "0 0 20px rgba(99,102,241,0.3)"
                     ]
                   }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="w-16 h-16 bg-white rounded-full flex items-center justify-center relative z-20"
                >
                   <div className="w-14 h-14 bg-[#050507] rounded-full flex items-center justify-center">
                      <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-4 h-4 bg-indigo-400 rounded-full blur-sm"
                      />
                   </div>
                </motion.div>
            </div>

            {/* 6. Orbital Particles */}
            {[0, 90, 180, 270].map((deg, i) => (
                <motion.div
                    key={i}
                    className="absolute inset-[15%]"
                    initial={{ rotate: deg }}
                    animate={{ rotate: deg + 360 }}
                    transition={{ duration: 15 + i, repeat: Infinity, ease: "linear" }}
                >
                    <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-indigo-300 rounded-full shadow-[0_0_10px_currentColor]" />
                </motion.div>
            ))}

          </div>

          {/* Text Container */}
          <motion.div
             key={loadingText}
             initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
             transition={{ duration: 0.5, ease: "easeOut" }}
             className="text-center space-y-4 relative z-20"
          >
            <h2 className="text-4xl font-light tracking-tight text-white/90">
               Processing
            </h2>
            <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-gradient-to-r from-transparent to-indigo-500/50" />
                <p className="text-indigo-200/70 font-mono text-xs tracking-[0.2em] uppercase shadow-black drop-shadow-md">
                  {loadingText}
                </p>
                <span className="h-px w-8 bg-gradient-to-l from-transparent to-indigo-500/50" />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-200 selection:bg-indigo-500/30">
      <Background />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-6 pointer-events-none"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center pointer-events-auto">
          <div 
            onClick={() => {
              setCurrentView('dashboard');
              setActiveSubjectId(null);
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Zap size={14} className="text-indigo-300" />
             </div>
             <span className="text-sm font-medium tracking-wide text-slate-300 group-hover:text-white transition-colors">AI Student</span>
          </div>

          <button 
            onClick={handleLogout}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all"
          >
            <div className="w-5 h-5 rounded-full bg-slate-700/50 flex items-center justify-center text-xs text-white font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 pt-32 pb-32 px-6 min-h-screen flex flex-col items-center">
        
        {/* DASHBOARD VIEW */}
        {currentView === 'dashboard' && (
          <SubjectDashboard
            subjects={subjects}
            currentSubjectId={activeSubjectId}
            onSelectSubject={(id) => setActiveSubjectId(id)}
            onCreateSubject={handleCreateSubject}
            onDeleteSubject={handleDeleteSubject}
            onDeleteMaterial={handleDeleteMaterial}
            onMoveMaterial={handleMoveMaterial}
            onBackToDashboard={() => setActiveSubjectId(null)}
            onNewAnalysis={(subjectId) => {
              setActiveSubjectId(subjectId);
              setCurrentView('upload');
            }}
            onSelectMaterial={(material) => {
              setCurrentMaterial(material);
              setCurrentView('analysis');
              setActiveTab('summary');
            }}
          />
        )}

        {/* UPLOAD VIEW */}
        {currentView === 'upload' && activeSubjectId && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl flex flex-col items-center"
          >
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors self-start"
            >
              <ArrowLeft size={16} />
              <span>Back to {subjects.find(s => s.id === activeSubjectId)?.name}</span>
            </button>

            <div className="text-center mb-10 space-y-4">
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
                Add Material
              </h1>
              <p className="text-lg text-slate-400 font-light max-w-md mx-auto leading-relaxed">
                Upload a lecture file or paste a YouTube link to generate your study guide.
              </p>
            </div>
            
            <FileUpload onInputSubmit={handleInputSubmit} />

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 w-full glass-panel border-red-500/20 bg-red-500/5 p-4 rounded-xl flex items-start gap-4"
              >
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-200 font-medium mb-1">Analysis Failed</h4>
                  <p className="text-sm text-red-200/70 leading-relaxed">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-300 hover:text-white p-2"
                >
                  <RefreshCw size={14} />
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ANALYSIS VIEW */}
        {currentView === 'analysis' && currentMaterial && (
          <motion.div
            key="analysis-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-5xl"
          >
             {/* Navigation Back */}
            <div className="mb-8 flex items-center gap-4">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                 <h2 className="text-white font-medium">{currentMaterial.title}</h2>
                 <p className="text-xs text-slate-500">
                    {subjects.find(s => s.id === activeSubjectId)?.name} • {currentMaterial.date.toLocaleDateString()}
                 </p>
              </div>
            </div>

            {/* iOS Style Segmented Control */}
            <div className="sticky top-24 z-40 flex justify-center mb-12">
              <div className="glass-panel p-1 rounded-full flex items-center space-x-1 shadow-2xl backdrop-blur-xl">
                {[
                  { id: 'summary', icon: Layers, label: 'Summary' },
                  { id: 'flashcards', icon: BookOpen, label: 'Cards' },
                  { id: 'quiz', icon: CheckSquare, label: 'Quiz' },
                  { id: 'chat', icon: MessageSquare, label: 'Chat' }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className={`relative px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all duration-300 ${
                        isActive ? 'text-black' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-full shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <tab.icon size={14} className={isActive ? "text-black" : ""} />
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="w-full"
            >
              {activeTab === 'summary' && <SummaryView analysis={currentMaterial.analysis} />}
              {activeTab === 'flashcards' && <FlashcardsView flashcards={currentMaterial.analysis.flashcards} />}
              {activeTab === 'quiz' && <QuizView quizzes={currentMaterial.analysis.quizzes} />}
              {activeTab === 'chat' && (
                <ChatView 
                  context={`
                    Title: ${currentMaterial.analysis.title}
                    Summary: ${currentMaterial.analysis.summary}
                    Key Points: ${currentMaterial.analysis.keyPoints.join('\n')}
                    
                    Quiz Questions for context:
                    ${currentMaterial.analysis.quizzes.map(q => q.question).join('\n')}
                  `} 
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setDeleteConfirmation(null)}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-panel p-8 rounded-3xl w-full max-w-md relative z-10 border border-white/10 shadow-2xl"
                >
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-white">Delete {deleteConfirmation.type === 'subject' ? 'Subject' : 'File'}?</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirmation.title}"</span>? 
                            {deleteConfirmation.type === 'subject' && " All materials inside will be permanently lost."}
                            <br/>This action cannot be undone.
                        </p>
                        <div className="flex gap-3 w-full mt-4">
                            <button 
                                onClick={() => setDeleteConfirmation(null)}
                                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium transition-colors border border-white/5"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={executeDelete}
                                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg shadow-red-500/20 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;