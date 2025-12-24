
import React, { useState } from 'react';
import { PaymentMethod } from '../types';
import { playClickSound, playBackSound } from '../services/soundEffects';

interface PaymentMethodsProps {
  existingMethods: PaymentMethod[];
  onAddMethod: (method: PaymentMethod) => void;
  onBack: () => void;
}

type PaymentType = 'CARD' | 'PAYPAL' | 'APPLE' | 'CARRIER' | 'GOOGLE_PLAY' | null;

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ existingMethods, onAddMethod, onBack }) => {
  const [view, setView] = useState<'LIST' | 'SELECT_TYPE' | 'FORM'>('LIST');
  const [selectedType, setSelectedType] = useState<PaymentType>(null);
  
  // Form States
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTypeSelect = (type: PaymentType) => {
    playClickSound();
    setSelectedType(type);
    setFormData({});
    setError(null);
    setView('FORM');
  };

  const validateForm = (): boolean => {
    if (selectedType === 'CARD') {
       if (!formData.number || formData.number.length < 12) {
         setError("Invalid Card Number. Please check and try again.");
         return false;
       }
       if (!formData.exp || !formData.cvv) {
         setError("Please fill out all card details.");
         return false;
       }
    }
    if (selectedType === 'PAYPAL') {
       if (!formData.email || !formData.email.includes('@')) {
         setError("Invalid PayPal email address.");
         return false;
       }
    }
    if (selectedType === 'CARRIER') {
       if (!formData.carrier || !formData.phone || formData.phone.length < 10) {
         setError("Please select carrier and enter a valid phone number.");
         return false;
       }
    }
    if (selectedType === 'GOOGLE_PLAY') {
       if (!formData.amount || formData.amount.length < 5) {
         setError("Invalid Gift Card Code.");
         return false;
       }
    }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    playClickSound();
    setError(null);
    setIsLoading(true);
    
    // Simulate API delay verification
    setTimeout(() => {
      let newMethod: PaymentMethod | null = null;
      const id = Date.now().toString();

      if (selectedType === 'CARD') {
        const last4 = formData.number.slice(-4);
        newMethod = {
          id, type: 'CARD', 
          label: `Credit Card ending in ${last4}`, 
          detail: `Expires ${formData.exp}`,
          icon: '💳'
        };
      } else if (selectedType === 'PAYPAL') {
        newMethod = {
          id, type: 'PAYPAL',
          label: formData.email,
          detail: 'Connected via PayPal',
          icon: '🅿️'
        };
      } else if (selectedType === 'APPLE') {
        newMethod = {
          id, type: 'APPLE',
          label: 'Apple Account',
          detail: `Balance: $${(25 + Math.random() * 50).toFixed(2)}`,
          icon: ''
        };
      } else if (selectedType === 'CARRIER') {
        newMethod = {
          id, type: 'CARRIER',
          label: `Bill to ${formData.carrier}`,
          detail: formData.phone,
          icon: '📱'
        };
      } else if (selectedType === 'GOOGLE_PLAY') {
        newMethod = {
          id, type: 'GOOGLE_PLAY',
          label: 'Google Play Balance',
          detail: `Redeemed: $25.00`,
          icon: '▶'
        };
      }

      if (newMethod) {
        onAddMethod(newMethod);
        setIsLoading(false);
        setView('LIST');
      } else {
        setIsLoading(false);
        setError("Verification failed. Try again.");
      }
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const renderList = () => (
    <div className="space-y-4">
      {existingMethods.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
          <div className="text-4xl mb-2">💸</div>
          <p className="text-slate-400">No payment methods saved.</p>
        </div>
      ) : (
        existingMethods.map(method => (
          <div key={method.id} className="bg-slate-800 p-4 rounded-xl flex items-center gap-4 border border-slate-700">
            <div className="text-3xl w-12 h-12 flex items-center justify-center bg-black/20 rounded-full">
              {method.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-white">{method.label}</div>
              <div className="text-sm text-slate-400">{method.detail}</div>
            </div>
            <div className="text-green-500 text-xl">✓</div>
          </div>
        ))
      )}

      <button 
        onClick={() => { setView('SELECT_TYPE'); playClickSound(); }}
        className="w-full bg-gradient-to-r from-taxi-yellow to-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <span className="text-xl">+</span> ADD PAYMENT METHOD
      </button>
      
      <div className="text-center text-xs text-slate-500 mt-4">
         Securely processed via App Store or Google Play Services.
      </div>
    </div>
  );

  const renderSelectType = () => (
    <div className="grid grid-cols-1 gap-3">
      <h3 className="text-slate-400 text-xs font-bold uppercase mb-2">Select Provider</h3>
      
      {[
        { type: 'CARD', label: 'Credit or Debit Card', icon: '💳' },
        { type: 'PAYPAL', label: 'PayPal', icon: '🅿️' },
        { type: 'APPLE', label: 'Apple Account', icon: '' },
        { type: 'CARRIER', label: 'Mobile Carrier Billing', icon: '📱' },
        { type: 'GOOGLE_PLAY', label: 'Google Play Gift Card', icon: '▶' },
      ].map(opt => (
        <button
          key={opt.type}
          onClick={() => handleTypeSelect(opt.type as PaymentType)}
          className="bg-slate-800 p-4 rounded-xl flex items-center gap-4 hover:bg-slate-700 transition-colors text-left"
        >
          <span className="text-2xl">{opt.icon}</span>
          <span className="font-bold">{opt.label}</span>
          <span className="ml-auto text-slate-500">→</span>
        </button>
      ))}
    </div>
  );

  const renderForm = () => {
    return (
      <div className="space-y-4 animate-pop-in">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <span className="text-3xl">
               {selectedType === 'CARD' && '💳'}
               {selectedType === 'PAYPAL' && '🅿️'}
               {selectedType === 'APPLE' && ''}
               {selectedType === 'CARRIER' && '📱'}
               {selectedType === 'GOOGLE_PLAY' && '▶'}
            </span>
            <h3 className="font-bold text-xl">Enter Details</h3>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 p-3 rounded text-red-200 text-sm mb-4">
                {error}
              </div>
            )}

            {selectedType === 'CARD' && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Card Number</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000 0000" 
                    className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white font-mono"
                    onChange={(e) => handleInputChange('number', e.target.value)}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white font-mono"
                      onChange={(e) => handleInputChange('exp', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">CVV</label>
                    <input 
                      type="text" 
                      placeholder="123" 
                      className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white font-mono"
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {selectedType === 'PAYPAL' && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">PayPal Email</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white"
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white" />
                </div>
              </>
            )}

            {selectedType === 'APPLE' && (
              <div className="text-center py-4">
                <p className="mb-4 text-slate-300">Link your Apple Account to use your balance for upgrades.</p>
                <div className="bg-black/40 p-3 rounded font-mono text-green-400 mb-4">Balance Available</div>
                <button className="text-blue-400 underline text-sm">Manage Funds via App Store</button>
              </div>
            )}

            {selectedType === 'CARRIER' && (
              <>
                <div>
                   <label className="block text-xs text-slate-400 mb-1">Select Carrier</label>
                   <select 
                     className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white"
                     onChange={(e) => handleInputChange('carrier', e.target.value)}
                   >
                      <option value="">Select...</option>
                      <option value="Verizon">Verizon</option>
                      <option value="T-Mobile">T-Mobile</option>
                      <option value="AT&T">AT&T</option>
                      <option value="Sprint">Sprint</option>
                   </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="(555) 555-5555" 
                    className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white"
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </>
            )}

            {selectedType === 'GOOGLE_PLAY' && (
              <>
                 <div className="bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-lg mb-4 flex items-center gap-3">
                    <span className="text-3xl">🎁</span>
                    <div className="text-xs text-slate-300">Scratch off the back of your card and enter the code below.</div>
                 </div>
                 <div>
                  <label className="block text-xs text-slate-400 mb-1">Gift Card Code</label>
                  <input 
                    type="text" 
                    placeholder="XXXX-XXXX-XXXX-XXXX" 
                    className="w-full bg-black/30 border border-slate-600 rounded p-3 text-white font-mono uppercase tracking-widest"
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                  />
                </div>
              </>
            )}

            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white font-bold py-4 rounded-lg shadow-lg mt-6 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>Verifying...</span>
                </>
              ) : (
                'SAVE PAYMENT METHOD'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 font-body">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display text-white tracking-wider flex items-center gap-2">
          {view === 'LIST' ? 'WALLET' : 'ADD METHOD'}
        </h2>
        <button 
          onClick={() => {
            if (view === 'LIST') onBack();
            else setView('LIST');
            playBackSound();
          }} 
          className="text-sm text-slate-400 font-bold px-3 py-1 bg-slate-800 rounded hover:bg-slate-700"
        >
          {view === 'LIST' ? 'DONE' : 'CANCEL'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {view === 'LIST' && renderList()}
        {view === 'SELECT_TYPE' && renderSelectType()}
        {view === 'FORM' && renderForm()}
      </div>
    </div>
  );
};
