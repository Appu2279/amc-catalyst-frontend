import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Check, ClipboardList, Globe, HelpCircle, MessageSquareText, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../api/courseService';

// Static supporting copy from the client's sheet — presentation only, so it is
// not stored against any plan.
const HIGHLIGHTS = [
  { icon: ClipboardList,     title: '10 Months of Recalls', body: 'Extensive recall content with monthly additions.' },
  { icon: BookOpen,          title: '3–5 Mock Exams',       body: 'Exam pattern based full-length mocks.' },
  { icon: HelpCircle,        title: 'Subject-wise MCQs',    body: 'High-yield MCQs from major question banks.' },
  { icon: Users,             title: 'Community & Support',  body: 'Telegram community, discussions & expert guidance.' },
];

const NOTES = [
  {
    icon: Globe,
    title: 'International Pricing',
    body: 'International pricing is 10% higher than the applicable India price.',
  },
  {
    icon: ShieldCheck,
    title: 'Additional Access',
    body: 'All subscriptions are for 6 months. Additional access can be purchased month-by-month after the initial subscription period.',
  },
];

const inr = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

// Accent per card position, following the client's layout: the two middle tiers
// carry the emphasis, the standalone plan sits quieter on the end.
const ACCENTS = {
  'MOST POPULAR':    { ring: 'border-brand-violet', chip: 'bg-brand-violet text-white' },
  'BEST VALUE':      { ring: 'border-brand-gold',   chip: 'bg-brand-gold text-white' },
  'STANDALONE PLAN': { ring: 'border-slate-100',    chip: 'bg-brand-violet/10 text-brand-violet' },
};

const PlanCard = ({ course, index }) => {
  const pricing = course.CoursePricings?.[0];
  const accent = ACCENTS[course.badge] ?? { ring: 'border-slate-100', chip: '' };
  const isFeatured = course.badge === 'MOST POPULAR' || course.badge === 'BEST VALUE';

  // Ordering lives on the join row so the same feature can sit in different
  // places on different cards.
  const features = [...(course.Features ?? [])].sort(
    (a, b) => (a.CourseFeature?.position ?? 0) - (b.CourseFeature?.position ?? 0)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className={`relative flex flex-col rounded-[1.75rem] border-2 bg-white p-6 pt-8 ${accent.ring} ${
        isFeatured ? 'shadow-[0_24px_48px_rgba(124,58,237,0.10)]' : 'shadow-sm'
      }`}
    >
      {course.badge && (
        <span
          className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest ${accent.chip}`}
        >
          {course.badge}
        </span>
      )}

      <h3 className="text-center text-xl font-black uppercase tracking-tight text-brand-violet">
        {course.title}
      </h3>

      <div className="mt-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Early Bird</p>
        <p className="text-4xl font-black tracking-tighter text-brand-dark">
          {inr(pricing?.discounted_price)}
        </p>
        {pricing?.actual_price !== pricing?.discounted_price && (
          <>
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
              Regular Price
            </p>
            <p className="text-sm font-bold text-slate-400 line-through">{inr(pricing?.actual_price)}</p>
          </>
        )}
      </div>

      <div className="my-6 h-px bg-slate-100" />

      {/* Tiered plans list only their additions on top of the plan below them. */}
      {course.inherits_from && (
        <p className="mb-5 text-center text-sm font-medium text-slate-500">
          Everything in {course.inherits_from.title}
          <span className="mt-1 block text-xs font-black uppercase tracking-widest text-brand-violet">
            Plus
          </span>
        </p>
      )}

      <ul className="flex-1 space-y-3">
        {features.map((feature) =>
          feature.CourseFeature?.highlight ? (
            <li
              key={feature.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-5 text-center"
            >
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-brand-violet" />
              <span className="text-sm font-bold text-brand-dark">{feature.name}</span>
            </li>
          ) : (
            <li key={feature.id} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 stroke-[3] text-brand-violet" />
              <span className="text-[13px] font-medium leading-snug text-slate-600">
                {feature.name}
              </span>
            </li>
          )
        )}
      </ul>

      <Link to="/register" className="mt-7">
        <button
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-black transition-all ${
            isFeatured
              ? 'bg-brand-violet text-white shadow-lg shadow-brand-violet/20 hover:bg-brand-violet-hover'
              : 'bg-brand-dark text-white hover:bg-brand-violet'
          }`}
        >
          Enroll Now <ArrowRight className="h-4 w-4" />
        </button>
      </Link>
    </motion.div>
  );
};

export const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCourses()
      // The API already returns plans in card order (sort_order).
      .then((response) => setPlans(response.data))
      .catch((err) => {
        console.error('Error fetching plans:', err);
        setError(true);
      });
  }, []);

  return (
    <div className="relative overflow-hidden bg-white py-24">
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-blue via-brand-violet to-brand-gold opacity-50" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-brand-violet">
            <Sparkles className="h-4 w-4" /> Catalyst Programs
          </div>
          <h1 className="text-4xl font-black leading-tight text-brand-dark md:text-5xl">
            Ready to <span className="text-gradient-brand">Master the AMC?</span>
          </h1>
          <p className="mt-4 font-medium text-slate-500">
            Complete AMC Part 1 preparation with Notes, Recalls, MCQs, Mocks and more.
          </p>
          <span className="mt-8 inline-block rounded-full bg-brand-violet/10 px-6 py-2 text-xs font-black uppercase tracking-widest text-brand-violet">
            All plans include 6 months of access
          </span>
        </div>

        {/* Plans */}
        {error ? (
          <p className="mt-16 text-center font-medium text-slate-400">
            Plans are unavailable right now. Please try again shortly.
          </p>
        ) : (
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((course, idx) => (
              <PlanCard key={course.id} course={course} index={idx} />
            ))}
          </div>
        )}

        {/* Highlights */}
        <div className="mt-16 grid grid-cols-1 gap-6 rounded-[1.75rem] border border-slate-100 bg-slate-50/50 p-8 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-violet shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-dark">
                  {title}
                </h4>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing notes */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {NOTES.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-4 rounded-[1.75rem] border border-slate-100 p-6"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-violet">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-dark">
                  {title}
                </h4>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-slate-300">
          <span className="h-px w-12 bg-slate-200" />
          <p className="text-xs font-bold uppercase tracking-widest">
            Early Bird offer is for a limited time only
          </p>
          <span className="h-px w-12 bg-slate-200" />
        </div>
      </div>
    </div>
  );
};
