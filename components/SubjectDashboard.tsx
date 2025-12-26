import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Plus, ChevronRight, Book, Clock, Youtube, FileText, ArrowLeft, Trash2, LayoutGrid, FolderInput, X } from 'lucide-react';
import { Subject, SavedMaterial } from '../types';

interface SubjectDashboardProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  onCreateSubject: (name: string) => void;
  onDeleteSubject: (subjectId: string) => void;
  onSelectMaterial: (material: SavedMaterial) => void;
  onDeleteMaterial: (subjectId: string, materialId: string) => void;
  onMoveMaterial: (materialId: string, targetSubjectId: string) => void;
  onNewAnalysis: (subjectId: string) => void;
  currentSubjectId: string | null;
  onBackToDashboard: () => void;
}

export const SubjectDashboard: React.FC<SubjectDashboardProps> = ({
  subjects,
  onSelectSubject,
  onCreateSubject,
  onDeleteSubject,
  onSelectMaterial,
  onDeleteMaterial,
  onMoveMaterial,
  onNewAnalysis,
  currentSubjectId,
  onBackToDashboard
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  // State for Moving Files
  const [materialToMove, setMaterialToMove] = useState<SavedMaterial | null>(null);

  const activeSubject = subjects?.find(s => s.id === currentSubjectId);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjectName.trim()) {
      onCreateSubject(newSubjectName);
      setNewSubjectName('');
      setIsCreating(false);
    }
  };

  const handleMoveConfirm = (targetSubjectId: string) => {
    if (materialToMove) {
      onMoveMaterial(materialToMove.id, targetSubjectId);
      setMaterialToMove(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // --- FOLDER LIST VIEW ---
  if (!activeSubject) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex justify-between items-end mb-10 px-4">
          <div>
            <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">My Library</h1>
            <p className="text-slate-400 font-light">Organize your knowledge base.</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} />
            <span>New Subject</span>
          </button>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Create New Card (Inline) */}
          <AnimatePresence>
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-3xl border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.2)]"
              >
                <form onSubmit={handleCreateSubmit}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white">
                      <Folder size={20} />
                    </div>
                    <span className="text-sm font-medium text-indigo-300">New Subject</span>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Subject Name"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-lg mb-4 focus:outline-none focus:bg-white/10 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-white text-black rounded-lg py-2.5 text-sm font-medium hover:bg-slate-200 transition-colors">Create</button>
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg py-2.5 text-sm transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {(subjects || []).map((subject) => (
            <motion.div
              key={subject.id}
              variants={itemVariants}
              onClick={() => onSelectSubject(subject.id)}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              className="glass-panel p-6 rounded-3xl cursor-pointer group border-white/5 hover:border-white/20 transition-all relative overflow-hidden"
            >
              {/* Delete Button (Visible) - High Z-Index to Ensure Clickability */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSubject(subject.id);
                  }}
                  className="p-2 bg-black/20 hover:bg-red-500/80 text-slate-500 hover:text-white rounded-full backdrop-blur-sm transition-colors"
                  title="Delete Subject"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex justify-between items-start mb-12">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${subject.color}`}>
                  <Folder size={28} fill="currentColor" fillOpacity={0.2} />
                </div>
              </div>
              
              <h3 className="text-xl font-medium text-white mb-2">{subject.name}</h3>
              <p className="text-sm text-slate-500 font-light flex items-center gap-2">
                <Book size={14} />
                {subject.materials?.length || 0} {subject.materials?.length === 1 ? 'Lecture' : 'Lectures'}
              </p>

              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
          ))}
        </motion.div>
        
        {(!subjects || subjects.length === 0) && !isCreating && (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
             <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <LayoutGrid size={40} className="text-slate-600" />
             </div>
             <p className="text-slate-500 text-lg">No subjects created yet.</p>
          </div>
        )}
      </div>
    );
  }

  // --- SUBJECT DETAIL VIEW ---
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-10"
      >
        <button 
          onClick={onBackToDashboard}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-white/5"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">{activeSubject.name}</h1>
          <p className="text-slate-400 text-sm font-light">Subject Dashboard</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
            <button
                onClick={() => onNewAnalysis(activeSubject.id)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
                <Plus size={16} />
                <span>Add Material</span>
            </button>
        </div>
      </motion.div>

      {(!activeSubject.materials || activeSubject.materials.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <FileText size={32} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-lg font-light">No materials yet.</p>
            <p className="text-slate-600 text-sm">Upload a lecture to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
            {activeSubject.materials.map((material) => (
                <motion.div
                    key={material.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelectMaterial(material)}
                    className="glass-panel p-5 rounded-2xl flex items-center gap-5 cursor-pointer hover:bg-white/5 hover:border-white/20 transition-all group relative overflow-hidden"
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
                        material.type === 'url' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                        {material.type === 'url' ? <Youtube size={20} /> : <FileText size={20} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate pr-16 text-lg">{material.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                                <Clock size={10} />
                                {material.date.toLocaleDateString()}
                            </span>
                            <span className="truncate max-w-[200px] opacity-60">{material.originalSource}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-20">
                       {/* Move Button */}
                       <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaterialToMove(material);
                        }}
                        className="p-2 rounded-full hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 transition-colors"
                        title="Move to another subject"
                      >
                        <FolderInput size={18} />
                      </button>

                      {/* Delete Material */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMaterial(activeSubject.id, material.id);
                        }}
                        className="p-2 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-white/10 group-hover:text-white transition-colors ml-2 hidden md:flex">
                          <ChevronRight size={16} />
                      </div>
                    </div>
                </motion.div>
            ))}
        </div>
      )}

      {/* Move Material Modal */}
      <AnimatePresence>
        {materialToMove && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMaterialToMove(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md glass-panel p-6 rounded-3xl relative z-10 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">Move Material</h3>
                  <p className="text-slate-400 text-sm mt-1">Select a destination for "{materialToMove.title}"</p>
                </div>
                <button 
                  onClick={() => setMaterialToMove(null)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {subjects
                  .filter(s => s.id !== currentSubjectId) // Don't show current subject
                  .map(subject => (
                    <button
                      key={subject.id}
                      onClick={() => handleMoveConfirm(subject.id)}
                      className="w-full p-4 rounded-xl bg-white/5 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 border border-white/5 flex items-center gap-4 transition-all group text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${subject.color} opacity-80`}>
                        <Folder size={20} fill="currentColor" fillOpacity={0.2} />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white flex-1">{subject.name}</span>
                      <ChevronRight size={16} className="text-slate-500 group-hover:text-white" />
                    </button>
                ))}
                
                {subjects.length <= 1 && (
                   <div className="text-center py-8 text-slate-500">
                      <p>No other subjects available.</p>
                      <button 
                         onClick={() => setMaterialToMove(null)}
                         className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                      >
                        Create a new subject first
                      </button>
                   </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};