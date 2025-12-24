
import React, { useState } from 'react';
import { Driver, Addon, PaymentMethod } from '../types';
import { DriverAvatar, AVAILABLE_ADDONS } from '../constants';
import { playClickSound, playBackSound } from '../services/soundEffects';

interface StoreProps {
  drivers: Driver[];
  onBuyDriver: (id: string) => void;
  onBuyAddon: (id: string) => void;
  onBuyCash: (amount?: number) => void;
  onSelectDriver: (id: string) => void;
  currentDriverId: string;
  ownedAddonIds: string[];
  savedPaymentMethods: PaymentMethod[];
  onBack: () => void;
  onManagePayments: () => void;
}

export const Store: React.FC<StoreProps> = ({ 
  drivers, 
  onBuyDriver, 
  onBuyAddon,
  onBuyCash,
  onSelectDriver, 
  currentDriverId, 
  ownedAddonIds,
  savedPaymentMethods,
  onBack,
  onManagePayments
}) => {
  const [tab, setTab] = useState<'drivers' | 'upgrades' | 'bank'>('drivers');
  const [purchasingItem, setPurchasingItem] = useState<{ type: 'driver' | 'addon' | 'cash', item: Driver | Addon | { name: string, price: number, icon: string, cashAmount?: number } } | null>(null);
  const [platform, setPlatform] = useState<'apple' | 'google'>('apple');
  const [processing, setProcessing] = useState(false);

  const initiatePurchase = (item: any, type: 'driver' | 'addon' | 'cash') => {
    playClickSound();
    setPurchasingItem({ type, item });
  };

  const confirmPurchase = () => {
    if (!purchasingItem) return;
    playClickSound();
    setProcessing(true);
    setTimeout(() => {
      if (purchasingItem.type === 'driver') {
        onBuyDriver((purchasingItem.item as Driver).id);
      } else if (purchasingItem.type === 'addon') {
        onBuyAddon((purchasingItem.item as Addon).id);
      } else if (purchasingItem.type === 'cash') {
        const amount = (purchasingItem.item as any).cashAmount || 50;
        onBuyCash(amount);
      }
      setProcessing(false);
      setPurchasingItem(null);
    }, 2000);
  };

  // Helper to get a preferred payment method to display in the mock sheet
  const getPreferredMethod = () => {
    if (savedPaymentMethods.length > 0) {
       return savedPaymentMethods[0];
    }
    return null;
  };

  const preferredMethod = getPreferredMethod();

  const handleTabChange = (newTab: 'drivers' | 'upgrades' | 'bank') => {
    playClickSound();
    setTab(newTab);
  };

  const renderDriverList = () => (
    <div className="space-y-4">
      {drivers.map(driver => (
        <div key={driver.id} className={`relative p-4 rounded-xl border-2 transition-all ${driver.id === currentDriverId ? 'border-taxi-yellow bg-slate-800' : 'border-slate-700 bg-slate-800/50'}`}>
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 shrink-0">
              <DriverAvatar 
                color={driver.imageColor} 
                src={driver.avatarBase64} 
                className="w-full h-full" 
              />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg">{driver.name}</h3>
                {driver.owned ? (
                  driver.id === currentDriverId ? (
                    <span className="bg-taxi-yellow text-black text-xs font-bold px-2 py-1 rounded">ACTIVE</span>
                  ) : (
                    <button 
                      onClick={() => onSelectDriver(driver.id)}
                      className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold px-3 py-1 rounded"
                    >
                      SELECT
                    </button>
                  )
                ) : (
                  <span className="text-green-400 font-bold font-mono">${driver.price}</span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-1">{driver.car}</p>
              <p className="text-slate-500 text-xs italic mt-1">"{driver.description}"</p>
              <div className="mt-3 bg-slate-900/50 p-2 rounded text-xs text-yellow-200 border border-yellow-900/30">
                <span className="font-bold">PERK:</span> {driver.perks}
              </div>
            </div>
          </div>
          {!driver.owned && (
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => initiatePurchase(driver, 'driver')}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <span>UNLOCK</span>
                <span className="bg-green-800 px-1 rounded text-xs opacity-70">USD</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderUpgradesList = () => (
    <div className="space-y-4">
       <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/30 text-sm text-blue-200 mb-4">
          <span className="text-xl mr-2">💡</span>
          Buying items increases your <strong>TIPS</strong> at the end of every shift!
       </div>

      {AVAILABLE_ADDONS.map(addon => {
        const isOwned = ownedAddonIds.includes(addon.id);
        return (
          <div key={addon.id} className={`relative p-4 rounded-xl border-2 transition-all ${isOwned ? 'border-green-500 bg-slate-800' : 'border-slate-700 bg-slate-800/50'}`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 bg-slate-700 rounded-full flex items-center justify-center text-4xl border-2 border-slate-600">
                {addon.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{addon.name}</h3>
                  {isOwned ? (
                    <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">OWNED</span>
                  ) : (
                    <span className="text-green-400 font-bold font-mono">${addon.price}</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1">{addon.description}</p>
                <div className="mt-2 text-yellow-400 text-xs font-bold flex flex-wrap gap-2">
                   <span>+{(addon.tipBonus * 100).toFixed(0)}% EXTRA TIPS</span>
                   {addon.fareBonus && (
                      <span className="text-green-400">+{(addon.fareBonus * 100).toFixed(0)}% BASE FARE</span>
                   )}
                </div>
              </div>
            </div>
            {!isOwned && (
              <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => initiatePurchase(addon, 'addon')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>BUY ITEM</span>
                  <span className="bg-blue-800 px-1 rounded text-xs opacity-70">USD</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderBankList = () => (
    <div className="space-y-4">
       <div className="bg-green-900/30 p-4 rounded-xl border border-green-500/30 text-sm text-green-200 mb-4">
          <span className="text-xl mr-2">💰</span>
          Need cash fast? Top up your balance to keep driving!
       </div>

       {/* $50 Bundle */}
       <div className="relative p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 bg-yellow-500 rounded-full flex items-center justify-center text-4xl border-4 border-yellow-300 shadow-lg">
                💵
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-yellow-400">Stack of Cash</h3>
                  <span className="text-green-400 font-bold font-mono">$1.99</span>
                </div>
                <p className="text-slate-300 text-sm mt-1">Instantly add <span className="text-white font-bold">$50.00</span> to your game balance.</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => initiatePurchase({ name: 'Stack of Cash ($50)', price: 1.99, icon: '💵', cashAmount: 50 }, 'cash')}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>BUY NOW</span>
                  <span className="bg-yellow-800/20 px-1 rounded text-xs opacity-70">USD</span>
                </button>
            </div>
       </div>

       {/* $150 Bundle */}
       <div className="relative p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 bg-yellow-500 rounded-full flex items-center justify-center text-4xl border-4 border-yellow-300 shadow-lg">
                💰
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-yellow-400">Big Bag of Cash</h3>
                  <span className="text-green-400 font-bold font-mono">$3.99</span>
                </div>
                <p className="text-slate-300 text-sm mt-1">Instantly add <span className="text-white font-bold">$150.00</span> to your game balance.</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => initiatePurchase({ name: 'Big Bag of Cash ($150)', price: 3.99, icon: '💰', cashAmount: 150 }, 'cash')}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>BUY NOW</span>
                  <span className="bg-yellow-800/20 px-1 rounded text-xs opacity-70">USD</span>
                </button>
            </div>
       </div>

       {/* $300 Bundle */}
       <div className="relative p-4 rounded-xl border-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 shrink-0 bg-yellow-500 rounded-full flex items-center justify-center text-4xl border-4 border-yellow-300 shadow-lg">
                🏦
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-yellow-400">Bank Vault</h3>
                  <span className="text-green-400 font-bold font-mono">$5.99</span>
                </div>
                <p className="text-slate-300 text-sm mt-1">Instantly add <span className="text-white font-bold">$300.00</span> to your game balance.</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => initiatePurchase({ name: 'Bank Vault ($300)', price: 5.99, icon: '🏦', cashAmount: 300 }, 'cash')}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <span>BUY NOW</span>
                  <span className="bg-yellow-800/20 px-1 rounded text-xs opacity-70">USD</span>
                </button>
            </div>
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 overflow-hidden relative font-body">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-3xl font-display text-taxi-yellow tracking-wider">STORE</h2>
        <button onClick={onBack} className="text-sm underline text-slate-400">Back to Garage</button>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4 shrink-0">
        <button 
          onClick={() => handleTabChange('drivers')}
          className={`flex-1 py-3 rounded-lg font-bold transition-colors ${tab === 'drivers' ? 'bg-taxi-yellow text-black' : 'bg-slate-800 text-slate-400'}`}
        >
          DRIVERS
        </button>
        <button 
          onClick={() => handleTabChange('upgrades')}
          className={`flex-1 py-3 rounded-lg font-bold transition-colors ${tab === 'upgrades' ? 'bg-taxi-yellow text-black' : 'bg-slate-800 text-slate-400'}`}
        >
          UPGRADES
        </button>
        <button 
          onClick={() => handleTabChange('bank')}
          className={`flex-1 py-3 rounded-lg font-bold transition-colors ${tab === 'bank' ? 'bg-taxi-yellow text-black' : 'bg-slate-800 text-slate-400'}`}
        >
          BANK
        </button>
      </div>

      {/* Platform Simulation Toggle */}
      <div className="flex justify-center gap-3 mb-4 text-xs shrink-0">
         <span className="text-slate-500 uppercase font-bold self-center">Simulate:</span>
         <button 
           onClick={() => { setPlatform('apple'); playClickSound(); }}
           className={`px-3 py-1 rounded-full border transition-all ${platform === 'apple' ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-slate-500 border-slate-700'}`}
         >
            App Store
         </button>
         <button 
           onClick={() => { setPlatform('google'); playClickSound(); }}
           className={`px-3 py-1 rounded-full border transition-all ${platform === 'google' ? 'bg-[#01875f] text-white border-[#01875f] font-bold' : 'bg-transparent text-slate-500 border-slate-700'}`}
         >
           ▶ Google Play
         </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 pr-1">
         {/* Payment Info Banner */}
         <button 
           onClick={onManagePayments}
           className="w-full bg-slate-800/50 border border-slate-600 p-3 rounded-lg flex items-center gap-4 text-left hover:bg-slate-700 transition-colors group mb-4"
         >
           <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">
             💳
           </div>
           <div className="flex-1">
             <div className="font-bold text-white text-sm">Payment Methods</div>
             <div className="text-xs text-slate-400">Add Card, PayPal, or Gift Card</div>
             {savedPaymentMethods.length > 0 && (
                <div className="text-xs text-green-400 font-bold mt-1">✓ {savedPaymentMethods.length} Saved</div>
             )}
           </div>
           <span className="text-slate-500">→</span>
         </button>

         {tab === 'drivers' && renderDriverList()}
         {tab === 'upgrades' && renderUpgradesList()}
         {tab === 'bank' && renderBankList()}
      </div>

      {/* Mock Purchase Sheet */}
      {purchasingItem && (
        <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
           
           {/* APPLE STYLE SHEET */}
           {platform === 'apple' && (
             <div className="bg-[#1c1c1e] w-full max-w-sm sm:rounded-2xl rounded-t-2xl p-6 text-white animate-pop-in relative overflow-hidden shadow-2xl border-t border-gray-700 sm:border-0">
                {/* Drag Handle */}
                <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-6 sm:hidden"></div>

                <div className="flex justify-between items-start mb-6">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 border border-gray-600 flex items-center justify-center text-3xl">
                         {purchasingItem.type === 'driver' 
                           ? <img src={(purchasingItem.item as Driver).avatarBase64} alt="icon" className="w-full h-full object-cover" />
                           : (purchasingItem.item as any).icon
                         }
                      </div>
                      <div>
                         <div className="font-bold text-lg leading-tight">{(purchasingItem.item as any).name}</div>
                         <div className="text-gray-400 text-sm">Rideshare Randy: The Hustle</div>
                         <div className="text-gray-500 text-xs mt-1">Offers In-App Purchases</div>
                      </div>
                   </div>
                </div>
                
                <div className="border-t border-gray-700 py-4 flex justify-between items-center mb-2">
                   <span className="text-gray-400">Total</span>
                   <span className="text-2xl font-bold">${(purchasingItem.item as any).price}</span>
                </div>

                <div className="bg-[#2c2c2e] rounded-lg p-3 mb-6 flex items-center justify-between cursor-pointer hover:bg-[#3a3a3c] transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="bg-white text-black px-1.5 py-0.5 rounded text-[10px] font-serif font-bold border border-gray-300">
                        Pay
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{preferredMethod ? preferredMethod.label : 'Apple Pay'}</span>
                        <span className="text-[10px] text-gray-400">{preferredMethod ? preferredMethod.detail : 'Visa •••• 1234'}</span>
                      </div>
                   </div>
                   <div className="text-blue-500 text-sm">›</div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-800">
                   <button 
                     disabled={processing}
                     onClick={confirmPurchase}
                     className="w-full bg-[#007AFF] hover:bg-blue-500 py-3 rounded-xl font-bold text-lg relative transition-all active:scale-[0.98]"
                   >
                     {processing ? (
                        <span className="animate-pulse">Processing...</span>
                     ) : (
                        'Double Click to Pay'
                     )}
                     <div className="absolute -right-6 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-400/50 rounded-full animate-pulse"></div>
                   </button>
                   <button 
                     onClick={() => { setPurchasingItem(null); playBackSound(); }}
                     className="w-full py-2 text-[#007AFF] font-bold text-sm"
                   >
                     Cancel
                   </button>
                </div>
             </div>
           )}

           {/* GOOGLE STYLE SHEET */}
           {platform === 'google' && (
             <div className="bg-white w-full max-w-xs rounded-xl text-gray-900 shadow-2xl overflow-hidden animate-pop-in mb-10 sm:mb-0">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                   <span className="text-[#01875f] text-xl">▶</span>
                   <span className="font-bold text-gray-600 text-sm">Google Play</span>
                </div>
                
                <div className="p-6">
                   <div className="flex gap-4 mb-6">
                      <div className="w-12 h-12 bg-gray-200 rounded shadow-sm overflow-hidden flex items-center justify-center text-2xl">
                        {purchasingItem.type === 'driver' 
                           ? <img src={(purchasingItem.item as Driver).avatarBase64} alt="icon" className="w-full h-full object-cover" />
                           : (purchasingItem.item as any).icon
                         }
                      </div>
                      <div>
                         <div className="font-bold text-gray-900">{(purchasingItem.item as any).name}</div>
                         <div className="text-sm text-gray-500">${(purchasingItem.item as any).price}</div>
                      </div>
                   </div>

                   <div className="space-y-3 mb-6">
                     <div className="flex items-center gap-3 text-sm text-gray-700 border rounded-lg p-3 hover:bg-gray-50 cursor-pointer">
                        <div className="w-8 h-5 bg-blue-900 rounded flex items-center justify-center text-white text-[8px] font-bold">
                           {preferredMethod?.type === 'CARD' ? 'VISA' : (preferredMethod?.icon || 'PAY')}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-xs">{preferredMethod ? preferredMethod.label : 'Visa •••• 4242'}</div>
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 border-[#01875f] flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#01875f] rounded-full"></div>
                        </div>
                     </div>
                     
                     <div className="text-xs text-gray-500 text-center">
                       + Tax: $0.00
                     </div>
                   </div>

                   <button 
                     onClick={confirmPurchase}
                     disabled={processing}
                     className="w-full bg-[#01875f] text-white font-bold py-3 rounded-lg shadow-sm hover:bg-[#01704f] transition-colors flex justify-center items-center gap-2"
                   >
                     {processing ? 'Working...' : '1-Tap Buy'}
                   </button>
                </div>
                <button 
                  onClick={() => { setPurchasingItem(null); playBackSound(); }} 
                  className="w-full py-3 text-sm text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                >
                  Cancel
                </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
};
