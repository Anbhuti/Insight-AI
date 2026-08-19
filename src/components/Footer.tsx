import React from 'react';
import { Sparkles, Twitter, Github, Linkedin, Disc as Discord, Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-md pt-16 pb-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
          
          {/* Brand Info (2 cols on md) */}
          <div className="col-span-2 flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2 text-slate-900 group w-max">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                ✦ Insight<span className="text-indigo-600">AI</span>
              </span>
            </a>
            
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              AI-powered business intelligence for modern teams. Turn complex multi-series tables into instant root-cause explanations and decisions.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors text-slate-500"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors text-slate-500"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors text-slate-500"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center transition-colors text-slate-500"
                aria-label="Discord"
              >
                <Discord className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Column: Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Product
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <a href="#product" className="hover:text-indigo-600 transition-colors">AI Analyst Agent</a>
              <a href="#workflow" className="hover:text-indigo-600 transition-colors">Investigation Loop</a>
              <a href="#anomalies" className="hover:text-indigo-600 transition-colors">Anomaly Detection</a>
              <a href="#root-cause" className="hover:text-indigo-600 transition-colors">Root Cause Trees</a>
              <a href="#forecast" className="hover:text-indigo-600 transition-colors">Predictive Modeling</a>
            </div>
          </div>

          {/* Column: Solutions */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Solutions
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <a href="#use-cases" className="hover:text-indigo-600 transition-colors">Sales Intelligence</a>
              <a href="#use-cases" className="hover:text-indigo-600 transition-colors">Marketing Attribution</a>
              <a href="#use-cases" className="hover:text-indigo-600 transition-colors">Finance & Runways</a>
              <a href="#use-cases" className="hover:text-indigo-600 transition-colors">Supply Chain Ops</a>
              <a href="#use-cases" className="hover:text-indigo-600 transition-colors">Executive Dashboards</a>
            </div>
          </div>

          {/* Column: Company & Trust */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Trust & Access
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <a href="#security" className="hover:text-indigo-600 transition-colors">Data Privacy</a>
              <a href="#security" className="hover:text-indigo-600 transition-colors">Role-Based Access</a>
              <a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a>
              <a href="#pricing" className="hover:text-indigo-600 transition-colors">Early Access</a>
              <a href="mailto:support@insightai.demo" className="hover:text-indigo-600 transition-colors">Contact Team</a>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Status */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 InsightAI. All rights reserved.
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Normal • Phase 1 Landing Preview</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
