import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="p-2 bg-gradient-to-br from-brand-blue to-brand-violet rounded-lg group-hover:shadow-lg transition-all duration-300">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
                AMC CATALYST
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              Empowering medical professionals with the best resources to ace their AMC exams. Your journey to success starts here.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-brand-accent transition-colors">About Us</Link></li>
              <li><Link to="/features" className="hover:text-brand-accent transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="hover:text-brand-accent transition-colors">Pricing</Link></li>
              <li><Link to="/contact" className="hover:text-brand-accent transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-brand-accent transition-colors">Study Guides</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Webinars</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-brand-accent transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-lg">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-secondary shrink-0" />
                <span>123 Medical Plaza, Sydney NSW 2000, Australia</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-brand-secondary shrink-0" />
                <span>+61 2 1234 5678</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-brand-secondary shrink-0" />
                <span>support@amccatalyst.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AMC Catalyst. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
