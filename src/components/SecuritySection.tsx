import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  FileCheck2, 
  UserCheck, 
  KeyRound, 
  Sparkles,
  EyeOff,
  History
} from 'lucide-react';
import { SectionHeading } from './SectionHeading';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      id: 'rbac',
      title: 'Role-Based Access',
      description: 'Only authorized users can access sensitive information with granular team-level and department permissions.',
      icon: Lock,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      id: 'analytics',
      title: 'Secure Analytics',
      description: 'Analytics workflows are designed around strictly controlled data access with read-only database connections.',
      icon: ShieldCheck,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'audit',
      title: 'Auditability',
      description: 'Important agent activities, data reads, and generated queries are transparently tracked and loggable.',
      icon: History,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      id: 'human',
      title: 'Human Approval',
      description: 'High-impact actions, automated notifications, and shared executive briefs can require explicit human confirmation.',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  return (
    <section id="security" className="py-20 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Enterprise Data Privacy & Governance"
          badgeIcon={<ShieldCheck className="w-3.5 h-3.5" />}
          title={
            <>
              Built for <br />
              <span className="text-indigo-600">business data.</span>
            </>
          }
          subtitle="InsightAI treats enterprise privacy as a core foundational pillar. Protect proprietary numbers with rigorous access controls and human-in-the-loop oversight."
          className="mb-14"
        />

        {/* 4 Premium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {securityFeatures.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-white rounded-[28px] p-7 border border-slate-200/80 shadow-lg shadow-slate-200/40 flex flex-col justify-between gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border shadow-xs transition-transform group-hover:scale-105 ${item.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Enterprise Ready</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reassurance Banner */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <EyeOff className="w-4 h-4 text-indigo-600" />
            <span>Zero training on customer business data. Your private metrics stay strictly isolated within your organization.</span>
          </div>
          <span className="font-bold text-slate-700">Strict Read-Only Scopes</span>
        </div>

      </div>
    </section>
  );
};
