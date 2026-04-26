import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const Pricing = () => {
  const plans = [
    {
      name: "Basic",
      price: "$99",
      duration: "/month",
      features: [
        "Access to 2,000+ QBank questions",
        "Basic performance analytics",
        "Community forum access",
        "Mobile app access"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "$199",
      duration: "/3 months",
      features: [
        "Access to all 5,000+ QBank questions",
        "Full video lecture library",
        "Advanced performance analytics",
        "Study planner tool",
        "Priority support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Premium",
      price: "$499",
      duration: "/6 months",
      features: [
        "Everything in Pro",
        "5 Full-length Mock Exams",
        "1-on-1 Mentorship Session (1 hr)",
        "Clinical Roleplay Scenarios",
        "Essay grading"
      ],
      cta: "Go Premium",
      popular: false
    }
  ];

  return (
    <div className="pt-20 bg-slate-50 min-h-screen">
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-slate-600">Invest in your future medical career.</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative bg-white rounded-2xl shadow-xl overflow-hidden border ${plan.popular ? 'border-brand-gold ring-2 ring-brand-gold ring-opacity-50 transform scale-105 z-10' : 'border-slate-100'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-brand-gold text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                  POPULAR
                </div>
              )}
              <div className="p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500 ml-2">{plan.duration}</span>
                </div>
                <p className="text-slate-600 mb-6 text-sm">Perfect for those just starting their preparation.</p>
                <Button 
                  className="w-full mb-8" 
                  variant={plan.popular ? 'gold' : 'outline'}
                >
                  {plan.cta}
                </Button>
                <div className="space-y-4">
                  {plan.features.map((feature, fIdx) => (
                    <div key={fIdx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 shrink-0" />
                      <span className="text-slate-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
