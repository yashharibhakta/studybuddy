import React, { useRef, useState, useEffect } from 'react';
import { Upload, Youtube, ArrowRight, Clipboard, Play, AlertCircle, FileAudio, X, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onInputSubmit: (type: 'file' | 'url', value: File | string, title?: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onInputSubmit }) => {
  const [mode, setMode] = useState<'file' | 'url'>('file');
  const [dragActive, setDragActive] = useState(false);
  
  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // URL State
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  useEffect(() => {
    setLocalError(null);
    setSelectedFile(null);
    setUrl('');
    setIsValidUrl(false);
    setVideoId(null);
    setVideoTitle(null);
  }, [mode]);

  // Enhanced URL Validation
  useEffect(() => {
    if (!url) {
      setIsValidUrl(false);
      setVideoId(null);
      setVideoTitle(null);
      setIsCheckingUrl(false);
      setLocalError(null);
      return;
    }

    setIsCheckingUrl(true);
    setLocalError(null);

    const timeoutId = setTimeout(() => {
      // Expanded Regex to include 'live' and handle common query params better
      const regExp = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})(?:\S+)?$/;
      const match = url.match(regExp);

      if (match && match[1]) {
        setIsValidUrl(true);
        setVideoId(match[1]);
        setLocalError(null);
      } else {
        setIsValidUrl(false);
        setVideoId(null);
        setVideoTitle(null);
        if (url.length > 15) {
            setLocalError("Invalid YouTube URL. Please use a standard video link (e.g., youtube.com/watch?v=...)");
        }
      }
      setIsCheckingUrl(false);
    }, 300); 

    return () => clearTimeout(timeoutId);
  }, [url]);

  const validateFile = (file: File): boolean => {
    if (file.size === 0) {
      setLocalError("The selected file is empty.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setLocalError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max limit is 50MB.`);
      return false;
    }

    const allowedMimes = [
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a', 'audio/webm', 'audio/aac', 'audio/ogg',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'text/plain',
      'application/pdf'
    ];
    const allowedExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.mp4', '.mov', '.webm', '.avi', '.txt', '.pdf'];

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    const isMimeValid = allowedMimes.some(type => fileType.includes(type));
    const isExtValid = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isMimeValid && !isExtValid) {
       setLocalError("Invalid file type. Supported formats: PDF, TXT, MP3, MP4, WAV, MOV.");
       return false;
    }

    setLocalError(null);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setLocalError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLocalError(null);
      if (validateFile(file)) {
        setSelectedFile(file);
      }
      e.target.value = ''; 
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!navigator.onLine) {
        setLocalError("Network Error: Please check your internet connection.");
        return;
    }
    
    if (mode === 'file' && selectedFile) {
      onInputSubmit('file', selectedFile);
    } else if (mode === 'url' && isValidUrl) {
      // Fetch metadata first to provide context
      setIsFetchingMeta(true);
      let title = videoTitle || undefined;
      
      try {
        if (!title && isValidUrl) {
           const res = await fetch(`https://noembed.com/embed?url=${url}`);
           const data = await res.json();
           if (data.title) {
              title = data.title;
              setVideoTitle(data.title);
           }
        }
      } catch (err) {
        console.warn("Could not fetch video metadata", err);
      } finally {
        setIsFetchingMeta(false);
        onInputSubmit('url', url, title);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Segmented Control */}
      <div className="flex justify-center mb-10">
        <div className="glass-panel p-1 rounded-full inline-flex relative shadow-lg">
          <div className="absolute inset-1 bg-white/5 rounded-full" />
          {[
            { id: 'file', label: 'Upload File', icon: Upload },
            { id: 'url', label: 'YouTube Link', icon: Youtube }
          ].map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id as 'file' | 'url')}
                className={`
                  relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                  ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="uploadMode"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10 shadow-sm backdrop-blur-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'file' ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            {!selectedFile ? (
              <div 
                className={`
                  relative h-72 rounded-[32px] border transition-all duration-500 flex flex-col items-center justify-center overflow-hidden cursor-pointer group
                  ${dragActive 
                    ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.2)]' 
                    : 'glass-panel border-white/10 hover:border-white/20 hover:bg-white/10'
                  }
                  ${localError ? 'border-red-500/30 bg-red-500/5' : ''}
                `}
                onClick={() => inputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.mp3,.wav,.m4a,.mp4,.mov,.webm,audio/*,video/*,text/plain,application/pdf"
                  onChange={handleFileSelect}
                />
                
                <div className="absolute inset-0 opacity-[0.03]" 
                  style={{ 
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
                    backgroundSize: '24px 24px' 
                  }} 
                />

                <motion.div 
                  className={`
                    w-20 h-20 rounded-[24px] flex items-center justify-center mb-8 transition-all duration-500
                    ${dragActive ? 'bg-indigo-500 text-white shadow-lg scale-110' : 'bg-white/5 text-slate-300 border border-white/10'}
                    ${localError ? 'text-red-400 border-red-500/20' : ''}
                  `}
                >
                  {localError ? <AlertTriangle size={32} /> : <Upload size={32} strokeWidth={1.5} />}
                </motion.div>
                
                <div className="text-center space-y-3 relative z-10 px-6">
                  <h3 className={`text-xl font-medium ${localError ? 'text-red-300' : 'text-white'}`}>
                    {localError ? 'Upload Failed' : 'Drop lecture file'}
                  </h3>
                  <p className="text-sm text-slate-400 font-light max-w-xs mx-auto">
                    {localError || (
                       <>Audio, Video, PDF, or Text. <br/> <span className="opacity-60">Up to 50MB</span></>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              // Selected File Preview
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-2 rounded-[32px] border border-white/10"
              >
                <div className="bg-white/5 rounded-[28px] p-8">
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                        <FileAudio size={32} />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg truncate max-w-[200px] md:max-w-sm">
                          {selectedFile.name}
                        </h3>
                        <p className="text-slate-400 text-sm">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSubmit()}
                    className="w-full py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Process Lecture</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.form
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSubmit}
            className="w-full"
          >
            <div className={`
              glass-panel p-1 rounded-[32px] border transition-all duration-300 relative overflow-hidden
              ${isValidUrl ? 'border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : 'border-white/10'}
              ${localError ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''}
            `}>
               
               <div className="relative z-10 bg-black/20 rounded-[28px] p-8 backdrop-blur-sm">
                 <div className="flex items-center gap-4 mb-6">
                   <div className={`
                     w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                     ${isValidUrl ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'}
                     ${localError ? 'bg-red-500/20 text-red-500' : ''}
                   `}>
                     {localError ? <AlertTriangle size={20} /> : <Youtube size={20} fill={isValidUrl ? "currentColor" : "none"} />}
                   </div>
                   <div>
                     <span className="text-lg font-medium text-white block">YouTube Analysis</span>
                     <span className="text-xs text-slate-500">Paste a video link to extract knowledge</span>
                   </div>
                 </div>

                 <div className="relative group z-20">
                   <input
                     type="url"
                     value={url}
                     onChange={(e) => setUrl(e.target.value)}
                     placeholder="https://youtube.com/watch?v=..."
                     className={`
                       w-full bg-white/5 border rounded-2xl py-5 pl-5 pr-32 text-lg text-white placeholder-slate-600 focus:outline-none focus:bg-white/10 transition-all font-light
                       ${localError ? 'border-red-500/40 focus:border-red-500/60 bg-red-500/5' : 'border-white/10 focus:border-white/20'}
                     `}
                   />
                   
                   <div className="absolute right-2 top-2 bottom-2 flex gap-2 items-center">
                     {!url && (
                        <button
                          type="button"
                          onClick={async () => {
                             try {
                               const text = await navigator.clipboard.readText();
                               setUrl(text);
                             } catch (e) { console.error(e); }
                          }}
                          className="px-4 h-full rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-medium transition-colors flex items-center gap-2"
                        >
                          <Clipboard size={14} /> Paste
                        </button>
                     )}
                   </div>
                 </div>
                 
                 {/* Thumbnail Preview */}
                 <AnimatePresence>
                   {isValidUrl && videoId && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 20, height: 0 }}
                        className="mt-6"
                      >
                        <div className="overflow-hidden rounded-2xl border border-white/10 relative shadow-2xl group cursor-pointer" onClick={() => handleSubmit()}>
                            <div className="aspect-video relative">
                            <img 
                                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                onError={(e) => {
                                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                }}
                                alt="Video Thumbnail"
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <motion.div 
                                whileHover={{ scale: 1.1 }}
                                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl"
                                >
                                <Play size={28} fill="currentColor" className="ml-1" />
                                </motion.div>
                            </div>
                            </div>
                        </div>
                        
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            type="submit"
                            disabled={isFetchingMeta}
                            className="w-full mt-4 py-3 bg-white text-black rounded-xl font-medium shadow-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isFetchingMeta ? <Loader2 className="animate-spin" size={20} /> : (
                              <>Process Video <ArrowRight size={18} /></>
                            )}
                        </motion.button>
                      </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {localError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm"
          >
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p>{localError}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};