
import { ReactNode } from 'react';

export interface Driver {
  id: string;
  name: string;
  car: string;
  carDescription?: string; // Optional: displayed on the home screen
  description: string;
  imageColor: string; // Fallback visual
  avatarBase64?: string; // Generated image
  price: number; // 0 for free
  owned: boolean;
  perks: string;
  personality: string;
  voiceId: string; // Gemini TTS Voice Name
  isEV?: boolean; // New: Flag for electric vehicles
  tipMultiplier?: number; // New: Driver-specific tip bonus
  quotes: {
    select: string[];
    tap: string[];
    miss: string[];
  };
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
  icon: ReactNode; // Changed from string to ReactNode
  tipBonus: number; // Percentage multiplier (e.g. 0.10 for 10%)
  fareBonus?: number; // Percentage multiplier for base fare (e.g. 0.20 for 20%)
}

export interface Challenge {
  id: string;
  description: string;
  target: number;
  progress: number;
  reward: number; // Cash reward
  isCompleted: boolean;
  type: 'EARN_CASH' | 'NO_FINES' | 'SCORE_POINTS' | 'COMPLETE_SHIFTS'; 
  condition?: {
    driverId?: string; // If set, only counts for this driver
    environment?: string; // If set, only counts in this env
  };
}

export interface Passenger {
  id: string;
  type: string; // Display name e.g. "Quiet Commuter"
  description: string;
  destination: string;
  visualDescription: string; // For image generation prompt
}

export interface Obstacle {
  id: string;
  name: string;
  description: string;
  visualDescription: string;
  fee: number; // Cancellation fee earning
}

export interface Decision {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  options: {
    label: string;
    reward: number; // Cash amount
    resultText: string;
    isCorrect: boolean; // Visual flair
  }[];
}

export interface PaymentMethod {
  id: string;
  type: 'CARD' | 'PAYPAL' | 'APPLE' | 'CARRIER' | 'GOOGLE_PLAY';
  label: string; // Display name e.g. "Visa ...4242"
  detail: string; // Subtitle e.g. "Exp 12/25"
  icon: string;
}

export interface GameState {
  cash: number;
  gas: number;      // 0-100
  coffee: number;   // 0-100 (Energy)
  food: number;     // 0-100 (Hunger)
  sleep: number;    // 0-100 (Fatigue)
  currentDriverId: string;
  ownedAddonIds: string[];
  savedPaymentMethods: PaymentMethod[];
  score: number;
  highScore: number;
  shiftCount: number;
  challenges: Challenge[];
  lastChallengeResetTime: number;
  lastDailyBonus: number;
}

export type Screen = 'HOME' | 'GAME' | 'STORE' | 'SUMMARY' | 'REST_STOP' | 'PAYMENT_METHODS';

export enum Environment {
  GROCERY = 'Grocery Store Parking Lot',
  CITY = 'Busy City Street',
  PARK = 'City Park',
  BOARDWALK = 'Ocean Boardwalk',
  APARTMENT = 'Luxury Apartment Complex',
  AIRPORT = 'Airport Departures Terminal',
  DOWNTOWN = 'Downtown Business District',
  HOTEL = 'Fancy Hotel Valet',
  RESTAURANT = 'Restaurant Row at Night',
  SUBURBS = 'Quiet Suburban Street',
  GAS_STATION = 'Neon Gas Station at Night',
  SKYLINE = 'Atlanta Skyline at Dusk',
  HIGHWAY = 'Overpass Above a Busy Highway',
  STADIUM = 'Sports Stadium Entrance'
}

export const ENVIRONMENTS = [
  Environment.GROCERY,
  Environment.CITY,
  Environment.PARK,
  Environment.BOARDWALK,
  Environment.APARTMENT,
  Environment.AIRPORT,
  Environment.DOWNTOWN,
  Environment.HOTEL,
  Environment.RESTAURANT,
  Environment.SUBURBS,
  Environment.GAS_STATION,
  Environment.SKYLINE,
  Environment.HIGHWAY,
  Environment.STADIUM
];
