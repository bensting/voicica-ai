'use client';

interface PhoneMockupProps {
  children: React.ReactNode;
}

export default function PhoneMockup({ children }: PhoneMockupProps) {
  return (
    <div className="relative mx-auto w-[320px] sm:w-[360px]">
      {/* Phone outer frame */}
      <div className="relative rounded-[3rem] bg-gradient-to-b from-gray-200 via-white to-gray-300 p-3 shadow-2xl shadow-black/50">
        {/* Phone inner bezel */}
        <div className="relative overflow-hidden rounded-[2.5rem]">
          {/* Notch */}
          <div className="absolute left-1/2 top-0 z-20 h-7 w-32 -translate-x-1/2 rounded-b-2xl bg-black">
            {/* Camera */}
            <div className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-gray-800">
              <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-700" />
            </div>
          </div>

          {/* Screen content */}
          <div className="relative min-h-[580px] sm:min-h-[640px]">{children}</div>
        </div>
      </div>

      {/* Side buttons - Volume */}
      <div className="absolute -left-1 top-28 h-8 w-1 rounded-l-sm bg-gray-400" />
      <div className="absolute -left-1 top-40 h-12 w-1 rounded-l-sm bg-gray-400" />
      <div className="absolute -left-1 top-56 h-12 w-1 rounded-l-sm bg-gray-400" />

      {/* Side button - Power */}
      <div className="absolute -right-1 top-36 h-16 w-1 rounded-r-sm bg-gray-400" />
    </div>
  );
}
