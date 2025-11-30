import Image from "next/image";

interface PageHeroProps {
  title: string;
  imageSrc: string;
  imageAlt?: string;
}

export default function PageHero({
  title,
  imageSrc,
  imageAlt = "Hero background",
}: PageHeroProps) {
  return (
    <section className="relative w-full h-[150px] sm:h-[200px] md:h-[280px] mt-16">
      {/* Background Image */}
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        className="object-cover object-center"
        priority
      />
      {/* Frosted Glass Overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/30 backdrop-blur-sm" />

      {/* Hero Content - centered title */}
      <h1
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 text-xl sm:text-2xl md:text-3xl font-bold text-white whitespace-nowrap"
      >
        {title}
      </h1>
    </section>
  );
}