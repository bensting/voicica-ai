/**
 * LoadingDots - 动态加载点动画
 * 用于数据加载中的占位显示
 */
export default function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex gap-[2px] ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </span>
  );
}