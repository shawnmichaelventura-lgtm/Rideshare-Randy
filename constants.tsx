
import { Driver, Addon, Challenge, Passenger, Obstacle, Decision } from './types';
import React from 'react';

export const DriverAvatar = ({ 
  color, 
  className, 
  src 
}: { 
  color: string, 
  className?: string, 
  src?: string 
}) => {
  return (
    <div className={`relative rounded-full border-4 border-white shadow-[0_4px_0_rgba(0,0,0,0.2)] overflow-hidden flex items-center justify-center ${color} ${className}`}>
      {src ? (
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3/4 h-3/4 text-white/80 animate-pulse">
          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );
};

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'randy',
    name: 'Rideshare Randy',
    car: '2017 Corolla',
    description: 'Grumpy driver from Boston',
    imageColor: 'bg-stone-600',
    price: 0,
    owned: true,
    perks: 'None.',
    personality: 'Grumpy.',
    voiceId: 'Fenrir',
    quotes: {
      select: ["Let's go.", "Whatever.", "Coffee time."],
      tap: ["Gotcha.", "Don't eat that.", "5 stars.", "Hurry."],
      miss: ["Hey!", "Nope.", "Watch it!"]
    }
  },
  {
    id: 'skyler',
    name: 'Skyler',
    car: 'Tesla Model 3',
    description: 'Tech geek',
    imageColor: 'bg-cyan-500',
    price: 0.99,
    owned: false,
    perks: 'EV: No Gas needed.',
    personality: 'Tech-obsessed.',
    voiceId: 'Zephyr',
    isEV: true, // Configured as EV
    quotes: {
      select: ["Auto-pilot on.", "Charging..."],
      tap: ["Silent.", "Clean energy.", "Future."],
      miss: ["Access denied.", "404 Error."]
    }
  },
  {
    id: 'samalie',
    name: 'Samalie',
    car: 'Honda Civic',
    description: 'Friendly driver',
    imageColor: 'bg-rose-500',
    price: 0.99,
    owned: false,
    perks: '+10% Cash.',
    personality: 'Friendly.',
    voiceId: 'Kore',
    quotes: {
      select: ["Hola!", "Ready?"],
      tap: ["Gracias!", "Nice.", "Safe trip."],
      miss: ["Ay no!", "Whoops!"]
    }
  },
  {
    id: 'jason',
    name: 'Jason',
    car: 'Ford Explorer',
    description: 'Funny Driver',
    imageColor: 'bg-orange-700',
    price: 0.99,
    owned: false,
    perks: 'Energy saver.',
    personality: 'Funny.',
    voiceId: 'Puck',
    quotes: {
      select: ["Let's roll!", "Buckle up!"],
      tap: ["Honk honk!", "Easy!", "Sport!"],
      miss: ["Not me!", "Wrong car!"]
    }
  },
  {
    id: 'tran',
    name: 'Tran',
    car: 'Toyota 4Runner',
    description: 'Chatty driver',
    imageColor: 'bg-blue-600',
    price: 1.99,
    owned: false,
    perks: 'Extra tips.',
    personality: 'Talkative.',
    voiceId: 'Puck',
    quotes: {
      select: ["My friend!", "Let's go!"],
      tap: ["Yes!", "Money!", "Story time!"],
      miss: ["No no!", "Wrong one!"]
    }
  },
  {
    id: 'sharonda',
    name: 'Sharonda',
    car: 'Tesla Model X', // Updated car to EV
    description: 'Sassy driver',
    imageColor: 'bg-purple-600',
    price: 1.99,
    owned: false,
    perks: 'EV: No Gas. +20% Tips.', // Updated perks
    personality: 'Bold.',
    voiceId: 'Kore',
    isEV: true, // Updated to EV
    tipMultiplier: 0.20, // 20% tip bonus
    quotes: {
      select: ["Mmhmm.", "Let's move."],
      tap: ["I see you.", "Classy.", "Work it."],
      miss: ["Excuse me?", "Back up."]
    }
  }
];

export const PASSENGERS: Passenger[] = [
  {
    id: 'p_quiet',
    type: 'Quiet Professional',
    description: 'Just wants to get there.',
    destination: 'Downtown',
    visualDescription: 'Professional woman on phone.'
  },
  {
    id: 'p_chatty',
    type: 'Chatty Local',
    description: 'Loves to talk.',
    destination: 'Market',
    visualDescription: 'Friendly guy smiling.'
  },
  {
    id: 'p_biz',
    type: 'Business Man',
    description: 'In a rush.',
    destination: 'Airport',
    visualDescription: 'Stressed man in suit.'
  },
  {
    id: 'p_tattoo',
    type: 'Rocker Girl',
    description: 'Cool vibes.',
    destination: 'Concert Hall',
    visualDescription: 'Edgy woman with tattoos.'
  },
  {
    id: 'p_chill',
    type: 'Chill Dude',
    description: 'Relaxed.',
    destination: 'Suburbs',
    visualDescription: 'Guy in hoodie relaxed.'
  },
  {
    id: 'p_old',
    type: 'Sports Fan',
    description: 'Going to the game.',
    destination: 'Stadium',
    visualDescription: 'Old man in jersey.'
  }
];

