export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface SubApplication {
  id: string;
  pid: string; // Product/Profile Identifier
  name: string;
  price: number;
  description: string;
}

export interface UserSubAppAccount {
  id: string;
  userId: string;
  pid: string;
  isActive: boolean;
  purchasedAt: string;
}

export interface CarbonLog {
  id: string;
  userId: string;
  category: 'transportation' | 'energy' | 'food' | 'waste';
  value: number; // in kg CO2e
  loggedDate: string;
  details?: Record<string, any>;
  createdAt: string;
}
