import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Sparkles, X, Check, Award, Crown, Medal, BookOpenCheck } from 'lucide-react';
import { ReadingStreakMilestone } from '../../types';

interface ReadingMilestoneModalProps {
  isOpen: boolean;
  milestone: ReadingStreakMilestone | null;
  streakDays: number;
  onClose: () => void;
}

export const ReadingMilestoneModal: React.FC<ReadingMilestoneModalProps> = ({
  isOpen,
  milestone,
  streakDays,
  onClose
}) => {
  if (!isOpen || !milestone) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className="w-14 h-14 text-amber-300" />;
      case 'Medal':
        return <Medal className="w-14 h-14 text-amber-300" />;
      case 'Award':
        return <Award className="w-14 h-14 text-amber-300" />;
      case 'BookOpenCheck':
        return <BookOpenCheck className="w-14 h-14 text-emerald-300" />;
      case 'Sparkles':
        return <Sparkles className="w-14 h-14 text-teal-300" />;
      default:
        return <Flame className="w-14 h-14 text-amber-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl shadow-amber-500/20 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 -mb-16 -mr-16 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Animated Celebration Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.1, damping: 15 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/30 via-emerald-500/20 to-teal-500/30 border-2 border-amber-400/60 flex items-center justify-center shadow-lg shadow-amber-950/50 mb-5 relative"
          >
            {renderIcon(milestone.badgeIcon)}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
              className="absolute inset-0 rounded-3xl border border-dashed border-amber-400/40"
            />
          </motion.div>

          <div className="space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone Tercapai!</span>
            </div>

            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              🎉 Selamat, Santri Hebat!
            </h3>

            <p className="text-sm text-slate-300">
              Kamu telah membaca buku dan kitab selama{' '}
              <strong className="text-amber-300 font-bold">{streakDays} hari berturut-turut</strong>!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-left space-y-1.5 mb-6">
            <div className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" />
              Lencana Prestasi Baru:
            </div>
            <div className="text-base font-bold text-white flex items-center justify-between">
              <span>{milestone.title}</span>
              <span className="text-xs text-emerald-400 font-mono">🔥 {milestone.days} Hari</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {milestone.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-900/40 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Terus Istiqamah Membaca</span>
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