export const GAMEPLAY_QUOTES = [
  "I grew up in Boston",
  "I recommend ponce city market.",
  "the beach is about 5 hours away.",
  "It does get hot in Atlanta",
  "The blue ridge mountains are beautiful",
  "I'm going to a conference",
  "work meeting",
  "going to a Concert",
  "Can I borrow your charger?",
  "Where are you coming from?",
  "Is it ok if I eat in here?",
  "Turn the music up?",
  "It's cold in here.",
  "Nice car!",
  "What's your rating?",
  "I'm running late!"
];

export const AVAILABLE_ADDONS: Addon[] = [
  { id: 'dashcam', name: 'Premium Dashcam', price: 9.99, description: 'Records everything. Reduces fines.', icon: '📹', tipBonus: 0.05 },
  { id: 'scent', name: 'New Car Scent', price: 4.99, description: 'Smells like success.', icon: '🌲', tipBonus: 0.10 },
  { 
    id: 'aux', 
    name: 'Phone Charger', 
    price: 14.99, 
    description: 'Universal compatibility. 5-star essential.', 
    icon: (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white">
        <rect x="6" y="14" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.9" />
        <path d="M12 14V8C12 7 12.5 6 14 6H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="14" y="4.5" width="4" height="3" rx="0.5" fill="currentColor" />
        <path d="M10 17.5H14" stroke="black" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      </svg>
    ), 
    tipBonus: 0.15 
  },
  { id: 'water', name: 'Sparkling Water', price: 19.99, description: 'For fancy riders.', icon: '🍾', tipBonus: 0.20, fareBonus: 0.05 },
  {
    id: 'car_electric',
    name: 'Electric EV Upgrade',
    price: 9.99,
    description: 'Silent motor and zero emissions.',
    icon: '⚡',
    tipBonus: 0.25,
    fareBonus: 0.20
  },
  {
    id: 'car_yukon',
    name: 'GMC Yukon XL',
    price: 14.99,
    description: 'Massive SUV for big groups.',
    icon: '🚙',
    tipBonus: 0.35,
    fareBonus: 0.20
  },
  {
    id: 'car_luxury',
    name: 'Luxury Black Sedan',
    price: 19.99,
    description: 'Premium service for high-end clients.',
    icon: '💎',
    tipBonus: 0.40,
    fareBonus: 0.20
  }
];

export const OBSTACLES: Obstacle[] = [
  { id: 'o_sick', name: 'Car Sick', description: 'Passenger looks green.', visualDescription: 'Sick face emoji', fee: 1.50 },
  { id: 'o_text', name: 'Texting', description: 'Passenger wont look up.', visualDescription: 'Phone screen', fee: 1.50 },
  { id: 'o_late', name: 'Running Late', description: 'Hurry up!', visualDescription: 'Stopwatch', fee: 1.50 }
];

export const DECISIONS: Decision[] = [
  {
    id: 'd_shortcut',
    title: 'Short Cut?',
    prompt: 'Take the alleyway to save time?',
    icon: '🛣️',
    options: [
      { label: 'Yes', reward: 5, resultText: 'Fast!', isCorrect: true },
      { label: 'No', reward: 0, resultText: 'Safe route.', isCorrect: false }
    ]
  },
  {
    id: 'd_music',
    title: 'Radio Station',
    prompt: 'Passenger wants Jazz. Change it?',
    icon: '📻',
    options: [
      { label: 'Jazz', reward: 2, resultText: 'Smooth.', isCorrect: true },
      { label: 'Rock', reward: -2, resultText: 'Too loud!', isCorrect: false }
    ]
  }
];

export const PRICES = {
  GAS: 20, // Gas and EV charge price
  COFFEE: 1,
  FOOD: 2,
  MOTEL: 10,
  WATER: 0.50,
  CANDY: 0.50,
  ALLERGY: 1,
  BATHROOM: 0,
  CIGARETTES: 2,
  ASPIRIN: 1
};

export const CHALLENGE_TEMPLATES: Partial<Challenge>[] = [
  { description: 'Earn $100 total', target: 100, reward: 20, type: 'EARN_CASH' },
  { description: 'Score 500 points', target: 500, reward: 50, type: 'SCORE_POINTS' },
  { description: 'Complete 5 shifts', target: 5, reward: 15, type: 'COMPLETE_SHIFTS' },
  { description: 'Clean shift (No fines)', target: 3, reward: 30, type: 'NO_FINES' }
];
