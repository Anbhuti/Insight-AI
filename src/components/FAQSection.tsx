import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Sparkles } from 'lucide-react';
import { SectionHeading } from './SectionHeading';
import { FAQS } from '../data/mockData';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First FAQ open by default

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 lg:py-32 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <SectionHeading
          badge="Frequently Asked Questions"
          badgeIcon={<HelpCircle className="w-3.5 h-3.5" />}
          title={
            <>
              Everything you need to know about <br />
              <span className="text-indigo-600">InsightAI.</span>
            </>
          }
          subtitle="Explore common questions regarding connectors, anomaly detection, statistical attribution, and data governance."
          className="mb-14"
        />

        {/* Large White Rounded Accordion Container */}
        <div className="bg-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-slate-200/80 shadow-xl shadow-slate-200/50 flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-50/80 border-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    {faq.question}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
