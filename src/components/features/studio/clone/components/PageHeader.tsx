'use client';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description: string;
}

/**
 * Page Header Component
 *
 * Displays page title, subtitle and description in a styled card
 */
export default function PageHeader({
  title,
  subtitle,
  description,
}: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl px-4 py-5 lg:px-6 lg:py-6 border border-purple-100">
      <div className="flex flex-wrap items-baseline gap-2 mb-2">
        <h1 className="text-xl lg:text-2xl font-bold text-purple-600">
          {title}
        </h1>
        {subtitle && (
          <span className="text-base lg:text-lg font-semibold text-gray-900">
            {subtitle}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}