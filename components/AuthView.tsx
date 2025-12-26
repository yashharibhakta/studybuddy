import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: (user: { name: string; email: string }) => void;
}

// Calm, premium easing
const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate a secure, deliberate process
    setTimeout(() => {
      onLogin({
        name: name || email.split('@')[0],
        email
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
      <motion.div 
        key="auth-card"
        initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)', transition: { duration: 0.4, ease } }}
        transition={{ duration: 0.6, ease }}
        className="w-full max-w-[420px]"
      >
        <div className="glass-panel p-10 md:p-12 rounded-[32px] backdrop-blur-3xl border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)]">
          
          <div className="text-center mb-10 space-y-2">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease }}
              className="text-2xl font-semibold text-white tracking-tight"
            >
              {isLogin ? 'Welcome back' : 'Create account'}
            </motion.h2>
            <motion.p 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2, duration: 0.8, ease }}
               className="text-slate-400 text-[15px] font-light"
            >
              {isLogin ? 'Enter your details to continue.' : 'Start your journey with us.'}
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease }}
                >
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-light text-[15px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
               initial={{ opacity: 0, y: 5 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3, duration: 0.8, ease }}
            >
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-light text-[15px] mb-4"
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all font-light text-[15px]"
              />
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease }}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(255, 255, 255, 1)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-medium py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-white/10 transition-all duration-300 flex items-center justify-center gap-2 mt-6 text-[16px] tracking-tight"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-black/50" />
              ) : (
                <>
                  <span>{isLogin ? 'Continue' : 'Create Account'}</span>
                  {isLogin && <ArrowRight className="w-4 h-4 ml-1" />}
                </>
              )}
            </motion.button>
          </form>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-500 hover:text-white text-[14px] transition-colors"
            >
              {isLogin ? "Create a new account" : "Back to login"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};