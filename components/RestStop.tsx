
import React from 'react';
import { GameState, Driver } from '../types';
import { PRICES } from '../constants';
import { playClickSound, playBackSound } from '../services/soundEffects';

interface RestStopProps {
  state: GameState;
  currentDriver: Driver;
  onBuy: (resource: 'gas' | 'coffee' | 'food' | 'sleep', cost: number, amount: number) => void;
  onBack: () => void;
}

export const RestStop: React.FC<RestStopProps> = ({ state, currentDriver, onBuy, onBack }) => {
  const canAfford = (cost: number) => state.cash >= cost;
  const isEV = !!currentDriver.isEV;
  const gasPrice = PRICES.GAS; // $20.00 as requested

  // Render a purchase card
  const PurchaseCard = ({ 
    type, label, price, currentVal, emoji, desc, amount = 30
  }: { 
    type: 'gas' | 'coffee' | 'food' | 'sleep', 
    label: string, 
    price: number, 
    currentVal: number,
    emoji: string,
    desc: string,
    amount?: number
  }) => {
    const isFull = currentVal >= 100;
    const affordable = canAfford(price);

    return (
      <button 
        onClick={() => { onBuy(type, price, amount); playClickSound(); }}
        disabled={!affordable || isFull}
        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between mb-3 transition-all
          ${isFull 
            ? 'border-gray-600 bg-gray-800 opacity-50 cursor-not-allowed' 
            : affordable 
              ? 'border-slate-500 bg-slate-800 hover:bg-slate-700 hover:border-white' 
              : 'border-red-900 bg-red-900/20 opacity-70 cursor-not-allowed'
          }
        `}
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl">{emoji}</div>
          <div className="text-left">
            <div className="font-bold text-lg uppercase">{label}</div>
            <div className="text-xs text-slate-400">{desc}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-mono text-xl font-bold ${affordable ? 'text-green-400' : 'text-red-400'}`}>
            ${price === 0 ? 'FREE' : price.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500 font-bold">
            {isFull ? 'FULL' : `+${amount}%`}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display text-white tracking-wider">REST STOP</h2>
        <button onClick={() => { onBack(); playBackSound(); }} className="text-sm underline text-slate-400">Back</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <PurchaseCard 
          type="gas" 
          label={isEV ? "Recharge EV" : "Refuel"} 
          price={gasPrice} 
          currentVal={state.gas} 
          emoji={isEV ? "⚡" : "⛽"} 
          desc={isEV ? "Supercharge battery." : "Fill up the tank."} 
        />
        <PurchaseCard type="coffee" label="Coffee" price={PRICES.COFFEE} currentVal={state.coffee} emoji="☕" desc="Boost your energy." />
        <PurchaseCard type="food" label="Meal Deal" price={PRICES.FOOD} currentVal={state.food} emoji="🍔" desc="Don't drive hungry." />
        <PurchaseCard type="sleep" label="Motel Nap" price={PRICES.MOTEL} currentVal={state.sleep} emoji="💤" desc="Recover from fatigue." />

        <div className="my-6 border-t border-dashed border-slate-700 relative">
           <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-slate-900 px-2 text-xs text-slate-500">QUICK FIXES</span>
        </div>

        <PurchaseCard type="coffee" label="Water For You" price={PRICES.WATER} currentVal={state.coffee} emoji="💧" desc="Hydrate (+Energy)." amount={10} />
        <PurchaseCard type="food" label="Candy Bar" price={PRICES.CANDY} currentVal={state.food} emoji="🍫" desc="Quick sugar rush." amount={10} />
        <PurchaseCard type="sleep" label="Allergy Meds" price={PRICES.ALLERGY} currentVal={state.sleep} emoji="🤧" desc="Clear head (+Sleep)." amount={20} />
        
        <PurchaseCard type="coffee" label="Bathroom" price={PRICES.BATHROOM} currentVal={state.coffee} emoji="🚽" desc="Nature calls." amount={5} />
        <PurchaseCard type="coffee" label="Cigarettes" price={PRICES.CIGARETTES} currentVal={state.coffee} emoji="🚬" desc="Take the edge off." amount={15} />
        <PurchaseCard type="sleep" label="Aspirin" price={PRICES.ASPIRIN} currentVal={state.sleep} emoji="💊" desc="Kill the headache." amount={15} />
      </div>

      <div className="mt-4 text-center text-slate-500 text-xs shrink-0 pt-4 border-t border-slate-800">
        Funds: ${state.cash.toFixed(2)}
      </div>
    </div>
  );
};
