
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  isOpen: boolean;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ steps, onComplete, onSkip, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCalculated, setIsCalculated] = useState(false);

  // Calculate position of the target element
  const updatePosition = () => {
    if (!isOpen) return;
    
    // Special case for centered intro step (if targetId is empty or specific keyword)
    if (steps[currentStep].targetId === 'center') {
      setTargetRect(null);
      setIsCalculated(true);
      return;
    }

    const element = document.getElementById(steps[currentStep].targetId);
    if (element) {
      // Scroll element into view with padding
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Get rect after a small delay to allow scroll to finish/settle
      setTimeout(() => {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        setIsCalculated(true);
      }, 400);
    } else {
      // If target not found, skip to next or fallback
      console.warn(`Tour target ${steps[currentStep].targetId} not found`);
      // Optionally auto-advance if not found, but for now lets just center
      setTargetRect(null); 
      setIsCalculated(true);
    }
  };

  useLayoutEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsCalculated(false);
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      
      {/* SPOTLIGHT EFFECT (Only if we have a target) */}
      {targetRect && (
        <div 
          className="absolute transition-all duration-500 ease-in-out pointer-events-auto shadow-[0_0_0_9999px_rgba(15,23,42,0.85)] rounded-xl border-2 border-indigo-500/50"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* FULL SCREEN OVERLAY (If no target / Center mode) */}
      {!targetRect && (
        <div className="absolute inset-0 bg-slate-900/85 pointer-events-auto transition-opacity duration-500" />
      )}

      {/* CARD CONTENT */}
      <div 
        className={`fixed pointer-events-auto transition-all duration-500 ease-out flex flex-col items-center justify-center
          ${!targetRect ? 'inset-0' : ''} 
        `}
        style={targetRect ? {
           // Simple positioning logic: if target is in top half, show card below, else above
           top: targetRect.top > window.innerHeight / 2 ? 'auto' : targetRect.bottom + 24,
           bottom: targetRect.top > window.innerHeight / 2 ? window.innerHeight - targetRect.top + 24 : 'auto',
           left: 0,
           right: 0,
           margin: '0 auto',
           maxWidth: '400px',
           padding: '0 1rem'
        } : {}}
      >
        <div className={`
          bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 max-w-md w-full relative overflow-hidden
          ${!isCalculated && targetRect ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
          transition-all duration-300
        `}>
          {/* Decorative background blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
               <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                 Passo {currentStep + 1} de {steps.length}
               </span>
               <button 
                onClick={onSkip}
                className="text-slate-400 hover:text-slate-600 p-1"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{step.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                 {steps.map((_, idx) => (
                   <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}
                   />
                 ))}
              </div>

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-indigo-200 group"
              >
                {isLastStep ? 'Começar' : 'Próximo'}
                {isLastStep ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OnboardingTour;
