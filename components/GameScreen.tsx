
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Driver, Environment, GameState, Passenger, Obstacle, Decision } from '../types';
import { DriverAvatar, PASSENGERS, OBSTACLES, DECISIONS, GAMEPLAY_QUOTES } from '../constants';
import { playSpeech } from '../services/audioPlayer';
import { generateCartoonAsset, getPassengerPrompt, getObstaclePrompt } from '../services/assetGenerator';
import { playClickSound, playBackSound } from '../services/soundEffects';

interface GameScreenProps {
  currentDriver: Driver;
  allDrivers: Driver[];
  environment: Environment;
  bgImage?: string;
  onEndShift: (score: number, cashPenalty: number, statsConsumed: Partial<GameState>, cancellationFee?: number, passengerId?: string) => void;
  gameState: GameState;
  lastPassengerId: string | null;
  cachedPassengerImages: Record<string, string>;
}

interface Target {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  driverId?: string;
  passengerId?: string;
  isDecoy: boolean;
  type: 'DRIVER' | 'PASSENGER';
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface SpeechBubble {
  id: number;
  x: number;
  y: number;
  text: string;
  avatar?: string;
  imageColor: string;
}

const playDecoySound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
};

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

const playBonusSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(1500, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {}
};

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.setValueAtTime(400, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {}
};

const playAlertSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};

let globalLastDecisionId: string | null = null;

