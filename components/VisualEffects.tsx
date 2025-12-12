
import React, { useRef, useState, useEffect, ReactNode, forwardRef } from 'react';

// Hook to track mouse globally for CSS variables
export const useGlobalMouse = () => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      // Set CSS variables on document root
      document.documentElement.style.setProperty('--mouse-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${y}px`);
      
      // Percentages for parallax
      const xPct = (x / window.innerWidth) - 0.5;
      const yPct = (y / window.innerHeight) - 0.5;
      document.documentElement.style.setProperty('--mouse-x-pct', `${xPct}`);
      document.documentElement.style.setProperty('--mouse-y-pct', `${yPct}`);
    };
    
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
};

// Hook for smooth mount/unmount transitions (Exit Animations)
export const useMountTransition = (isMounted: boolean, unmountDelay: number) => {
  const [hasTransitionedIn, setHasTransitionedIn] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isMounted && !shouldRender) {
      setShouldRender(true);
      // Small delay to ensure render happens before class change for animation
      setTimeout(() => setHasTransitionedIn(true), 10); 
    } else if (!isMounted && shouldRender) {
      setHasTransitionedIn(false);
      timeoutId = setTimeout(() => setShouldRender(false), unmountDelay);
    }

    return () => clearTimeout(timeoutId);
  }, [isMounted, unmountDelay, shouldRender]);

  return {
    shouldRender,
    transitionClasses: hasTransitionedIn 
      ? 'opacity-100 translate-y-0 scale-100' 
      : 'opacity-0 translate-y-4 scale-95'
  };
};

// 1. Interactive Background & 3. Parallax Effect (Simplified)
export const InteractiveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-50">
      {/* Dynamic Blobs */}
      <div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[120px] mix-blend-multiply animate-blob transition-transform duration-1000 ease-out will-change-transform"
        style={{ transform: 'translate(calc(var(--mouse-x-pct) * -40px), calc(var(--mouse-y-pct) * -40px))' }} 
      />
      <div 
        className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-100/30 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000 transition-transform duration-1000 ease-out will-change-transform"
        style={{ transform: 'translate(calc(var(--mouse-x-pct) * 40px), calc(var(--mouse-y-pct) * -40px))' }} 
      />
      <div 
        className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-blue-100/30 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000 transition-transform duration-1000 ease-out will-change-transform"
        style={{ transform: 'translate(calc(var(--mouse-x-pct) * -40px), calc(var(--mouse-y-pct) * 40px))' }} 
      />
      
      {/* Mesh/Noise texture overlay for texture (optional) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
    </div>
  );
};

// 2. Spotlight Effect / 6. Glow Gradient Following
export const SpotlightEffect: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-500 opacity-0 md:opacity-100"
      style={{
        background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.03), transparent 40%)`
      }}
    />
  );
};

// 5. Tilt Effect
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(({ children, className = '', intensity = 3 }, ref) => {
   const localRef = useRef<HTMLDivElement>(null);
   const [transform, setTransform] = useState('');
   const [shadow, setShadow] = useState('');

   // Combine refs
   useEffect(() => {
     if (typeof ref === 'function') {
       ref(localRef.current);
     } else if (ref) {
       (ref as React.MutableRefObject<HTMLDivElement | null>).current = localRef.current;
     }
   }, [ref]);

   const handleMouseMove = (e: React.MouseEvent) => {
      if (!localRef.current) return;
      
      const rect = localRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate rotation based on cursor position relative to center
      const rotateX = ((y - centerY) / centerY) * -intensity; 
      const rotateY = ((x - centerX) / centerX) * intensity;

      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`);
      
      // Dynamic shadow based on tilt
      const shadowX = (centerX - x) / 30;
      const shadowY = (centerY - y) / 30;
      setShadow(`${shadowX}px ${shadowY}px 30px rgba(0,0,0,0.08), 0 10px 40px rgba(0,0,0,0.05)`);
   };

   const handleMouseLeave = () => {
      setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
      setShadow('');
   };

   return (
     <div 
       ref={localRef}
       className={`transition-all duration-300 ease-out transform-gpu will-change-transform ${className}`}
       onMouseMove={handleMouseMove}
       onMouseLeave={handleMouseLeave}
       style={{ 
         transform, 
         boxShadow: shadow || undefined 
       }}
     >
       {/* Reflection / Sheen effect */}
       <div 
         className="absolute inset-0 rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
         style={{
            background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 40%, transparent 60%)',
            mixBlendMode: 'overlay',
         }}
       />
       {children}
     </div>
   );
});

TiltCard.displayName = 'TiltCard';
