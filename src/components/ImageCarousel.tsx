import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageItem {
  id: string;
  url: string;
  alt: string;
}

const imageQueries = [
  'nature,peaceful',
  'meditation,calm',
  'mindfulness,serenity',
  'wellness,healing',
  'tranquility,nature',
  'zen,garden',
  'yoga,relaxation',
  'mindfulness,forest'
];

export const ImageCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    // Generate image URLs from Unsplash
    const generatedImages: ImageItem[] = imageQueries.map((query, index) => ({
      id: `image-${index}`,
      url: `https://source.unsplash.com/random/1200x800?${query}`,
      alt: `Wellness image ${index + 1}`
    }));
    setImages(generatedImages);
  }, []);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-unity-100 to-unity-200 animate-pulse"></div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background Images */}
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-30' : 'opacity-0'
          }`}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/40"></div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 z-10"
        aria-label="Previous image"
      >
        <ChevronLeft size={24} className="text-gray-600" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 z-10"
        aria-label="Next image"
      >
        <ChevronRight size={24} className="text-gray-600" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-unity-500 scale-125'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
