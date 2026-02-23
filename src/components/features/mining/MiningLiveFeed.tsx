'use client';

/**
 * Mining LiveFeed — 紧凑实时数据滚动
 * 固定高度小卡片，CSS 竖向无缝循环
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

function FeedItem({ user, action }: { user: string; action: string }) {
  return (
    <div className="px-3 py-1 text-[11px] text-gray-500">
      User {user} {action}
    </div>
  );
}

export default function MiningLiveFeed() {
  return (
    <section className="bg-[#06060f] px-4 pb-6">
      <div className="mx-auto max-w-md">
        <div className="overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.02]" style={{ height: '72px' }}>
          <div className="animate-feed-scroll">
            {FEED_DATA.map((item, i) => (
              <FeedItem key={`a-${i}`} user={item.user} action={item.action} />
            ))}
            {FEED_DATA.map((item, i) => (
              <FeedItem key={`b-${i}`} user={item.user} action={item.action} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
