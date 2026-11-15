import React from 'react';
import { motion } from 'framer-motion';
import {
  Mic, UserRound, Timer, ClipboardList, BarChart3, ClipboardCheck, Layers, RefreshCw,
  Users, Bell, Video, Phone, Mail, Sparkles,
} from 'lucide-react';
import { Glow } from '@/components/ui/Glow';

const FEATURES = [
  { icon: Mic, text: 'Patient and examiner voice interaction' },
  { icon: UserRound, text: 'Animated, realistic characters' },
  { icon: Timer, text: 'Real exam format: 2 min reading + 8 min in the room' },
  { icon: ClipboardList, text: 'Examiner-style report with structured feedback' },
  { icon: BarChart3, text: 'Track your progress and identify areas to improve' },
];

const STATS = [
  { icon: ClipboardCheck, value: '130+', label: 'Practice stations' },
  { icon: Layers, value: '250+', label: 'Topics mapped' },
  { icon: RefreshCw, value: '370+', label: 'Recall patterns (4 months)' },
];

/** Decorative station screen: simulated patient + examiner on a call. */
const StationScreen = () => (
  <div aria-hidden="true" className="relative mx-auto w-full max-w-md">
    <div className="rounded-2xl bg-white/[0.06] p-3 sm:p-4 shadow-2xl ring-1 ring-white/15 backdrop-blur">
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-white">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> AMC Clinical Station
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
          <Timer className="h-3 w-3" /> 08:00
        </span>
      </div>
      {/* Patient + examiner art cropped from the client's poster (labels are baked in). */}
      <div className="grid grid-cols-[216fr_182fr] gap-2">
        <img src="/images/announcements/simulator-patient.jpg" alt="" width={216} height={140} className="h-auto w-full rounded-lg" />
        <img src="/images/announcements/simulator-examiner.jpg" alt="" width={182} height={140} className="h-auto w-full rounded-lg" />
      </div>
      <div className="mt-3 flex justify-center gap-3">
        {[Mic, Video].map((Icon, i) => (
          <span key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
            <Icon className="h-4 w-4" />
          </span>
        ))}
        <span className="flex h-8 w-10 items-center justify-center rounded-full bg-red-500 text-white">
          <Phone className="h-4 w-4 rotate-[135deg]" />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
          <Mail className="h-4 w-4" />
        </span>
      </div>
    </div>
  </div>
);

/**
 * Homepage advert for the upcoming AMC Clinical Simulator (free beta for
 * members). Coming soon, so no CTA. Dark in both themes (.theme-fixed).
 */
export const ClinicalSimulatorAnnouncement = () => (
  <section id="clinical-simulator" className="py-16 lg:py-24 scroll-mt-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="theme-fixed relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0b1730] via-[#13254a] to-[#4a1027] p-6 sm:p-10 lg:p-14 shadow-2xl ring-1 ring-white/10"
      >
        <Glow className="-top-24 -right-16 w-96 h-96" color="rgba(190, 30, 70, 0.35)" />
        <Glow className="-bottom-32 -left-24 w-[28rem] h-[28rem]" color="rgba(56, 130, 246, 0.22)" />

        <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#0b1730]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Coming soon
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Free beta · Exclusively for members
              </span>
            </div>

            <h2 className="mt-6 font-black leading-none tracking-tight text-white">
              <span className="block text-4xl sm:text-6xl">AMC Clinical</span>
              <span className="mt-2 inline-block -skew-x-12 bg-gradient-to-r from-[#8b1e3f] to-[#be1e46] px-5 py-1 shadow-lg shadow-[#be1e46]/30">
                <span className="inline-block skew-x-12 text-4xl sm:text-6xl">Simulator</span>
              </span>
            </h2>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-white/50">For active preparation</p>

            <p className="mt-6 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed">
              A realistic, interactive platform to practise AMC Clinical stations, build clinical
              communication skills and get examiner-style feedback.
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10 transition-colors hover:bg-white/[0.09] sm:last:col-span-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#be1e46]/20 text-[#ff8fa8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-white leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <StationScreen />
        </div>

        <ul className="relative mt-10 grid gap-3 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur">
              <Icon className="h-9 w-9 shrink-0 text-amber-300" strokeWidth={1.75} aria-hidden="true" />
              <span>
                <span className="block text-3xl font-black text-white leading-none">{value}</span>
                <span className="mt-1 block text-sm text-white/60">{label}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center">
          <p className="max-w-2xl text-sm sm:text-base text-white/70">
            Be among the first to experience our new AMC Clinical Simulator, practise stations and help
            us make it even better with your valuable feedback.
          </p>
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm sm:text-base font-bold text-[#0b1730] shadow-lg">
            <Bell className="h-5 w-5 text-[#be1e46]" aria-hidden="true" /> Access will be shared soon with our members.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);
