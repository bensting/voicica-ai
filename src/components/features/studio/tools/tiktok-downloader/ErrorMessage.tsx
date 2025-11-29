/**
 * Error Message Component
 *
 * 错误提示组件
 */

interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-3 lg:p-4 bg-red-50 border border-red-200 rounded-xl">
      <p className="text-red-600 text-sm lg:text-base">{message}</p>
    </div>
  );
}