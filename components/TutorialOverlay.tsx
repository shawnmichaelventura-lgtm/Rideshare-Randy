
import React, { useState } from 'react';
import { Driver } from '../types';
import { DriverAvatar } from '../constants';
import { playClickSound } from '../services/soundEffects';

interface TutorialOverlayProps {
  onComplete: () => void;
  randy: Driver;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, randy }) => {
  const [step, setStep] = useState(0);

  // Use the shared DriverAvatar component to match the Home screen exactly
  const RandyVisual = (
    <div className="w-32 h-32 mx-auto my-4 animate-bounce">
       <DriverAvatar 
          color={randy.imageColor} 
          src={randy.avatarBase64} 
          className="w-full h-full border-4 border-black shadow-[0_8px_0_rgba(0,0,0,0.5)]" 
       />
    </div>
  );

  const steps = [
    {
      title: "WELCOME TO THE HUSTLE",
      content: "You are Rideshare Randy. Fueled by cheap gas station coffee and pure grit, you're ready to take on the gig economy. It ain't pretty, but it pays.",
      icon: RandyVisual
    },
    {
      title: "HOW TO EARN",
      content: "In the game, TAP your driver's face as fast as you can to pick up passengers. Watch out for DECOY drivers—tapping them costs you money!",
      icon: <div className="text-6xl">👆</div>
    },
    {
      title: "MANAGE STATS",
      content: "Keep an eye on your bars at the top. If you run out of GAS or fall asleep (SLEEP), you can't work.",
      icon: <div className="text-6xl">⛽</div>
    },
    {
      title: "STAY ALIVE",
      content: "Visit the REST STOP to buy Gas, Coffee, and Food. If you're broke, you're stuck.",
      icon: <div className="text-6xl">☕</div>
    },
    {
      title: "UPGRADE",
      content: "Save up cash to unlock better drivers like Skyler and Samalie. Better drivers earn cash faster and have special perks.",
      icon: <div className="text-6xl">😎</div>
    }
  ];

  const handleNext = () => {
    playClickSound();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-pop-in">
      <div className="bg-slate-800 border-4 border-taxi-yellow rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-3 h-3 rounded-full transition-colors ${idx === step ? 'bg-taxi-yellow' : 'bg-slate-600'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center min-h-[220px] flex flex-col items-center justify-center">
          <div className="mb-4">{steps[step].icon}</div>
          <h2 className="text-3xl font-display text-white mb-4 tracking-wide uppercase">
            {steps[step].title}
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            {steps[step].content}
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-700 flex justify-between items-center">
           <button 
             onClick={() => { onComplete(); playClickSound(); }}
             className="text-slate-500 text-xs uppercase font-bold hover:text-white transition-colors"
           >
             Skip
           </button>
           
           <button 
             onClick={handleNext}
             className="bg-taxi-yellow text-black font-display text-xl px-6 py-2 rounded hover:bg-yellow-400 transition-colors shadow-lg active:translate-y-1 active:shadow-none"
           >
             {step === steps.length - 1 ? "LET'S DRIVE!" : "NEXT →"}
           </button>
        </div>
      </div>
    </div>
  );
};
