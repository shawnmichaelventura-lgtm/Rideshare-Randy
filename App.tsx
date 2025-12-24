import React, { useState, useEffect, useRef } from 'react';
import { Driver, GameState, Screen, ENVIRONMENTS, Environment, Challenge, PaymentMethod, Passenger } from './types';
import { ResourceBar } from './components/ResourceBar';
import { GameScreen } from './components/GameScreen';
import { Store } from './components/Store';
import { RestStop } from './components/RestStop';
import { PaymentMethods } from './components/PaymentMethods';
import { TutorialOverlay } from './components/TutorialOverlay';
import { generateShiftReport } from './services/geminiService';
import { generateCartoonAsset, getDriverPrompt, getEnvironmentPrompt, getPassengerPrompt } from './services/assetGenerator';
import { DriverAvatar, INITIAL_DRIVERS, AVAILABLE_ADDONS, CHALLENGE_TEMPLATES, PASSENGERS } from './constants';
import { playSpeech } from './services/audioPlayer';
import { playClickSound, playBackSound, playPurchaseSound } from './services/soundEffects';

const playSelectSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

const playRewardSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};

interface ShiftEvent {
  name: string;
  amount: number;
  description: string;
}

const POSSIBLE_EVENTS: ShiftEvent[] = [
  { name: 'Passenger Sick', amount: -20, description: '🤮 Passenger got sick! Cleaning fee.' },
  { name: 'Spilled Coffee', amount: -15, description: '☕ Coffee spill everywhere. Interior detailing.' },
  { name: 'Late Passenger', amount: 2, description: '⏰ Passenger late. Ride cancelled.' },
  { name: 'Group too big', amount: 2, description: '👨‍👩‍👧‍👦 5 people, 4 seats. Cancel fee collected.' },
];

