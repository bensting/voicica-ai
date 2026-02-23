'use client';

/**
 * Mining LiveFeed — 实时数据滚动
 * 深色半透明卡片，CSS 竖向无限滚动（clone 一份实现无缝循环）
 */

const FEED_DATA = [
  { user: 'PH**77', action: 'earned 500 Credits' },
  { user: 'TH**09', action: 'withdrawn 100 THB' },
  { user: 'ID**55', action: 'activated Pro Node' },
  { user: 'VN**82', action: 'earned 1,200 Credits' },
  { user: 'MY**31', action: 'withdrawn 50 MYR' },
  { user: 'TH**44', action: 'earned 800 Credits' },
  { user: 'PH**19', action: 'activated Pro Node' },
  { user: 'ID**67', action: 'withdrawn 200,000 IDR' },
  { user: 'VN**03', action: 'earned 350 Credits' },
  { user: 'TH**88', action: 'activated Pro Node' },
  { user: 'MY**45', action: 'earned 900 Credits' },
  { user: 'PH**62', action: 'withdrawn 500 PHP' },
  { user: 'ID**28', action: 'earned 1,500 Credits' },
  { user: 'VN**91', action: 'activated Pro Node' },
  { user: 'TH**16', action: 'withdrawn 300 THB' },
  { user: 'PH**53', action: 'earned 650 Credits' },
  { user: 'MY**74', action: 'activated Pro Node' },
  { user: 'ID**40', action: 'earned 2,000 Credits' },
];

/* 随机 emoji 指示器 */
const indicators = ['🟢', '💰', '⚡'];

function FeedItem({ user, action, index }: { user: string; action: string; index: number }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2 text-sm">
      <span>{indicators[index % indicators.length]}</span>
      <span className="font-medium text-gray-300">User {user}</span>
      <span className="text-gray-500">{action}</span>
    </div>
  );
}

export default function MiningLiveFeed() {
  return (
    <section className="bg-[#06060f] px-4 pb-16">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm" style={{ height: '180px' }}>
          {/* 滚动容器：列表 clone 一份实现无缝循环 */}
          <div className="animate-feed-scroll">
            {/* 原始列表 */}
            {FEED_DATA.map((item, i) => (
              <FeedItem key={`a-${i}`} user={item.user} action={item.action} index={i} />
            ))}
            {/* Clone 列表 */}
            {FEED_DATA.map((item, i) => (
              <FeedItem key={`b-${i}`} user={item.user} action={item.action} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
