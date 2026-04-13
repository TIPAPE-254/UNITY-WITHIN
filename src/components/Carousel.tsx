import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Zap, Wind, Heart, Brain, Star, Shield } from 'lucide-react';

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const carouselItems: CarouselItem[] = [
  {
    id: 'grounding',
    title: '5-4-3-2-1 Grounding',
    description: 'Connect with your senses to return to the present moment. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.',
    icon: <Zap size={32} className="text-white" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-br from-pink-400 to-pink-600'
  },
  {
    id: 'breathing',
    title: 'Box Breathing',
    description: 'A powerful 4-4-4-4 breathing technique that promotes calm and mental clarity. Inhale for 4, hold for 4, exhale for 4, hold for 4.',
    icon: <Wind size={32} className="text-white" />,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600'
  },
  {
    id: 'compassion',
    title: 'Self-Compassion Scripts',
    description: 'Kind words and affirmations for difficult moments. Treat yourself with the same kindness you would offer a dear friend.',
    icon: <Heart size={32} className="text-white" />,
    color: 'text-green-600',
    bgColor: 'bg-gradient-to-br from-green-400 to-green-600'
  },
  {
    id: 'reframing',
    title: 'Thought Reframing',
    description: 'Challenge negative thoughts and find balanced perspectives. Replace "I can\'t do this" with "This is challenging, but I\'m learning."',
    icon: <Brain size={32} className="text-white" />,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600'
  },
  {
    id: 'emotion',
    title: 'Emotion Naming',
    description: 'Identify and understand your feelings with gentle guidance. Naming emotions helps us process and move through them.',
    icon: <Star size={32} className="text-white" />,
    color: 'text-yellow-600',
    bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600'
  },
  {
    id: 'stabilization',
    title: 'Panic Stabilization',
    description: 'Quick techniques to regain control during intense moments. Ground yourself and remember: this feeling will pass.',
    icon: <Shield size={32} className="text-white" />,
    color: 'text-indigo-600',
    bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600'
  }
];

export const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);



  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? carouselItems.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === carouselItems.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl border border-gray-100">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {carouselItems.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0">
              <div className="relative h-96 md:h-80 flex items-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-unity-200"></div>
                  <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full bg-unity-300"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-unity-100"></div>
                </div>

                <div className="relative z-10 flex items-center w-full px-8 md:px-12">
                  <div className="flex-1 text-center md:text-left">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${item.bgColor} mb-6 mx-auto md:mx-0`}>
                      {item.icon}
                    </div>
                    <h3 className={`text-3xl md:text-4xl font-bold mb-4 ${item.color}`}>
                      {item.title}
                    </h3>
                    <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Visual Element */}
                  <div className="hidden md:flex flex-1 justify-center items-center">
                    <div className={`w-48 h-48 rounded-full ${item.bgColor} opacity-20 flex items-center justify-center`}>
                      <div className="text-white opacity-30">
                        {item.icon}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} className="text-gray-600" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105"
        aria-label="Next slide"
      >
        <ChevronRight size={24} className="text-gray-600" />
      </button>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-unity-500 scale-125'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
