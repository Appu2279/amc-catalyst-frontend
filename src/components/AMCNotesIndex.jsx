import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  FileText,
  Heart,
  Brain,
  Activity,
  Zap,
  Eye,
  Wind,
  Baby,
  Compass,
  ShieldAlert,
  BarChart3,
  Droplet,
  Scale,
  Scissors,
  Layers,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  BadgeCheck,
  Star,
  Clock,
  Lock,
  AlertTriangle
} from 'lucide-react';

export const AMC_NOTES_DATA = {
  title: "AMC CATALYST NOTES — COMPLETE INDEX",
  author: "Dr. Solosailor’s AMC CATALYST",
  subtitle: "Comprehensive 22 High-Yield Exam Notes & Resources tailored for AMC Part 1 success",
  totalCount: 22,
  parts: [
    {
      partNumber: 1,
      partTitle: "PART 1 — 10 NOTES",
      count: 10,
      tagline: "Core Clinical Specialties & Essential AMC-1 Exam Tools",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      badgeClass: "bg-amber-100 text-amber-900 border-amber-300",
      accentColor: "#f59e0b",
      notes: [
        {
          id: "cardiology",
          title: "Cardiology Notes",
          part: 1,
          icon: Heart,
          tag: "Core Clinical",
          description: "High-yield ECGs, valvular diseases, heart failure, acute coronary syndromes & ETG guidelines."
        },
        {
          id: "psychiatry",
          title: "Psychiatry Notes",
          part: 1,
          icon: Brain,
          tag: "Core Clinical",
          description: "DSM-5 diagnostic criteria, psychopharmacology, MSE, risk assessment & Mental Health Act."
        },
        {
          id: "git",
          title: "GIT Notes",
          part: 1,
          icon: Activity,
          tag: "Core Clinical",
          description: "Gastroenterology, acute abdomen, liver diseases, inflammatory bowel disease & GI bleeding."
        },
        {
          id: "neurology",
          title: "Neurology Notes",
          part: 1,
          icon: Zap,
          tag: "Core Clinical",
          description: "Stroke pathways, cranial neuropathies, epilepsy, movement disorders & neuro-examination."
        },
        {
          id: "ent",
          title: "ENT Notes",
          part: 1,
          icon: Stethoscope,
          tag: "Specialty",
          description: "Otitis media, vertigo, hearing loss, epistaxis, head & neck red flags & airway emergencies."
        },
        {
          id: "ophthalmology",
          title: "Ophthalmology Notes",
          part: 1,
          icon: Eye,
          tag: "Specialty",
          description: "Red eye differential, acute vision loss, glaucoma, diabetic retinopathy & ocular trauma."
        },
        {
          id: "respiratory",
          title: "Respiratory Notes",
          part: 1,
          icon: Wind,
          tag: "Core Clinical",
          description: "Asthma/COPD management, pulmonary embolism, pneumonia algorithms & ABG analysis."
        },
        {
          id: "obstetrics",
          title: "Obstetrics Notes",
          part: 1,
          icon: Baby,
          tag: "Obs & Gynae",
          description: "Antenatal screening, pre-eclampsia, PPH, CTG interpretation & obstetric emergencies."
        },
        {
          id: "amc1-route-map",
          title: "AMC-1 Route Map",
          part: 1,
          icon: Compass,
          tag: "Exam Strategy",
          isResource: true,
          description: "Strategic blueprint, topic weighting, time management & Australian exam approach."
        },
        {
          id: "amc1-images-one-liners",
          title: "AMC-1 Images & One-Liners",
          part: 1,
          icon: Sparkles,
          tag: "Rapid Recall",
          isResource: true,
          description: "High-frequency image recalls, buzzwords, spot diagnoses & rapid-fire exam pearls."
        }
      ]
    },
    {
      partNumber: 2,
      partTitle: "PART 2 — 12 NOTES",
      count: 12,
      tagline: "Specialized Clinical Modules, Australian Toxins & Public Health",
      gradient: "from-violet-500/10 via-indigo-500/5 to-transparent",
      badgeClass: "bg-violet-100 text-violet-900 border-violet-300",
      accentColor: "#7c3aed",
      notes: [
        {
          id: "orthopaedic",
          title: "Orthopaedic Notes",
          part: 2,
          icon: Activity,
          tag: "Specialty",
          description: "Common fractures, compartment syndrome, joint dislocations, pediatric limp & septic arthritis."
        },
        {
          id: "dermatology",
          title: "Dermatology Notes",
          part: 2,
          icon: Sparkles,
          tag: "Specialty",
          description: "Skin cancers (BCC/SCC/Melanoma), drug eruptions, eczema, psoriasis & infectious rashes."
        },
        {
          id: "venom-bites",
          title: "Venom & Bites Notes",
          part: 2,
          icon: ShieldAlert,
          tag: "Australian Special",
          description: "Snake envenomation algorithms, funnel-web & redback spider bites, marine stings & antivenom protocols."
        },
        {
          id: "statistics",
          title: "Statistics Notes",
          part: 2,
          icon: BarChart3,
          tag: "High-Yield",
          description: "Sensitivity/specificity, PPV/NPV, odds ratios, relative risk, study designs & biostatistics."
        },
        {
          id: "haematology-rheumatology",
          title: "Haematology & Rheumatology Notes",
          part: 2,
          icon: Droplet,
          tag: "Core Clinical",
          description: "Anemia differentials, coagulation disorders, RA, SLE, vasculitis & crystal arthropathies."
        },
        {
          id: "ethics",
          title: "Ethics Notes",
          part: 2,
          icon: Scale,
          tag: "High-Yield",
          description: "AHPRA guidelines, patient consent, capacity, confidentiality, open disclosure & medical law."
        },
        {
          id: "surgery",
          title: "Surgery Notes",
          part: 2,
          icon: Scissors,
          tag: "Core Clinical",
          description: "Perioperative management, post-op complications, surgical abdomen, trauma & fluid resuscitation."
        },
        {
          id: "gynaecology",
          title: "Gynaecology Notes",
          part: 2,
          icon: Heart,
          tag: "Obs & Gynae",
          description: "Abnormal uterine bleeding, contraception, cervical screening (CST), PCOS, menopause & pelvic pain."
        },
        {
          id: "paediatrics",
          title: "Paediatrics Notes",
          part: 2,
          icon: Baby,
          tag: "Core Clinical",
          description: "Developmental milestones, pediatric immunizations, neonatology, respiratory infections & rash differential."
        },
        {
          id: "endocrinology",
          title: "Endocrinology Notes",
          part: 2,
          icon: Activity,
          tag: "Core Clinical",
          description: "Diabetes management, thyroid storms, adrenal crisis, pituitary disorders & calcium homeostasis."
        },
        {
          id: "miscellaneous",
          title: "Miscellaneous Notes",
          part: 2,
          icon: Layers,
          tag: "High-Yield",
          description: "Pharmacology recall points, toxicology, geriatric syndromes & cross-specialty clinical pearls."
        },
        {
          id: "preventative-medicine",
          title: "Preventative Medicine Notes",
          part: 2,
          icon: ShieldCheck,
          tag: "RACGP / Blueprint",
          description: "RACGP Redbook screening guidelines, Australian immunizations, travel medicine & population health."
        }
      ]
    }
  ]
};

