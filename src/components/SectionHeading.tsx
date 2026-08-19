import React from 'react';

interface SectionHeadingProps {
  badge?: string;
  badgeIcon?: React.ReactNode;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  centered?: boolean;
  className?: string;
  id?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  badge,
  badgeIcon,
  title,
  subtitle,
  centered = true,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`max-w-3xl ${centered ? 'mx-auto text-center' : 'text-left'} ${className}`}
    >
      {badge && (
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4 ${
          centered ? 'mx-auto' : ''
        } bg-indigo-50/80 text-indigo-700 border border-indigo-100/80 shadow-xs`}>
          {badgeIcon && <span className="text-indigo-600">{badgeIcon}</span>}
          <span>{badge}</span>
        </div>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.15]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
