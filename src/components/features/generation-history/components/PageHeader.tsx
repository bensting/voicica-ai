interface PageHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Page header component
 * Displays title and subtitle for the generation history page
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-600">{subtitle}</p>
    </div>
  );
}