
import React from 'react';
import { GameState, Driver } from '../types';

interface ResourceBarProps {
  state: GameState;
  currentDriver: Driver;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ state, currentDriver }) => {
  const getBarColor = (val: number) => {
    if (val < 20) return 'bg-red-500';
    if (val < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const isEV = !!currentDriver.isEV;

  return (
    <div className="w-full bg-slate-900 border-b border-slate-700 p-2 flex flex-col gap-2 shadow-xl sticky top-0 z-50">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-1">
          <span className="text-green-400 font-bold text-xl">$</span>
          <span className="text-white font-mono text-xl">{state.cash.toFixed(2)}</span>
        </div>
        <div className="text-slate-400 text-sm font-bold">SHIFT #{state.shiftCount}</div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-300">
        
        <div className="flex flex-col">
          <div className="flex justify-between"><span>{isEV ? 'CHRG' : 'GAS'}</span></div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(state.gas)} transition-all duration-300`} style={{ width: `${state.gas}%` }}></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between"><span>NRG</span></div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(state.coffee)} transition-all duration-300`} style={{ width: `${state.coffee}%` }}></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between"><span>EAT</span></div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(state.food)} transition-all duration-300`} style={{ width: `${state.food}%` }}></div>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex justify-between"><span>SLP</span></div>
          <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full ${getBarColor(state.sleep)} transition-all duration-300`} style={{ width: `${state.sleep}%` }}></div>
          </div>
        </div>

      </div>
    </div>
  );
};
