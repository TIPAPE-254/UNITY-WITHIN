import React, { useState, ReactElement } from 'react';
import { Eye, Headphones, Hand, Flower, Coffee, CheckCircle2, ChevronRight, RotateCcw, Zap, Sparkles } from 'lucide-react';
import { Button } from './Button';
import { useUser } from '../contexts/UserContext';
import { ViewState } from '../types';

const STEPS = [
  {
    count: 5,
    title: 'Things you see',
    desc: 'Take a slow breath and look around. Acknowledge 5 things you can see.',
    icon: <Eye className="text-blue-500" />,
    placeholder: 'e.g. A blue book, a tree out the window...',
    color: 'bg-blue-50',
    borderColor: 'border-blue-100',
    iconBg: 'bg-blue-100'
  },
  {
    count: 4,
    title: 'Things you can touch',
    desc: 'Notice the sensation of your body against your seat or your feet on the floor. Acknowledge 4 things you can touch.',
    icon: <Hand className="text-orange-500" />,
    placeholder: 'e.g. My soft sweater, the cool table surface...',
    color: 'bg-orange-50',
    borderColor: 'border-orange-100',
    iconBg: 'bg-orange-100'
  },
  {
    count: 3,
    title: 'Things you hear',
    desc: 'Listen to the environment around you. Acknowledge 3 things you can hear.',
    icon: <Headphones className="text-indigo-500" />,
    placeholder: 'e.g. The hum of the fridge, distant traffic...',
    color: 'bg-indigo-50',
    borderColor: 'border-indigo-100',
    iconBg: 'bg-indigo-100'
  },
  {
    count: 2,
    title: 'Things you can smell',
    desc: 'Inhale deeply. Acknowledge 2 things you can smell (or your 2 favorite smells).',
    icon: <Flower className="text-pink-500" />,
    placeholder: 'e.g. The scent of rain, fresh coffee...',
    color: 'bg-pink-50',
    borderColor: 'border-pink-100',
    iconBg: 'bg-pink-100'
  },
  {
    count: 1,
    title: 'Thing you can taste',
    desc: 'Focus on your mouth. Acknowledge 1 thing you can taste or your favorite taste.',
    icon: <Coffee className="text-teal-500" />,
    placeholder: 'e.g. The minty aftertaste of toothpaste...',
    color: 'bg-teal-50',
    borderColor: 'border-teal-100',
    iconBg: 'bg-teal-100'
  }
];

interface GroundingProps {
  onNavigate?: (view: ViewState) => void;
}

export const Grounding: React.FC<GroundingProps> = ({ onNavigate }) => {
  const { logToolUse } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [inputs, setInputs] = useState<string[][]>(Array(5).fill([]).map((_, i) => Array(STEPS[i].count).fill('')));
  const [isFinished, setIsFinished] = useState(false);

  const handleInputChange = (stepIndex: number, inputIndex: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[stepIndex][inputIndex] = value;
    setInputs(newInputs);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsFinished(true);
      logToolUse('grounding');
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setInputs(Array(5).fill([]).map((_, i) => Array(STEPS[i].count).fill('')));
    setIsFinished(false);
  };

  const step = STEPS[currentStep];
  const progress = ((currentStep + (isFinished ? 1 : 0)) / STEPS.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
      <header className="text-center space-y-2">
         <h1 className="text-4xl font-black text-gray-900 tracking-tight">5-4-3-2-1 <span className="text-teal-500">Grounding</span></h1>
         <p className="text-gray-500 font-medium">Coming back to the present moment, one sense at a time.</p>
      </header>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
         <div 
          className="h-full bg-teal-500 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
         />
      </div>

      {!isFinished ? (
        <div 
          key={currentStep}
          className={`${step.color} border ${step.borderColor} rounded-[40px] p-8 md:p-12 shadow-sm animate-in slide-in-from-right-8 duration-500`}
        >
          <div className="flex flex-col md:flex-row gap-8 items-start">
             <div className={`w-20 h-20 rounded-3xl ${step.iconBg} flex items-center justify-center flex-shrink-0 animate-bounce [animation-duration:3s]`}>
                {React.cloneElement(step.icon as ReactElement<any>, { size: 40 })}
             </div>
             <div className="space-y-6 flex-1 w-full">
                <div>
                   <span className="text-teal-600 font-black text-5xl opacity-40">{step.count}</span>
                   <h2 className="text-3xl font-black text-gray-900 mt-2">{step.title}</h2>
                   <p className="text-gray-600 mt-2 font-medium leading-relaxed">{step.desc}</p>
                </div>

                <div className="space-y-3">
                   {inputs[currentStep].map((val, idx) => (
                      <input 
                        key={idx}
                        value={val}
                        onChange={(e) => handleInputChange(currentStep, idx, e.target.value)}
                        placeholder={step.placeholder}
                        className="w-full bg-white/80 backdrop-blur-sm border border-white rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all font-medium placeholder:text-gray-300"
                      />
                   ))}
                </div>

                <div className="flex justify-end pt-4">
                   <Button 
                    onClick={nextStep}
                    className="rounded-2xl px-10 h-14 font-black shadow-teal-100 shadow-xl bg-teal-500 hover:bg-teal-600"
                   >
                     {currentStep === STEPS.length - 1 ? 'Finish Exercise' : 'Next Sense'} <ChevronRight size={20} className="ml-2" />
                   </Button>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-teal-100 rounded-[40px] p-12 text-center shadow-xl animate-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center text-teal-500 mx-auto mb-8 shadow-inner">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Well Done.</h2>
           <p className="text-gray-500 max-w-md mx-auto mb-8 font-medium leading-relaxed">
             You've successfully grounded yourself in the present moment. Notice how you feel now compared to when you started.
           </p>
           
           <div className="bg-teal-50 rounded-[32px] p-8 mb-8 flex flex-col md:flex-row items-center gap-6 text-left">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-teal-500 shadow-sm">
                 <Zap size={32} />
              </div>
              <div>
                 <p className="text-teal-600 font-black uppercase text-xs tracking-widest mb-1">XP Earned</p>
                 <p className="text-2xl font-black text-gray-900">+50 Grounding XP</p>
              </div>
              <div className="ml-auto">
                 <Sparkles className="text-teal-300" size={40} />
              </div>
           </div>

           <div className="flex gap-4 justify-center">
              <Button onClick={reset} variant="secondary" className="rounded-2xl px-8 h-12 border-teal-100 text-teal-600">
                 <RotateCcw size={18} className="mr-2" /> Try again
              </Button>
              <Button onClick={() => onNavigate?.('wellness')} className="rounded-2xl px-8 h-12 bg-teal-500 hover:bg-teal-600">
                 Return to Toolkit
              </Button>
           </div>
        </div>
      )}

      {/* Why it works */}
      <footer className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
         <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Info size={18} className="text-teal-500" /> Why this works
         </h4>
         <p className="text-sm text-gray-500 leading-relaxed italic">
           Grounding exercises like 5-4-3-2-1 work by pulling your focus away from anxious thoughts and back into your physical environment. This neurological "override" helps deactivate the amygdala (the brain's fear center) and can lower your heart rate and cortisol levels.
         </p>
      </footer>
    </div>
  );
};

const Info = ({ size, className }: { size: number; className: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);
