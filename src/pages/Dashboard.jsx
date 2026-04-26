import { DashboardLayout } from '@/components/layout/_DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Target,
  Trophy,
  Video
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout active="dashboard">
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, Dr. {user?.fullName.split(' ')[0]}!</h1>
            <p className="text-slate-600">Here's an overview of your progress today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Questions Solved', value: '1,248', change: '+12%', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
              { label: 'Study Hours', value: '124h', change: '+4h', icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
              { label: 'Avg. Score', value: '76%', change: '+2.5%', icon: Target, color: 'text-green-600', bg: 'bg-green-100' },
              { label: 'Mock Rank', value: '#42', change: 'Top 5%', icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">{stat.change}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Continue Learning</h3>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
              <div className="space-y-4">
                {[
                  { title: "Cardiology: Heart Failure Management", type: "Video Lecture", progress: 75 },
                  { title: "Pediatrics: Immunization Schedule", type: "QBank Set", progress: 30 },
                  { title: "Emergency Medicine: Trauma Protocol", type: "Reading", progress: 100 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="mr-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-600 font-bold">{item.progress}%</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-sm text-slate-500">{item.type}</p>
                    </div>
                    <Button size="sm" variant="secondary">Resume</Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Schedule</h3>
              <div className="space-y-6">
                {[
                  { day: "Today", time: "14:00", title: "Mock Test: Paper 1", type: "Exam" },
                  { day: "Tomorrow", time: "10:00", title: "Live Cardiology Review", type: "Webinar" },
                  { day: "Wed, 12 Oct", time: "09:00", title: "Roleplay Session", type: "Practice" },
                ].map((event, idx) => (
                  <div key={idx} className="flex items-start">
                    <div className="mr-4 min-w-[60px]">
                      <p className="text-sm font-bold text-slate-900">{event.day}</p>
                      <p className="text-xs text-slate-500">{event.time}</p>
                    </div>
                    <div className="pb-6 border-l-2 border-brand-secondary/20 pl-4 relative last:border-0 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white bg-brand-secondary"></div>
                      <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{event.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};
  