export const GameScreen: React.FC<GameScreenProps> = ({ currentDriver, allDrivers, environment, bgImage, onEndShift, gameState, lastPassengerId, cachedPassengerImages }) => {
  const [gamePhase, setGamePhase] = useState<'BRIEFING' | 'PLAYING' | 'DECISION'>('BRIEFING');
  const [currentPassenger, setCurrentPassenger] = useState<Passenger | null>(null);
  const [currentObstacle, setCurrentObstacle] = useState<Obstacle | null>(null);
  const [currentDecision, setCurrentDecision] = useState<Decision | null>(null);
  const [passengerImage, setPassengerImage] = useState<string | null>(null);
  
  const [timeLeft, setTimeLeft] = useState(15);
  const [decisionTime, setDecisionTime] = useState(8);
  const [score, setScore] = useState(0);
  const [cashPenalty, setCashPenalty] = useState(0);
  const [bonusCash, setBonusCash] = useState(0);
  const [targets, setTargets] = useState<Target[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [shake, setShake] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const textIdCounter = useRef(0);
  const statsUsed = useRef({ gas: 0, energy: 0 });
  const hasTriggeredDecision = useRef(false);
  const usedQuotes = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newDifficulty = Math.max(1, Math.floor(score / 40) + 1);
    setDifficulty(newDifficulty);
  }, [score]);

  useEffect(() => {
    if (gamePhase === 'BRIEFING') {
      const roll = Math.random();
      setDecisionTime(Math.floor(Math.random() * 5) + 5);
      hasTriggeredDecision.current = false;
      if (roll < 0.25) {
        const obs = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        setCurrentObstacle(obs);
        playAlertSound();
        const loadImg = async () => {
           const prompt = getObstaclePrompt(obs.visualDescription);
           const b64 = await generateCartoonAsset(prompt, "1:1");
           if (b64) setPassengerImage(b64);
        };
        loadImg();
      } else {
        let availablePassengers = PASSENGERS;
        if (lastPassengerId) {
          availablePassengers = PASSENGERS.filter(p => p.id !== lastPassengerId);
          if (availablePassengers.length === 0) availablePassengers = PASSENGERS;
        }
        const p = availablePassengers[Math.floor(Math.random() * availablePassengers.length)];
        setCurrentPassenger(p);
        playNotificationSound();
        if (cachedPassengerImages[p.id]) {
          setPassengerImage(cachedPassengerImages[p.id]);
        } else {
           const loadImg = async () => {
             const prompt = getPassengerPrompt(p.visualDescription);
             const b64 = await generateCartoonAsset(prompt, "1:1");
             if (b64) setPassengerImage(b64);
           };
           loadImg();
        }
      }
    }
  }, [gamePhase, lastPassengerId, cachedPassengerImages]);

  useEffect(() => {
    if (gamePhase !== 'PLAYING' || isPaused) return;
    const quoteInterval = setInterval(() => {
      if (Math.random() < 0.3 && speechBubbles.length === 0) {
        let availableQuotes = GAMEPLAY_QUOTES.filter(q => !usedQuotes.current.has(q));
        if (availableQuotes.length === 0) {
          usedQuotes.current.clear();
          availableQuotes = GAMEPLAY_QUOTES;
        }
        const quote = availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
        usedQuotes.current.add(quote);
        const x = 20 + Math.random() * 60;
        const y = 20 + Math.random() * 30;
        setSpeechBubbles(prev => [...prev, { id: Date.now(), x, y, text: quote, imageColor: 'bg-white' }]);
        setTimeout(() => {
           setSpeechBubbles(prev => prev.filter(b => b.text !== quote));
        }, 3000);
      }
    }, 2000);
    return () => clearInterval(quoteInterval);
  }, [gamePhase, isPaused, speechBubbles.length]);

  const spawnTarget = useCallback(() => {
    if (!containerRef.current || isPaused || gamePhase !== 'PLAYING') return;
    const x = 15 + Math.random() * 70;
    const y = 15 + Math.random() * 60;
    const roll = Math.random();
    let type: 'DRIVER' | 'PASSENGER' = 'DRIVER';
    let isDecoy = false;
    let targetDriverId: string | undefined;
    let targetPassengerId: string | undefined;
    let vx = 0;
    let vy = 0;
    if (difficulty >= 2) {
       const speed = 0.5 + (difficulty * 0.2);
       vx = (Math.random() - 0.5) * speed;
       vy = (Math.random() - 0.5) * speed;
    }
    if (roll < 0.15) {
      type = 'PASSENGER';
      const p = PASSENGERS[Math.floor(Math.random() * PASSENGERS.length)];
      targetPassengerId = p.id;
    } else {
      type = 'DRIVER';
      isDecoy = Math.random() < 0.3;
      targetDriverId = currentDriver.id;
      if (isDecoy) {
        const otherDrivers = allDrivers.filter(d => d.id !== currentDriver.id);
        if (otherDrivers.length > 0) {
          const randomDecoy = otherDrivers[Math.floor(Math.random() * otherDrivers.length)];
          targetDriverId = randomDecoy.id;
        }
      }
    }
    setTargets(prev => [...prev, { id: nextId.current++, x, y, vx, vy, driverId: targetDriverId, passengerId: targetPassengerId, isDecoy, type }]);
  }, [currentDriver.id, allDrivers, isPaused, gamePhase, difficulty]);

  useEffect(() => {
    if (isPaused || gamePhase !== 'PLAYING') return;
    const moveInterval = setInterval(() => {
      setTargets(prev => prev.map(t => {
        if (t.vx === 0 && t.vy === 0) return t;
        let newX = t.x + t.vx;
        let newY = t.y + t.vy;
        let newVx = t.vx;
        let newVy = t.vy;
        if (newX <= 5 || newX >= 95) { newVx = -newVx; newX = Math.max(5, Math.min(95, newX)); }
        if (newY <= 5 || newY >= 95) { newVy = -newVy; newY = Math.max(5, Math.min(95, newY)); }
        return { ...t, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 40);
    return () => clearInterval(moveInterval);
  }, [isPaused, gamePhase]);

  useEffect(() => {
    if (isPaused || gamePhase !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === decisionTime && !hasTriggeredDecision.current) {
           hasTriggeredDecision.current = true;
           let availableDecisions = DECISIONS.filter(d => d.id !== globalLastDecisionId);
           if (availableDecisions.length === 0) availableDecisions = DECISIONS;
           const randomDecision = availableDecisions[Math.floor(Math.random() * availableDecisions.length)];
           globalLastDecisionId = randomDecision.id;
           setCurrentDecision(randomDecision);
           setGamePhase('DECISION');
           playNotificationSound();
           return prev;
        }
        if (prev <= 1) {
          clearInterval(timer);
          const netPenalty = cashPenalty - bonusCash;
          onEndShift(score, netPenalty, { gas: statsUsed.current.gas, coffee: statsUsed.current.energy, food: 5, sleep: 5 }, undefined, currentPassenger?.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onEndShift, score, cashPenalty, bonusCash, isPaused, gamePhase, currentPassenger?.id, decisionTime]);

  useEffect(() => {
    if (isPaused || gamePhase !== 'PLAYING') return;
    if (targets.length === 0) spawnTarget();
    const spawnRate = Math.max(250, 700 - (difficulty * 60));
    const spawnInterval = setInterval(() => {
      if (Math.random() > 0.1) spawnTarget();
    }, spawnRate); 
    return () => clearInterval(spawnInterval);
  }, [spawnTarget, isPaused, targets.length, gamePhase, difficulty]);

  useEffect(() => {
    if (isPaused || gamePhase !== 'PLAYING') return;
    const cleanupRate = Math.max(400, 1500 - (difficulty * 120));
    const cleanup = setInterval(() => {
      setTargets(prev => {
        if (prev.length > 4) return prev.slice(1);
        return prev;
      });
    }, cleanupRate);
    return () => clearInterval(cleanup);
  }, [isPaused, gamePhase, difficulty]);

  const addFloatingText = (x: number, y: number, text: string, color: string) => {
    const id = textIdCounter.current++;
    setFloatingTexts(prev => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const addSpeechBubble = (x: number, y: number, text: string, driver: Driver) => {
    const id = Date.now();
    setSpeechBubbles(prev => [...prev, { id, x, y, text, avatar: driver.avatarBase64, imageColor: driver.imageColor }]);
    setTimeout(() => {
      setSpeechBubbles(prev => prev.filter(b => b.id !== id));
    }, 2500);
  };

  const handleDecision = (reward: number, resultText: string) => {
     setBonusCash(prev => prev + reward);
     const feedbackColor = reward >= 0 ? 'text-green-400' : 'text-red-500';
     addFloatingText(50, 50, reward >= 0 ? `+${reward.toFixed(2)}$ ${resultText}` : `${reward.toFixed(2)}$ ${resultText}`, feedbackColor);
     if (reward >= 0) playSuccessSound();
     else playDecoySound();
     setTimeout(() => {
        setGamePhase('PLAYING');
        setCurrentDecision(null);
     }, 1000);
  };

  const handleTap = (target: Target) => {
    if (isPaused || gamePhase !== 'PLAYING') return;
    setTargets(prev => prev.filter(t => t.id !== target.id));
    if (target.type === 'PASSENGER') {
       playBonusSound();
       setScore(s => s + 25);
       setBonusCash(c => c + 0.10); // Changed from $0.50 to $0.10 per chat as requested
       addFloatingText(target.x, target.y, "Good Chat!", 'text-blue-400');
       return;
    }
    const tappedDriver = allDrivers.find(d => d.id === target.driverId) || currentDriver;
    if (target.isDecoy) {
      playDecoySound();
      setScore(s => s - 50);
      setCashPenalty(c => c + 0.50);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (tappedDriver.quotes && tappedDriver.quotes.miss.length > 0) {
        const quote = tappedDriver.quotes.miss[Math.floor(Math.random() * tappedDriver.quotes.miss.length)];
        addSpeechBubble(target.x, target.y, quote, tappedDriver);
        playSpeech(quote, tappedDriver.voiceId);
      }
    } else {
      playSuccessSound();
      setScore(s => s + 10);
      const gasCost = !!currentDriver.isEV ? 1 : 2; 
      const energyCost = currentDriver.id === 'jason' ? 1 : 2;
      statsUsed.current.gas += gasCost;
      statsUsed.current.energy += energyCost;
      if (tappedDriver.quotes && tappedDriver.quotes.tap.length > 0) {
        const quote = tappedDriver.quotes.tap[Math.floor(Math.random() * tappedDriver.quotes.tap.length)];
        addFloatingText(target.x, target.y, quote, 'text-green-400');
        playSpeech(quote, tappedDriver.voiceId);
      }
    }
  };

  const handleQuit = () => {
    const netPenalty = cashPenalty - bonusCash;
    onEndShift(score, netPenalty, { gas: statsUsed.current.gas, coffee: statsUsed.current.energy, food: 5, sleep: 5 }, undefined, currentPassenger?.id);
  };

  const handleCancelRide = () => {
    onEndShift(0, 0, { gas: 1, coffee: 1 }, currentObstacle?.fee || 0, undefined);
  };

  const ResourceItem = ({ label, value, icon }: { label: string, value: number, icon: string }) => {
    const getColor = (v: number) => v < 20 ? 'text-red-500' : 'text-green-400';
    return (
      <div className="flex justify-between items-center bg-black/40 p-2 rounded">
        <div className="flex items-center gap-2">
           <span className="text-lg">{icon}</span>
           <span className="text-xs font-bold text-slate-300">{label}</span>
        </div>
        <span className={`font-mono font-bold ${getColor(value)}`}>{Math.round(value)}%</span>
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full flex flex-col bg-gradient-to-br from-gray-800 to-black overflow-hidden ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
      {bgImage && (
        <div className="absolute inset-0 bg-cover bg-center z-0 transition-opacity duration-1000" style={{ backgroundImage: `url(${bgImage})` }} />
      )}
      <div className="absolute inset-0 bg-black/30 z-0" />
      {gamePhase === 'BRIEFING' && (currentPassenger || currentObstacle) && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-pop-in">
            <div className={`bg-white text-black w-full max-w-sm rounded-3xl p-6 shadow-2xl border-4 ${currentObstacle ? 'border-red-600' : 'border-taxi-yellow'} relative`}>
               <div className={`absolute -top-6 -left-4 ${currentObstacle ? 'bg-red-600 text-white' : 'bg-taxi-yellow text-black'} font-display text-xl px-4 py-1 rotate-[-5deg] border-2 border-black shadow-lg`}>
                 {currentObstacle ? 'RIDE PROBLEM' : 'NEW RIDE REQUEST'}
               </div>
               <div className="flex flex-col items-center mt-4">
                  <div className={`w-40 h-40 bg-slate-200 rounded-full mb-4 border-4 border-black overflow-hidden relative shadow-inner ${currentObstacle ? 'ring-4 ring-red-400 ring-offset-2' : ''}`}>
                     {passengerImage ? <img src={passengerImage} alt="passenger" className="w-full h-full object-cover animate-pop-in" /> : <div className="w-full h-full flex items-center justify-center text-6xl opacity-20 bg-slate-200">{currentObstacle ? '⚠️' : '👤'}</div>}
                  </div>
                  <h2 className={`text-3xl font-display uppercase text-center leading-none mb-2 ${currentObstacle ? 'text-red-600' : ''}`}>{currentObstacle ? currentObstacle.name : currentPassenger?.type}</h2>
                  <div className="bg-slate-100 w-full p-4 rounded-xl border-2 border-slate-200 mb-4">
                     {currentObstacle ? (
                       <div className="flex items-start gap-2">
                        <span className="text-3xl">🚫</span>
                        <div className="leading-tight">
                           <div className="text-[10px] text-red-600 font-bold uppercase">ISSUE</div>
                           <div className="font-bold text-lg text-slate-800 leading-tight">{currentObstacle.description}</div>
                        </div>
                     </div>
                     ) : (
                       <>
                        <div className="flex items-start gap-2 mb-2">
                            <span className="text-xl">📍</span>
                            <div className="leading-tight">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">DESTINATION</div>
                              <div className="font-bold text-lg">{currentPassenger?.destination}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-xl">📝</span>
                            <div className="leading-tight">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">NOTES</div>
                              <div className="text-sm italic text-slate-700">"{currentPassenger?.description}"</div>
                            </div>
                        </div>
                       </>
                     )}
                  </div>
                  {currentObstacle ? <button onClick={() => { handleCancelRide(); playClickSound(); }} className="w-full bg-red-600 text-white font-display text-2xl py-4 rounded-xl shadow-[0_4px_0_rgb(153,27,27)] hover:scale-105 transition-transform active:translate-y-1 active:shadow-none uppercase">CANCEL RIDE (+${currentObstacle.fee.toFixed(2)})</button> : <button onClick={() => { setGamePhase('PLAYING'); playClickSound(); }} className="w-full bg-black text-white font-display text-2xl py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.5)] hover:scale-105 transition-transform active:translate-y-1 active:shadow-none">ACCEPT RIDE</button>}
               </div>
            </div>
         </div>
      )}
      {gamePhase === 'DECISION' && currentDecision && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-pop-in">
           <div className="bg-blue-600 w-full max-w-sm rounded-3xl p-6 shadow-2xl border-4 border-white relative text-white">
              <div className="absolute -top-6 -right-4 bg-white text-blue-800 font-display text-xl px-4 py-1 rotate-[5deg] border-2 border-blue-900 shadow-lg">MID-RIDE EVENT!</div>
              <div className="text-6xl text-center mb-4">{currentDecision.icon}</div>
              <h2 className="text-2xl font-display uppercase text-center mb-2">{currentDecision.title}</h2>
              <p className="text-center font-bold text-lg mb-6 leading-tight">{currentDecision.prompt}</p>
              <div className="grid grid-cols-2 gap-4">
                 {currentDecision.options.map((option, idx) => (
                    <button key={idx} onClick={() => handleDecision(option.reward, option.resultText)} className="bg-white text-blue-900 font-bold py-4 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:bg-gray-100 active:translate-y-1 active:shadow-none transition-all border-2 border-blue-900 flex flex-col items-center justify-center">
                      <span>{option.label}</span>
                      <div className={`text-xs mt-1 font-bold ${option.reward > 0 ? 'text-green-600' : option.reward < 0 ? 'text-red-500' : 'text-gray-500'}`}>{option.reward > 0 ? `+${option.reward}$` : option.reward < 0 ? `${option.reward}$` : ''}</div>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
      {(gamePhase === 'PLAYING' || gamePhase === 'DECISION') && (
        <div className="absolute top-4 left-0 right-0 px-4 flex justify-between pointer-events-none z-20">
          <div className="bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/20 flex gap-4">
            <div><span className="text-yellow-400 font-bold text-xs block">SCORE</span><span className={`text-xl font-bold ${score < 0 ? 'text-red-500' : 'text-white'}`}>{score}</span></div>
            {(cashPenalty - bonusCash) > 0 && (<div><span className="text-red-400 font-bold text-xs block">FINE</span><span className="text-red-500 text-xl font-bold">-${(cashPenalty - bonusCash).toFixed(2)}</span></div>)}
            {bonusCash > cashPenalty && (<div><span className="text-green-400 font-bold text-xs block">BONUS</span><span className="text-green-500 text-xl font-bold">+${(bonusCash - cashPenalty).toFixed(2)}</span></div>)}
          </div>
          <div className="flex gap-2 pointer-events-auto">
            <button onClick={() => { setIsPaused(true); playClickSound(); }} disabled={gamePhase === 'DECISION'} className="bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center border border-white/20 hover:bg-black/80 active:scale-95 transition-all shadow-lg disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg></button>
            <div className="bg-red-600/90 text-white px-4 py-2 rounded-full font-bold animate-pulse shadow-lg border border-red-400 flex items-center min-w-[60px] justify-center">{timeLeft}s</div>
          </div>
        </div>
      )}
      {isPaused && (
         <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-pop-in">
            <h2 className="text-4xl font-display text-white mb-6 tracking-widest text-shadow">PAUSED</h2>
            <div className="w-full max-w-sm bg-slate-800 p-4 rounded-xl mb-6 border border-slate-600 shadow-xl">
               <h3 className="text-slate-400 text-xs font-bold uppercase mb-3 border-b border-slate-700 pb-2">Current Status</h3>
               <div className="grid grid-cols-2 gap-3">
                  <ResourceItem label={!!currentDriver.isEV ? "CHRG" : "GAS"} value={gameState.gas} icon={!!currentDriver.isEV ? "⚡" : "⛽"} />
                  <ResourceItem label="ENERGY" value={gameState.coffee} icon="☕" />
                  <ResourceItem label="HUNGER" value={gameState.food} icon="🍔" />
                  <ResourceItem label="REST" value={gameState.sleep} icon="💤" />
               </div>
            </div>
            <div className="flex gap-4 w-full max-w-sm">
                <button onClick={handleQuit} className="flex-1 bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-500 shadow-lg active:scale-95 transition-transform">QUIT SHIFT</button>
                <button onClick={() => { setIsPaused(false); playClickSound(); }} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 shadow-lg active:scale-95 transition-transform">RESUME</button>
            </div>
         </div>
      )}
      <div ref={containerRef} className="flex-1 relative w-full h-full z-10">
        {targets.map(target => {
          if (target.type === 'PASSENGER' && target.passengerId) {
             const pas = PASSENGERS.find(p => p.id === target.passengerId) || PASSENGERS[0];
             const pImg = cachedPassengerImages[target.passengerId];
             return (<button key={target.id} onClick={() => handleTap(target)} disabled={isPaused} className={`absolute w-20 h-20 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation active:scale-95 transition-transform animate-pop-in animate-float`} style={{ left: `${target.x}%`, top: `${target.y}%` }}><div className="relative w-full h-full rounded-full border-4 border-blue-400 bg-white overflow-hidden shadow-lg animate-[sway_3s_ease-in-out_infinite]">{pImg ? <img src={pImg} alt="passenger" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🙂</div>}<div className="absolute -bottom-1 w-full text-center bg-blue-500 text-white text-[8px] font-bold">CHAT</div></div></button>);
          }
          const targetDriver = allDrivers.find(d => d.id === target.driverId) || currentDriver;
          const difficultyClass = difficulty >= 2 ? 'animate-bounce' : 'animate-float';
          return (<button key={target.id} onClick={() => handleTap(target)} disabled={isPaused} className={`absolute w-24 h-24 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation active:scale-95 transition-transform animate-pop-in ${difficultyClass}`} style={{ left: `${target.x}%`, top: `${target.y}%` }}><div className="relative w-full h-full"><DriverAvatar color={targetDriver.imageColor} src={targetDriver.avatarBase64} className={`w-full h-full border-4 ${target.isDecoy ? 'border-red-500/50' : 'border-green-400'}`} /><div className={`absolute -bottom-2 w-full text-center text-[10px] text-white rounded px-1 backdrop-blur-sm border border-white/20 ${target.isDecoy ? 'bg-red-900/80' : 'bg-black/70'}`}>{targetDriver.name.split(' ')[0]}</div></div></button>);
        })}
        {floatingTexts.map(ft => (<div key={ft.id} className={`absolute pointer-events-none font-display text-xl stroke-black stroke-2 drop-shadow-md animate-[float_1s_ease-out_forwards] ${ft.color}`} style={{ left: `${ft.x}%`, top: `${ft.y - 10}%`, textShadow: '2px 2px 0px #000' }}>"{ft.text}"</div>))}
        {speechBubbles.map(sb => (<div key={sb.id} className="absolute z-50 pointer-events-none animate-pop-in flex items-center gap-2 max-w-[200px]" style={{ left: `${Math.min(80, Math.max(10, sb.x))}%`, top: `${sb.y - 20}%`, transform: 'translate(-50%, -50%)' }}><div className="bg-white border-2 border-black rounded-xl rounded-bl-none p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] relative"><div className="text-black font-display text-lg leading-tight">{sb.text}</div><div className="absolute -bottom-2 -left-[2px] w-4 h-4 bg-white border-l-2 border-b-2 border-black transform rotate-45"></div></div></div>))}
      </div>
      {gamePhase === 'PLAYING' && (<div className="absolute bottom-4 w-full text-center text-white text-shadow-lg text-lg pointer-events-none font-display tracking-widest uppercase z-20 drop-shadow-md px-4">{environment}</div>)}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); background-color: rgba(255,0,0,0.2); }
          75% { transform: translateX(10px); background-color: rgba(255,0,0,0.2); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
      `}</style>
    </div>
  );
};
