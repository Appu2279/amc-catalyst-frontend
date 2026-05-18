import React, { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import {
  getQuestionsAdmin,
  getMockTests,
  getImportBatches,
  getSubjects,
} from '@/api/adminService';
import { HelpCircle, ClipboardList, Upload, BookOpen } from 'lucide-react';

// ── Inline SVG Bar Chart ──────────────────────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  const H = 110;
  const BW = 56;
  const GAP = 28;
  const W = data.length * (BW + GAP) - GAP + 20;

  return (
    <svg viewBox={`0 0 ${W} ${H + 36}`} className="w-full" style={{ maxHeight: 160 }}>
      {data.map((d, i) => {
        const bh = Math.max((d.value / max) * H, 2);
        const x = 10 + i * (BW + GAP);
        const y = H - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={BW} height={bh} rx={5} fill={d.color} />
            <text
              x={x + BW / 2}
              y={H + 16}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {d.label}
            </text>
            <text
              x={x + BW / 2}
              y={y - 5}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#1e293b"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Inline SVG Pie Chart ──────────────────────────────────────────────────────
const PieChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 70;
  const cy = 70;
  const r = 58;
  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, ...d };
  });

  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[140px] text-slate-400 text-sm">
        No data
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5">
      <svg width={140} height={140}>
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color} stroke="white" strokeWidth={2} />
        ))}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-slate-500">{d.label}</span>
            <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Status badges ─────────────────────────────────────────────────────────────
const batchBadge = (status) => {
  const map = {
    processing: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};

const publishBadge = (published) =>
  published ? (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Published</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Draft</span>
  );

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <div className="text-2xl font-bold text-slate-900">{value ?? '—'}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [diffData, setDiffData] = useState([]);
  const [sourceData, setSourceData] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, mtRes, bRes, sRes, easyRes, medRes, hardRes, qbRes, recRes, mockRes, pyRes] =
          await Promise.all([
            getQuestionsAdmin({ limit: 1 }),
            getMockTests(),
            getImportBatches(),
            getSubjects(),
            getQuestionsAdmin({ difficulty: 'easy', limit: 1 }),
            getQuestionsAdmin({ difficulty: 'medium', limit: 1 }),
            getQuestionsAdmin({ difficulty: 'hard', limit: 1 }),
            getQuestionsAdmin({ source_type: 'qbank', limit: 1 }),
            getQuestionsAdmin({ source_type: 'recall', limit: 1 }),
            getQuestionsAdmin({ source_type: 'mock', limit: 1 }),
            getQuestionsAdmin({ source_type: 'previous_year', limit: 1 }),
          ]);

        const mockTests = mtRes.data?.data ?? mtRes.data ?? [];
        const batches = bRes.data?.data ?? bRes.data ?? [];
        const subjects = sRes.data?.data ?? sRes.data ?? [];

        setStats({
          questions: qRes.data?.pagination?.total ?? 0,
          mockTests: Array.isArray(mockTests) ? mockTests.length : 0,
          batches: Array.isArray(batches) ? batches.length : 0,
          subjects: Array.isArray(subjects) ? subjects.length : 0,
        });

        setDiffData([
          { label: 'Easy', value: easyRes.data?.pagination?.total ?? 0, color: '#22c55e' },
          { label: 'Medium', value: medRes.data?.pagination?.total ?? 0, color: '#f59e0b' },
          { label: 'Hard', value: hardRes.data?.pagination?.total ?? 0, color: '#ef4444' },
        ]);

        setSourceData([
          { label: 'QBank', value: qbRes.data?.pagination?.total ?? 0, color: '#3b82f6' },
          { label: 'Recall', value: recRes.data?.pagination?.total ?? 0, color: '#8b5cf6' },
          { label: 'Mock', value: mockRes.data?.pagination?.total ?? 0, color: '#f59e0b' },
          { label: 'Prev. Year', value: pyRes.data?.pagination?.total ?? 0, color: '#10b981' },
        ]);

        setRecentBatches(
          Array.isArray(batches) ? [...batches].reverse().slice(0, 5) : []
        );
        setRecentTests(
          Array.isArray(mockTests) ? [...mockTests].reverse().slice(0, 5) : []
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900">Dashboard Overview</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Questions" value={stats.questions} icon={HelpCircle} color="bg-blue-50 text-blue-600" />
          <StatCard label="Mock Tests" value={stats.mockTests} icon={ClipboardList} color="bg-purple-50 text-purple-600" />
          <StatCard label="Import Batches" value={stats.batches} icon={Upload} color="bg-amber-50 text-amber-600" />
          <StatCard label="Subjects" value={stats.subjects} icon={BookOpen} color="bg-green-50 text-green-600" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Questions by Difficulty</h2>
            <BarChart data={diffData} />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Questions by Source</h2>
            <PieChart data={sourceData} />
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent batches */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Import Batches</h2>
            {recentBatches.length === 0 ? (
              <p className="text-sm text-slate-400">No batches yet.</p>
            ) : (
              <div className="space-y-2">
                {recentBatches.map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700 truncate max-w-[60%]">{b.title}</span>
                    {batchBadge(b.status)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent mock tests */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Mock Tests</h2>
            {recentTests.length === 0 ? (
              <p className="text-sm text-slate-400">No mock tests yet.</p>
            ) : (
              <div className="space-y-2">
                {recentTests.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-700 truncate max-w-[60%]">{t.title}</span>
                    {publishBadge(t.is_published)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