const App = () => {
  const [screen, setScreen] = useState<Screen>('HOME');
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [envImages, setEnvImages] = useState<Record<string, string>>({});
  const [passengerImages, setPassengerImages] = useState<Record<string, string>>({});
  
  const [showTutorial, setShowTutorial] = useState(true);
  const [showChallenges, setShowChallenges] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [homeDialogue, setHomeDialogue] = useState<string | null>(null);
  const dialogueTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [gameState, setGameState] = useState<GameState>({
    cash: 50.00,
    gas: 100,
    coffee: 100,
    food: 100,
    sleep: 100,
    currentDriverId: 'randy',
    ownedAddonIds: [],
    savedPaymentMethods: [],
    score: 0,
    highScore: 0,
    shiftCount: 0,
    challenges: [],
    lastChallengeResetTime: 0,
    lastDailyBonus: 0
  });
  
  const [lastShiftReport, setLastShiftReport] = useState<string>('');
  const [currentEnv, setCurrentEnv] = useState<Environment>(Environment.CITY);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastPassengerId, setLastPassengerId] = useState<string | null>(null);
  
  const [lastShiftStats, setLastShiftStats] = useState<{ 
    fare: number, 
    tips: number, 
    penalty: number, 
    completedChallenges?: number,
    event?: ShiftEvent | null,
    cancellationFee?: number
  }>({ fare: 0, tips: 0, penalty: 0 });

  // Computed driver logic to handle car upgrades
  // This function finds the best owned vehicle upgrade and overrides the base driver's car details
  const getComputedDriver = (d: Driver) => {
    const carUpgrades = AVAILABLE_ADDONS.filter(a => 
      ['car_electric', 'car_yukon', 'car_luxury'].includes(a.id) && 
      gameState.ownedAddonIds.includes(a.id)
    );
    
    // Sort by price to get highest tier upgrade
    const bestCar = carUpgrades.sort((a, b) => b.price - a.price)[0];
    const isEVUpgradeOwned = gameState.ownedAddonIds.includes('car_electric');
    
    if (bestCar) {
      return {
        ...d,
        car: bestCar.name,
        carDescription: bestCar.description, // Added this field for the Home screen
        isEV: isEVUpgradeOwned || d.isEV,
      };
    }
    return d;
  };
  
  const baseDriver = drivers.find(d => d.id === gameState.currentDriverId) || drivers[0];
  const currentDriver = getComputedDriver(baseDriver);

  useEffect(() => {
    const checkDailyBonus = () => {
       const storedLastBonus = localStorage.getItem('rideshare_last_bonus');
       const lastBonusTime = storedLastBonus ? parseInt(storedLastBonus) : 0;
       const now = Date.now();
       const ONE_DAY_MS = 24 * 60 * 60 * 1000;

       if (now - lastBonusTime > ONE_DAY_MS) {
          if (gameState.lastDailyBonus > 0 && now - gameState.lastDailyBonus < ONE_DAY_MS) return;
          setShowDailyBonus(true);
          playRewardSound();
          setGameState(prev => ({
            ...prev,
            cash: prev.cash + 25,
            lastDailyBonus: now
          }));
          localStorage.setItem('rideshare_last_bonus', now.toString());
       }
    };
    checkDailyBonus();
  }, [gameState.lastDailyBonus]);

  useEffect(() => {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (gameState.challenges.length === 0 || (now - gameState.lastChallengeResetTime) > ONE_DAY) {
       const newChallenges: Challenge[] = [];
       for (let i = 0; i < 3; i++) {
          const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
          newChallenges.push({
             id: `chal-${now}-${i}`,
             description: template.description || "Do work",
             target: template.target || 10,
             progress: 0,
             reward: template.reward || 5,
             isCompleted: false,
             type: template.type || 'COMPLETE_SHIFTS',
             condition: template.condition
          });
       }
       setGameState(prev => ({
         ...prev,
         challenges: newChallenges,
         lastChallengeResetTime: now
       }));
    }
  }, [gameState.challenges.length, gameState.lastChallengeResetTime]);

  const hasStartedGen = useRef(false);
  useEffect(() => {
    if (hasStartedGen.current) return;
    hasStartedGen.current = true;
    const generateAssets = async () => {
      for (const driver of drivers) {
        if (!driver.avatarBase64) {
          const prompt = getDriverPrompt(driver.name, driver.description);
          const base64 = await generateCartoonAsset(prompt, "1:1");
          if (base64) {
            setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, avatarBase64: base64 } : d));
          }
        }
      }
      for (const passenger of PASSENGERS) {
         const prompt = getPassengerPrompt(passenger.visualDescription);
         const base64 = await generateCartoonAsset(prompt, "1:1");
         if (base64) {
            setPassengerImages(prev => ({ ...prev, [passenger.id]: base64 }));
         }
      }
      for (const env of ENVIRONMENTS) {
        const prompt = getEnvironmentPrompt(env);
        const base64 = await generateCartoonAsset(prompt, "9:16");
        if (base64) {
          setEnvImages(prev => ({ ...prev, [env]: base64 }));
        }
      }
    };
    generateAssets();
  }, [drivers]); 

  const triggerDialogue = (driver: Driver) => {
    if (driver.quotes && driver.quotes.select.length > 0) {
      const randomQuote = driver.quotes.select[Math.floor(Math.random() * driver.quotes.select.length)];
      setHomeDialogue(randomQuote);
      playSpeech(randomQuote, driver.voiceId);
      if (dialogueTimeoutRef.current) clearTimeout(dialogueTimeoutRef.current);
      dialogueTimeoutRef.current = setTimeout(() => {
        setHomeDialogue(null);
      }, 3000);
    }
  };

  const startShift = () => {
    playClickSound();
    if (gameState.gas <= 10 || gameState.sleep <= 10) {
      const isEV = !!currentDriver.isEV;
      const resourceName = isEV ? 'Charge' : 'Gas';
      alert(`You're too tired or out of ${resourceName}! Visit the Rest Stop.`);
      return;
    }
    const randomEnv = ENVIRONMENTS[Math.floor(Math.random() * ENVIRONMENTS.length)];
    setCurrentEnv(randomEnv);
    setScreen('GAME');
  };

  const handleEndShift = async (score: number, cashPenalty: number, statsConsumed: Partial<GameState>, cancellationFee?: number, passengerId?: string) => {
    if (passengerId) {
      setLastPassengerId(passengerId);
    }
    const activeAddons = AVAILABLE_ADDONS.filter(addon => gameState.ownedAddonIds.includes(addon.id));
    const tipMultiplier = activeAddons.reduce((sum, addon) => sum + addon.tipBonus, 0);
    const fareMultiplier = activeAddons.reduce((sum, addon) => sum + (addon.fareBonus || 0), 0);
    const baseFare = Math.max(0, score * 0.02); 
    const driverFareBonus = currentDriver.id === 'samalie' ? baseFare * 0.1 : 0; 
    const totalFare = (baseFare + driverFareBonus) * (1 + fareMultiplier);
    let tips = 0;
    if (score > 0) {
       const baseTipPercent = 0.10 + (Math.random() * 0.20);
       const driverTipBonus = currentDriver.tipMultiplier || 0;
       const totalTipPercent = baseTipPercent + tipMultiplier + driverTipBonus;
       tips = totalFare * totalTipPercent;
       if (tips > 10.00) tips = 10.00;
    }
    let event: ShiftEvent | null = null;
    if (!cancellationFee) {
      const roll = Math.random();
      if (roll < 0.15) {
        event = POSSIBLE_EVENTS[Math.floor(Math.random() * POSSIBLE_EVENTS.length)];
      }
    }
    const eventAmount = event ? event.amount : 0;
    const feeAmount = cancellationFee || 0;
    const netEarnings = Math.max(-20, (totalFare + tips + eventAmount + feeAmount) - cashPenalty); 
    let challengeRewards = 0;
    let completedCount = 0;
    const updatedChallenges = gameState.challenges.map(c => {
      if (c.isCompleted) return c;
      let newProgress = c.progress;
      let shouldCheck = true;
      if (c.condition?.driverId && c.condition.driverId === currentDriver.id) shouldCheck = true;
      if (c.condition?.environment && c.condition.environment !== currentEnv) shouldCheck = false;
      if (shouldCheck) {
        if (c.type === 'EARN_CASH') newProgress += netEarnings;
        if (c.type === 'SCORE_POINTS') newProgress += score;
        if (c.type === 'COMPLETE_SHIFTS') newProgress += 1;
        if (c.type === 'NO_FINES' && cashPenalty === 0 && (!event || event.amount >= 0)) newProgress += 1;
      }
      const isCompleted = newProgress >= c.target;
      if (isCompleted) {
        challengeRewards += c.reward;
        completedCount++;
      }
      return { ...c, progress: Math.min(newProgress, c.target), isCompleted };
    });
    if (completedCount > 0) playRewardSound();
    setLastShiftStats({ fare: totalFare, tips, penalty: cashPenalty, completedChallenges: completedCount, event, cancellationFee });
    setGameState(prev => ({
      ...prev,
      cash: prev.cash + netEarnings + challengeRewards, 
      gas: Math.max(0, prev.gas - (statsConsumed.gas || 0)),
      coffee: Math.max(0, prev.coffee - (statsConsumed.coffee || 0)),
      food: Math.max(0, prev.food - (statsConsumed.food || 0)),
      sleep: Math.max(0, prev.sleep - (statsConsumed.sleep || 0)),
      score: score,
      highScore: Math.max(prev.highScore, score),
      shiftCount: prev.shiftCount + 1,
      challenges: updatedChallenges
    }));
    setScreen('SUMMARY');
    setIsGeneratingReport(true);
    const report = cancellationFee 
       ? "Shift cancelled. Got paid a small fee though. #hustle" 
       : await generateShiftReport(currentDriver.name, currentEnv, score);
    setLastShiftReport(report);
    setIsGeneratingReport(false);
  };

  const handleShare = async () => {
    playClickSound();
    if (!lastShiftReport && !isGeneratingReport) return;
    let netEarnings = (lastShiftStats.fare + lastShiftStats.tips) - lastShiftStats.penalty;
    if (lastShiftStats.event) netEarnings += lastShiftStats.event.amount;
    if (lastShiftStats.cancellationFee) netEarnings += lastShiftStats.cancellationFee;
    const textToShare = `🚖 RIDESHARE RANDY REPORT 🚖\n\nDriver: ${currentDriver.name}\nLocation: ${currentEnv}\n\n"${lastShiftReport}"\n\n💵 Net Earnings: $${netEarnings.toFixed(2)}\n⭐ Score: ${gameState.score}\n\nCan you beat the hustle?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Rideshare Randy Shift Report', text: textToShare });
      } else {
        await navigator.clipboard.writeText(textToShare);
        alert('Report copied to clipboard!');
      }
    } catch (err) {}
  };

  const buyDriver = (id: string) => {
    playPurchaseSound();
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, owned: true } : d));
    setGameState(prev => ({ ...prev, currentDriverId: id }));
  };

  const buyAddon = (id: string) => {
    if (!gameState.ownedAddonIds.includes(id)) {
      playPurchaseSound();
      setGameState(prev => ({ ...prev, ownedAddonIds: [...prev.ownedAddonIds, id] }));
    }
  };

  const handleBuyCash = (amount: number = 50) => {
    setGameState(prev => ({ ...prev, cash: prev.cash + amount }));
    playRewardSound();
  };

  const buyResource = (type: 'gas' | 'coffee' | 'food' | 'sleep', cost: number, amount: number) => {
    if (gameState.cash >= cost) {
      playClickSound();
      setGameState(prev => ({
        ...prev,
        cash: prev.cash - cost,
        [type]: Math.min(100, prev[type] + amount)
      }));
    }
  };

  const handleRosterClick = (driver: Driver) => {
    if (driver.owned) {
      playSelectSound();
      setGameState(prev => ({ ...prev, currentDriverId: driver.id }));
      triggerDialogue(driver);
    } else {
      playClickSound();
      setScreen('STORE');
    }
  };
  
  const addPaymentMethod = (method: PaymentMethod) => {
    playClickSound();
    setGameState(prev => ({ ...prev, savedPaymentMethods: [...prev.savedPaymentMethods, method] }));
  };

  const renderDailyBonus = () => (
     <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-pop-in">
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 border-4 border-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/money.png')] opacity-10"></div>
           <h2 className="text-3xl font-display text-white mb-2 drop-shadow-md relative z-10">DAILY BONUS!</h2>
           <div className="text-6xl my-4 animate-bounce relative z-10">💰</div>
           <p className="text-white text-lg font-bold mb-6 relative z-10">Here is <span className="text-yellow-300 text-2xl">$25.00</span> to keep hustling!</p>
           <button onClick={() => { setShowDailyBonus(false); playClickSound(); }} className="bg-white text-green-800 font-display text-2xl px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 relative z-10">COLLECT</button>
        </div>
     </div>
  );

  const renderHome = () => {
    const displayName = currentDriver.name.replace(/^Rideshare\s+/i, '').toUpperCase();
    return (
      <div className="flex flex-col h-full bg-slate-900 text-white overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-start p-6 relative min-h-full gap-8 pb-32">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/800/1200?blur=10')] opacity-20 bg-cover bg-center fixed" />
          <div className="z-10 flex flex-col items-center mt-4 transform hover:scale-105 transition-transform duration-300 relative shrink-0">
            {homeDialogue && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white text-black p-3 rounded-xl rounded-bl-none border-2 border-black shadow-lg animate-pop-in z-30 max-w-[200px] text-center">
                 <p className="font-display text-xl leading-none">{homeDialogue}</p>
              </div>
            )}
            <div className="w-32 h-32 mb-4 animate-bounce z-20">
               <DriverAvatar color={currentDriver.imageColor} src={currentDriver.avatarBase64} className="w-full h-full border-4 border-black shadow-[0_8px_0_rgba(0,0,0,0.5)]" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-display text-taxi-yellow drop-shadow-[0_4px_0_rgba(0,0,0,1)] mb-2 text-center rotate-[-3deg] border-4 border-black bg-slate-800 px-4 py-2 rounded-xl transform skew-x-[-6deg]">RIDESHARE<br/>{displayName}</h1>
            <div className="bg-red-600 text-white font-bold font-display tracking-widest px-4 py-1 rotate-2 shadow-lg -mt-4 z-20 transform skew-x-[-6deg] border-2 border-black">THE HUSTLE</div>
          </div>
          <div className="z-10 w-full overflow-x-auto pb-4 scrollbar-hide px-2 shrink-0">
            <div className="flex justify-center items-end gap-3 min-w-max mx-auto px-4 bg-black/50 p-4 rounded-xl border border-white/10 backdrop-blur-md">
              {drivers.map(driver => {
                const computed = getComputedDriver(driver);
                return (
                  <button key={driver.id} onClick={() => handleRosterClick(driver)} className="relative group flex flex-col items-center shrink-0 transition-transform active:scale-95">
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 transition-all duration-300 transform rounded-full shadow-xl border-2 ${driver.owned ? 'scale-100 opacity-100 border-white' : 'scale-90 opacity-60 grayscale border-slate-500'} ${gameState.currentDriverId === driver.id ? 'ring-4 ring-taxi-yellow ring-offset-2 ring-offset-black scale-110 z-10 border-taxi-yellow' : ''}`}>
                      <DriverAvatar color={driver.imageColor} src={driver.avatarBase64} className="w-full h-full" />
                      {!driver.owned && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full backdrop-blur-[2px]"><span className="text-lg">🔒</span></div>}
                    </div>
                    <div className="mt-2 text-center">{driver.owned ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow border border-black/20 ${gameState.currentDriverId === driver.id ? 'bg-taxi-yellow text-black' : 'bg-black/60 text-white'}`}>{driver.name.split(' ')[0]}</span> : <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow border border-black/20">${driver.price}</span>}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="z-10 bg-slate-800/90 p-4 sm:p-6 rounded-2xl shadow-2xl border border-slate-600 w-full max-w-sm shrink-0">
            <div className="flex items-center gap-4 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="w-16 h-16 shrink-0"><DriverAvatar color={currentDriver.imageColor} src={currentDriver.avatarBase64} className="w-full h-full" /></div>
              <div className="overflow-hidden flex-1">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Current Vehicle</div>
                <div className="font-bold text-xl font-display text-white tracking-wide leading-tight truncate">{currentDriver.car}</div>
                <div className="text-[11px] text-slate-300 italic truncate mb-1">{(currentDriver as any).carDescription || "Standard commuter vehicle."}</div>
                <div className="text-xs text-taxi-yellow truncate">{currentDriver.perks}</div>
              </div>
            </div>
            <button onClick={() => { setShowChallenges(true); playClickSound(); }} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 rounded-lg shadow-lg mb-4 text-xs tracking-wider flex justify-between items-center px-4"><span>DAILY CHALLENGES</span><span className="bg-white/20 px-2 rounded-full text-[10px]">{gameState.challenges.filter(c => c.isCompleted).length}/{gameState.challenges.length}</span></button>
            <button onClick={startShift} className="w-full bg-gradient-to-b from-taxi-yellow to-yellow-600 text-black font-display text-3xl sm:text-4xl py-3 sm:py-4 rounded-xl shadow-[0_4px_0_rgb(161,98,7)] hover:translate-y-1 hover:shadow-none transition-all mb-4 border-2 border-black/20">START SHIFT</button>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => { setScreen('STORE'); playClickSound(); }} className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-sm shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none transition-all border-b-0 text-white">STORE</button>
               <button onClick={() => { setScreen('REST_STOP'); playClickSound(); }} className="bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold text-sm shadow-[0_4px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all border-b-0 text-white">REST STOP</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChallengesModal = () => (
     <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-pop-in">
        <div className="bg-slate-800 w-full max-w-sm rounded-2xl border-2 border-slate-600 shadow-2xl overflow-hidden">
           <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center"><h2 className="text-xl font-display text-white tracking-wide">DAILY CHALLENGES</h2><button onClick={() => { setShowChallenges(false); playBackSound(); }} className="text-slate-400 hover:text-white font-bold">✕</button></div>
           <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {gameState.challenges.map(challenge => (
                 <div key={challenge.id} className={`p-3 rounded-xl border-2 ${challenge.isCompleted ? 'bg-green-900/20 border-green-500/50' : 'bg-slate-700/50 border-slate-600'}`}>
                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-sm text-white">{challenge.description}</h3>{challenge.isCompleted ? <span className="text-green-400 font-bold text-xs">COMPLETE</span> : <span className="text-yellow-400 font-bold text-xs">+${challenge.reward}</span>}</div>
                    <div className="relative h-3 bg-black/50 rounded-full overflow-hidden"><div className={`absolute top-0 left-0 h-full transition-all duration-500 ${challenge.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%` }} /></div>
                    <div className="text-right text-[10px] text-slate-400 mt-1">{challenge.isCompleted ? challenge.target : Math.floor(challenge.progress)} / {challenge.target}</div>
                 </div>
              ))}
           </div>
        </div>
     </div>
  );

  const renderSummary = () => {
    let netEarnings = (lastShiftStats.fare + lastShiftStats.tips) - lastShiftStats.penalty;
    netEarnings += (lastShiftStats.event ? lastShiftStats.event.amount : 0) + (lastShiftStats.cancellationFee || 0);
    return (
      <div className="flex flex-col h-full bg-slate-900 items-center justify-center p-6 overflow-y-auto">
         <div className="bg-white text-black w-full max-w-md p-8 rounded-lg shadow-2xl relative rotate-1 my-auto">
           <div className="absolute -top-3 -right-3 bg-red-600 text-white px-4 py-1 font-display text-xl rotate-12 shadow-lg">{lastShiftStats.cancellationFee ? 'RIDE CANCELLED' : 'SHIFT OVER'}</div>
           <h2 className="font-display text-4xl mb-4 text-center border-b-2 border-black pb-2">RECEIPT</h2>
           <div className="space-y-2 mb-6 font-mono text-sm">
             <div className="flex justify-between"><span>LOCATION:</span><span className="font-bold text-right">{currentEnv}</span></div>
             {lastShiftStats.cancellationFee ? (
                <div className="flex justify-between mt-4 text-blue-600"><span>CANCELLATION FEE:</span><span className="font-bold">+${lastShiftStats.cancellationFee.toFixed(2)}</span></div>
             ) : (
                <>
                  <div className="flex justify-between mt-4"><span>BASE FARE:</span><span className="font-bold">${lastShiftStats.fare.toFixed(2)}</span></div>
                  <div className="flex justify-between text-green-600"><span>TIPS:</span><span className="font-bold">+${lastShiftStats.tips.toFixed(2)}</span></div>
                </>
             )}
             {lastShiftStats.penalty > 0 && <div className="flex justify-between text-red-600"><span>FINE:</span><span>-${lastShiftStats.penalty.toFixed(2)}</span></div>}
             {lastShiftStats.event && (
               <div className={`flex justify-between font-bold border-2 p-2 rounded mt-2 ${lastShiftStats.event.amount < 0 ? 'border-red-500 bg-red-50 text-red-600' : 'border-green-500 bg-green-50 text-green-600'}`}>
                 <div className="flex flex-col"><span>{lastShiftStats.event.name.toUpperCase()}</span><span className="text-[10px] font-normal text-black">{lastShiftStats.event.description}</span></div>
                 <span>{lastShiftStats.event.amount < 0 ? '-' : '+'}${Math.abs(lastShiftStats.event.amount).toFixed(2)}</span>
               </div>
             )}
             <div className="flex justify-between text-lg font-bold border-t border-dashed border-gray-400 pt-2 mt-2"><span>NET EARNINGS:</span><span className={netEarnings >= 0 ? 'text-green-600' : 'text-red-600'}>${netEarnings.toFixed(2)}</span></div>
           </div>
           <div className="bg-gray-100 p-4 rounded mb-6 relative"><div className="absolute -top-2 left-4 text-[10px] text-gray-500 bg-white px-1">LATEST POST</div><div className="flex gap-3"><div className="w-10 h-10 shrink-0"><DriverAvatar color={currentDriver.imageColor} src={currentDriver.avatarBase64} className="w-full h-full" /></div><div className="text-sm italic text-gray-700">{isGeneratingReport ? <span className="animate-pulse">Thinking...</span> : `"${lastShiftReport}"`}</div></div></div>
           <div className="flex gap-3"><button onClick={handleShare} disabled={isGeneratingReport} className="flex-1 bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-500 shadow-[0_4px_0_rgb(29,78,216)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-50">{isGeneratingReport ? '...' : 'SHARE 📤'}</button><button onClick={() => { setScreen('HOME'); playClickSound(); }} className="flex-1 bg-black text-white font-bold py-3 rounded hover:bg-gray-800 shadow-[0_4px_0_rgb(0,0,0)] active:translate-y-1 active:shadow-none">CONTINUE</button></div>
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black font-body">
      {showTutorial && <TutorialOverlay onComplete={() => { setShowTutorial(false); playClickSound(); }} randy={drivers.find(d => d.id === 'randy') || drivers[0]} />}
      {showDailyBonus && renderDailyBonus()}
      {showChallenges && renderChallengesModal()}
      {screen !== 'SUMMARY' && <ResourceBar state={gameState} currentDriver={currentDriver} />}
      <div className="flex-1 relative overflow-hidden">
        {screen === 'HOME' && renderHome()}
        {screen === 'GAME' && <GameScreen currentDriver={currentDriver} allDrivers={drivers} environment={currentEnv} bgImage={envImages[currentEnv]} onEndShift={handleEndShift} gameState={gameState} lastPassengerId={lastPassengerId} cachedPassengerImages={passengerImages} />}
        {screen === 'STORE' && <Store drivers={drivers} currentDriverId={gameState.currentDriverId} ownedAddonIds={gameState.ownedAddonIds} savedPaymentMethods={gameState.savedPaymentMethods} onBuyDriver={buyDriver} onBuyAddon={buyAddon} onBuyCash={handleBuyCash} onSelectDriver={(id) => { setGameState(prev => ({...prev, currentDriverId: id})); playClickSound(); }} onBack={() => { setScreen('HOME'); playBackSound(); }} onManagePayments={() => { setScreen('PAYMENT_METHODS'); playClickSound(); }} />}
        {screen === 'PAYMENT_METHODS' && <PaymentMethods existingMethods={gameState.savedPaymentMethods} onAddMethod={addPaymentMethod} onBack={() => { setScreen('STORE'); playBackSound(); }} />}
        {screen === 'REST_STOP' && <RestStop state={gameState} currentDriver={currentDriver} onBuy={buyResource} onBack={() => { setScreen('HOME'); playBackSound(); }} />}
        {screen === 'SUMMARY' && renderSummary()}
      </div>
    </div>
  );
};

export default App;