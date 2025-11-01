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
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 lg:p-8 border border-purple-100">
      <div className="flex flex-wrap items-baseline gap-2 mb-3">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          {title}
        </h1>
        {subtitle && (
          <span className="text-lg lg:text-xl font-semibold text-purple-600">
            {subtitle}
          </span>
        )}
      </div>
      <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
        {description}
      </p>
    </div>
  );
}