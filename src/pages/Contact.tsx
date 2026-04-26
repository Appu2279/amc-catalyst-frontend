import React from 'react';
import { Button } from '@/components/ui/Button';
import { Mail, MapPin, Phone } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="pt-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Get in Touch</h1>
          <p className="text-xl text-slate-600">Have questions? We're here to help you.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-secondary/10 p-3 rounded-lg">
                    <Mail className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Email</p>
                    <p className="text-slate-600">support@amccatalyst.com</p>
                    <p className="text-slate-600">sales@amccatalyst.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-secondary/10 p-3 rounded-lg">
                    <Phone className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Phone</p>
                    <p className="text-slate-600">+61 2 1234 5678</p>
                    <p className="text-slate-500 text-sm">Mon-Fri 9am-5pm AEST</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-secondary/10 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Office</p>
                    <p className="text-slate-600">123 Medical Plaza</p>
                    <p className="text-slate-600">Sydney NSW 2000, Australia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Send us a message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input type="text" id="firstName" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition-all" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input type="text" id="lastName" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition-all" />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" id="email" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition-all" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea id="message" rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition-all"></textarea>
              </div>
              <Button type="submit" className="w-full">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