export const AMCNotesIndex = ({
  variant = 'full', // 'full' | 'compact' | 'embed'
  showSearch = true,
  onSelectNote = null,
  publishedNoteTitles = []
}) => {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'part1' | 'part2'
  const [searchQuery, setSearchQuery] = useState('');

  const part1Notes = AMC_NOTES_DATA.parts[0].notes;
  const part2Notes = AMC_NOTES_DATA.parts[1].notes;

  const filterList = (list) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      n => n.title.toLowerCase().includes(q) ||
           n.description.toLowerCase().includes(q) ||
           n.tag.toLowerCase().includes(q)
    );
  };

  const filteredPart1 = useMemo(() => filterList(part1Notes), [part1Notes, searchQuery]);
  const filteredPart2 = useMemo(() => filterList(part2Notes), [part2Notes, searchQuery]);

  const renderNoteCard = (note) => {
    const Icon = note.icon || FileText;
    const isPart1 = note.part === 1;
    const isPublished = publishedNoteTitles.some(
      t => t.toLowerCase().includes(note.title.toLowerCase()) || note.title.toLowerCase().includes(t.toLowerCase())
    );

    return (
      <motion.div
        key={note.id}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        onClick={() => onSelectNote && onSelectNote(note)}
        className={`group relative bg-white rounded-2xl p-5 border-2 transition-all duration-200 flex flex-col justify-between ${
          onSelectNote ? 'cursor-pointer' : ''
        } ${
          isPart1
            ? 'border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10'
            : 'border-violet-200 hover:border-violet-400 hover:shadow-md hover:shadow-violet-500/10'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                isPart1
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-violet-50 text-violet-900 border-violet-200'
              }`}
            >
              Part {note.part}
            </span>

            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              {note.tag}
            </span>
          </div>

          <div className="flex items-start gap-3 mb-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isPart1
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                  : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-violet-600 transition-colors">
                {note.title}
              </h3>
              {note.isResource && (
                <span className="inline-block mt-0.5 text-[10px] font-black uppercase tracking-widest text-amber-600">
                  Special Resource
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-medium mt-2">
            {note.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Included in Plan
          </span>

          {publishedNoteTitles.length > 0 && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isPublished
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {isPublished ? 'Available Now' : 'Indexed'}
            </span>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`w-full ${variant === 'embed' ? '' : 'py-6'}`}>

      {/* Hero Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-amber-300">
              <BadgeCheck className="w-4 h-4 text-amber-400" />
              <span>{AMC_NOTES_DATA.author}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                PART 1 — 10
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-bold">
                PART 2 — 12
              </span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
            {AMC_NOTES_DATA.title}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-medium max-w-2xl">
            {AMC_NOTES_DATA.subtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-xs text-slate-400 font-medium">Total Resources</p>
              <p className="text-xl sm:text-2xl font-black text-amber-400">{AMC_NOTES_DATA.totalCount} Notes</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-xs text-slate-400 font-medium">Part 1 Modules</p>
              <p className="text-xl sm:text-2xl font-black text-amber-300">10 Core Subjects</p>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <p className="text-xs text-slate-400 font-medium">Part 2 Modules</p>
              <p className="text-xl sm:text-2xl font-black text-violet-300">12 High-Yield Notes</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Public Notices: Weekly Releases & IP Anti-Piracy Protection ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Weekly Additions Callout */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200 text-amber-950">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
              Weekly Notes Update Schedule ⚡
            </h4>
            <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">
              Remaining notes are continuously updated & added every week directly into your subscriber library. All active plan holders receive instant access as new notes drop.
            </p>
          </div>
        </div>

        {/* Strict IP Tracking & Anti-Piracy Notice */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border-2 border-indigo-900 text-white">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Anti-Piracy & Strict IP Tracking 🔒
            </h4>
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              Accounts, active sessions & IP addresses are logged in real-time with dynamic user watermarking. Account sharing, downloading, or unauthorized redistribution will trigger permanent termination without refund & legal escalation.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap sm:inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200/80 shadow-inner gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All 22 Notes
          </button>
          <button
            onClick={() => setActiveTab('part1')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'part1'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Part 1 (10 Notes)
          </button>
          <button
            onClick={() => setActiveTab('part2')}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'part2'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Part 2 (12 Notes)
          </button>
        </div>

        {showSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in 22 notes by topic, title..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── NOTES SECTIONS ────────────────────────────────────────────────────────── */}
      {/* If "all" tab is selected, render Part 1 (10 Notes) and Part 2 (12 Notes) in clear sections */}
      {activeTab === 'all' && (
        <div className="space-y-10">
          {/* Part 1 Section */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                PART 1 — 10 NOTES
              </span>
              <span className="text-xs font-bold text-slate-500">Core Clinical Specialties & AMC-1 Exam Tools</span>
            </div>
            {filteredPart1.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No Part 1 notes match "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPart1.map(renderNoteCard)}
              </div>
            )}
          </div>

          {/* Part 2 Section */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-violet-100 text-violet-900 border border-violet-300 text-xs font-black uppercase tracking-wider">
                PART 2 — 12 NOTES
              </span>
              <span className="text-xs font-bold text-slate-500">Specialized Clinical Modules & Australian Public Health</span>
            </div>
            {filteredPart2.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No Part 2 notes match "{searchQuery}"</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPart2.map(renderNoteCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Part 1 Tab view */}
      {activeTab === 'part1' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
              PART 1 — 10 NOTES
            </span>
          </div>
          {filteredPart1.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">No Part 1 notes match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPart1.map(renderNoteCard)}
            </div>
          )}
        </div>
      )}

      {/* Part 2 Tab view */}
      {activeTab === 'part2' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3.5 py-1 rounded-full bg-violet-100 text-violet-900 border border-violet-300 text-xs font-black uppercase tracking-wider">
              PART 2 — 12 NOTES
            </span>
          </div>
          {filteredPart2.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">No Part 2 notes match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPart2.map(renderNoteCard)}
            </div>
          )}
        </div>
      )}

      {/* Author Footer */}
      <div className="mt-8 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-full bg-brand-violet/10 flex items-center justify-center text-brand-violet shrink-0">
            <Star className="w-5 h-5 fill-brand-violet text-brand-violet" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-800">
              Dr. Solosailor’s AMC CATALYST Notes Suite
            </p>
            <p className="text-xs text-slate-500 font-medium">
              22 high-yield notes tailored specifically to AMC Part 1 exam questions & guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
