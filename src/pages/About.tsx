import React from 'react';
import { Users, Award, Globe } from 'lucide-react';

export const About = () => {
  return (
    <div className="pt-20">
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">About AMC Catalyst</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            We are dedicated to helping international medical graduates succeed in Australia.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              At AMC Catalyst, our mission is to bridge the gap between international medical education and the Australian healthcare system. We believe that every qualified doctor deserves a fair chance to practice medicine in Australia.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Founded by a team of specialist doctors who have successfully navigated the AMC pathway themselves, we understand the challenges you face and have designed our curriculum to address them directly.
            </p>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1551847677-dc82d764e1eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" 
              alt="Team Meeting" 
              className="rounded-2xl shadow-xl"
            />
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="w-16 h-16 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Expert Faculty</h3>
            <p className="text-slate-600">Learn from consultants and registrars currently working in Australian hospitals.</p>
          </div>
          <div className="p-6">
            <div className="w-16 h-16 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Proven Track Record</h3>
            <p className="text-slate-600">Our students consistently achieve pass rates significantly higher than the national average.</p>
          </div>
          <div className="p-6">
            <div className="w-16 h-16 bg-brand-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Global Community</h3>
            <p className="text-slate-600">Join a vibrant community of doctors from over 50 countries preparing for the AMC.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
