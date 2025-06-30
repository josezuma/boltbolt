import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  secondaryCta?: string;
  secondaryCtaLink?: string;
  imageUrl: string;
  position?: 'left' | 'center' | 'right';
  textColor?: 'light' | 'dark';
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Summer Collection 2025",
    subtitle: "Discover our latest arrivals for the season",
    cta: "Shop Now",
    ctaLink: "/products",
    secondaryCta: "Learn More",
    secondaryCtaLink: "/about",
    imageUrl: "https://images.pexels.com/photos/5868722/pexels-photo-5868722.jpeg?auto=compress&cs=tinysrgb&w=1600",
    position: "left",
    textColor: "light"
  },
  {
    id: 2,
    title: "Premium Essentials",
    subtitle: "Timeless pieces crafted with exceptional quality",
    cta: "Explore Collection",
    ctaLink: "/products?category=essentials",
    imageUrl: "https://images.pexels.com/photos/5709665/pexels-photo-5709665.jpeg?auto=compress&cs=tinysrgb&w=1600",
    position: "center",
    textColor: "light"
  },
  {
    id: 3,
    title: "Sustainable Fashion",
    subtitle: "Eco-friendly materials, ethically produced",
    cta: "Shop Sustainable",
    ctaLink: "/products?tag=sustainable",
    imageUrl: "https://images.pexels.com/photos/6567607/pexels-photo-6567607.jpeg?auto=compress&cs=tinysrgb&w=1600",
    position: "right",
    textColor: "light"
  }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentSlide]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      nextSlide();
    }

    if (touchStart - touchEnd < -150) {
      prevSlide();
    }
  };

  const getTextPosition = (position: 'left' | 'center' | 'right' = 'left') => {
    switch (position) {
      case 'left':
        return 'items-start text-left';
      case 'center':
        return 'items-center text-center';
      case 'right':
        return 'items-end text-right';
      default:
        return 'items-start text-left';
    }
  };

  const getTextColor = (color: 'light' | 'dark' = 'light') => {
    return color === 'light' ? 'text-white' : 'text-gray-900';
  };

  return (
    <section 
      className="relative w-full h-[70vh] md:h-[80vh] lg:h-[90vh] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-30"></div>
          </div>

          {/* Content */}
          <div className="container-editorial relative z-10 h-full flex flex-col justify-center">
            <div className={`max-w-2xl space-y-6 ${getTextPosition(slide.position)}`}>
              <h1 
                className={`text-editorial-hero ${getTextColor(slide.textColor)} animate-fade-in-up`}
                style={{ animationDelay: '0.2s' }}
              >
                {slide.title}
              </h1>
              <p 
                className={`text-xl md:text-2xl ${getTextColor(slide.textColor)} opacity-90 animate-fade-in-up`}
                style={{ animationDelay: '0.4s' }}
              >
                {slide.subtitle}
              </p>
              <div 
                className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
                style={{ animationDelay: '0.6s' }}
              >
                <Button asChild className="btn-editorial-primary">
                  <Link to={slide.ctaLink}>
                    {slide.cta}
                  </Link>
                </Button>
                {slide.secondaryCta && (
                  <Button asChild className="btn-editorial-secondary">
                    <Link to={slide.secondaryCtaLink || '#'}>
                      {slide.secondaryCta}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors duration-300"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}