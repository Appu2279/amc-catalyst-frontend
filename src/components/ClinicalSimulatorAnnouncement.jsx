import React from 'react';
import { motion } from 'framer-motion';
import {
  Mic, UserRound, Timer, ClipboardList, BarChart3, ClipboardCheck, Layers, RefreshCw,
  Users, Bell, Megaphone, Video, PhoneOff, Mail,
} from 'lucide-react';
import { Glow } from '@/components/ui/Glow';

const FEATURES = [
  { icon: Mic, text: 'Patient and examiner voice interaction' },
  { icon: UserRound, text: 'Animated, realistic characters' },
  { icon: Timer, text: 'Real exam format: 2 minutes reading + 8 minutes in the room' },
  { icon: ClipboardList, text: 'Examiner-style report with structured feedback' },
  { icon: BarChart3, text: 'Track your progress and identify areas to improve' },
];

const STATS = [
  { icon: ClipboardCheck, value: '130+', label: 'Practice stations' },
  { icon: Layers, value: '250+', label: 'Topics mapped' },
  { icon: RefreshCw, value: '370+', label: 'Recall patterns (4 months)' },
];

const CallTile = ({ label, tone }) => (
  <div className={`relative flex aspect-[4/3] items-center justify-center rounded-xl ${tone}`}>
    <UserRound className="h-12 w-12 text-white/70" aria-hidden="true" />
    <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
      {label}
    </span>
  </div>
);

/** Decorative preview of the simulator's station screen (patient + examiner call). */
const StationPreview = () => (
  <div aria-hidden="true" className="rounded-2xl bg-[#0b1630] p-4 shadow-2xl ring-1 ring-white/10">
    <div className="mb-3 flex items-center justify-between text-xs font-bold text-white">
      <span>AMC Clinical Station</span>
      <span className="inline-flex items-center gap-1"><Timer className="h-3.5 w-3.5" /> 08:00</span>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <CallTile label="Simulated Patient" tone="bg-gradient-to-br from-sky-700 to-sky-900" />
      <CallTile label="Examiner" tone="bg-gradient-to-br from-slate-600 to-slate-800" />
    </div>
    <div className="mt-3 flex justify-center gap-3">
      {[Mic, Video, PhoneOff, Mail].map((Icon, i) => (
        <span
          key={i}
          className={`flex h-8 w-8 items-center justify-center rounded-full ${Icon === PhoneOff ? 'bg-red-500' : 'bg-white/10'} text-white`}
        >
          <Icon className="h-4 w-4" />
        </span>
      ))}
    </div>
  </div>
);

/**
 * Homepage advert for the upcoming AMC Clinical Simulator (free beta for
 * members), adapted from the client's poster. Coming soon: no CTA to open it.
 * Dark in both themes (.theme-fixed), in the poster's navy and maroon.
 */
export const ClinicalSimulatorAnnouncement = () => (
  <section id="clinical-simulator" className="bg-white py-20 lg:py-28 scroll-mt-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="theme-fixed relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f1f3d] via-[#13254a] to-[#3a0f22] p-6 sm:p-10 lg:p-12 shadow-2xl ring-1 ring-white/10"
      >
        <Glow className="-top-24 -right-16 w-96 h-96" color="rgba(190, 30, 70, 0.25)" />
        <Glow className="-bottom-32 -left-24 w-[28rem] h-[28rem]" color="rgba(56, 130, 246, 0.18)" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#2a1a08]">
                <Megaphone className="h-3.5 w-3.5" aria-hidden="true" /> Coming soon
              </span>
              <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/80">
                Dr. Solosailor&apos;s AMC Catalyst
              </span>
            </div>

            <h2 className="font-black leading-[1.05] tracking-tight text-white">
              <span className="block text-4xl sm:text-5xl lg:text-6xl">AMC Clinical</span>
              <span className="mt-2 inline-block -skew-x-6 rounded-lg bg-[#8b1e3f] px-4 py-1 text-4xl sm:text-5xl lg:text-6xl">
                Simulator
              </span>
            </h2>
            <p className="mt-4 text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-white/60">
              For active preparation
            </p>

            <p className="mt-6 max-w-lg border-l-4 border-[#be1e46] pl-4 text-base sm:text-lg text-white/85 leading-relaxed">
              A realistic, interactive platform to practise AMC Clinical stations, build clinical
              communication skills and get examiner-style feedback.
            </p>

            <ul className="mt-6 space-y-2.5">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3 ring-1 ring-white/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sky-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-white">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <StationPreview />
        </div>

        <ul className="relative mt-10 grid gap-3 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <li key={label} className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
              <Icon className="h-9 w-9 shrink-0 text-[#f0738f]" aria-hidden="true" />
              <span>
                <span className="block text-3xl font-black text-white">{value}</span>
                <span className="block text-sm text-white/70">{label}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="relative mt-8 flex flex-col overflow-hidden rounded-2xl sm:flex-row">
          <span className="bg-amber-300 px-6 py-3 text-center text-lg font-black uppercase italic leading-tight text-[#0f1f3d]">
            Free beta version
          </span>
          <span className="flex grow items-center justify-center gap-2 bg-[#8b1e3f] px-6 py-3 text-center text-base sm:text-lg font-black uppercase text-white">
            <Users className="h-5 w-5" aria-hidden="true" /> Exclusively for our members
          </span>
        </div>

        <p className="relative mt-5 text-center text-sm sm:text-base text-white/80">
          Be among the first to experience our new AMC Clinical Simulator, practise stations and help
          us make it even better with your valuable feedback.
        </p>
        <p className="relative mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm sm:text-base font-bold text-white ring-1 ring-white/20">
          <Bell className="h-5 w-5 text-amber-300" aria-hidden="true" /> Access will be shared soon with our members.
        </p>
      </motion.div>
    </div>
  </section>
);
