import React from 'react';
import { BookOpen, Video, Users, Clock, Zap, Target } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-white" />,
      title: "Extensive QBank",
      description: "Access over 5,000 MCQ questions tailored to the latest AMC CAT blueprint. Each question comes with detailed explanations and references to Australian guidelines."
    },
    {
      icon: <Video className="w-6 h-6 text-white" />,
      title: "High-Yield Video Lectures",
      description: "Visual learners rejoice! Our library of high-quality video lectures covers complex topics in Internal Medicine, Surgery, Pediatrics, and more."
    },
    {
      icon: <Users className="w-6 h-6 text-white" />,
      title: "Clinical Roleplays",
      description: "Prepare for the Clinical exam with our interactive roleplay scenarios. Practice with peers or AI-powered patients to refine your communication skills."
    },
    {
      icon: <Clock className="w-6 h-6 text-white" />,
      title: "Smart Study Planner",
      description: "Input your exam date and available study hours, and our algorithm will generate a personalized study schedule to ensure you cover all topics on time."
    },
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics. Identify your weak areas and focus your efforts where they matter most."
    },
    {
      icon: <Target className="w-6 h-6 text-white" />,
      title: "Mock Exams",
      description: "Take full-length mock exams that simulate the real test environment. Get accustomed to the timing and pressure of the actual AMC exam."
    }
  ];

  return (
    <div className="pt-20">
       <div className="bg-gradient-brand py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-6">Platform Features</h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Everything you need to succeed, all in one place.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-violet rounded-xl flex items-center justify-center mb-6 shadow-md shadow-brand-blue/20">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
