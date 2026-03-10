import React from 'react';
import { motion } from 'framer-motion';
import { Utensils } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  variant?: 'full' | 'inline';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  variant = 'full'
}) => {
  const container = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const shimmer = {
    initial: { x: '-60%' },
    animate: {
      x: '60%',
      transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  if (variant === 'inline') {
    return (
      <div
        className="flex flex-col items-center justify-center py-10"
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        <motion.div
          className="relative h-12 w-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full border-2 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent"></div>
        </motion.div>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-emerald-50"
      role="status"
      aria-live="polite"
      aria-label="Loading. Please wait."
    >
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-200/50 blur-3xl" />

      <motion.div
        className="relative w-[min(92vw,520px)] rounded-3xl border border-white/70 bg-white/70 px-8 py-10 text-center shadow-2xl backdrop-blur-xl"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg">
          <Utensils className="h-8 w-8" aria-hidden="true" />
        </div>

        <h2 className="text-3xl font-semibold tracking-tight text-slate-800">Smart Hostel Food</h2>
        <p className="mt-2 text-sm uppercase tracking-[0.2em] text-emerald-600">Dining operations</p>

        <p className="mt-5 text-base text-slate-600">{message}</p>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-slate-200/70" aria-hidden="true">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-400"
            variants={shimmer}
            initial="initial"
            animate="animate"
          />
        </div>

        <div className="mt-6 flex items-center justify-center gap-2" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-2 w-2 rounded-full bg-emerald-500"
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.25, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.2 }}
            />
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-400" aria-hidden="true">
          Preparing your dashboard experience…
        </p>
      </motion.div>
    </div>
  );
};

export { LoadingScreen };
export default LoadingScreen;

