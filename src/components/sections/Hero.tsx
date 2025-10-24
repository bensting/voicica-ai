interface ActionButton {
  text: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface HeroProps {
  brandName?: string;
  title: string;
  highlight: string;
  description: string;
  actionButtons: ActionButton[];
  backgroundVideo?: string;
  backgroundImage?: string;
}

/**
 * Hero 主视觉区组件
 *
 * 带视频/图片背景的大型 Hero 区域，支持多个 CTA 按钮
 */
export default function Hero({
  brandName = 'AI Voice Labs',
  title,
  highlight,
  description,
  actionButtons,
  backgroundVideo,
  backgroundImage,
}: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video or Image */}
      {backgroundVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      ) : backgroundImage ? (
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900" />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
        {/* Brand Name */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            {brandName}{' '}
            <span className="inline-flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                AI
              </span>
              <sup className="text-xs text-white/70 ml-1">®</sup>
            </span>
          </h2>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          {title}{' '}
          <span className="inline-block relative overflow-hidden">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 animate-text-reveal">
              {highlight}
            </span>
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto mb-12 leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          {actionButtons.map((button, index) => (
            <button
              key={index}
              onClick={button.onClick}
              className="group relative w-full sm:w-auto min-w-[280px] px-8 py-5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center justify-center gap-3"
            >
              <span>{button.text}</span>
              {button.icon && (
                <span className="transition-transform group-hover:translate-x-1">
                  {button.icon}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}