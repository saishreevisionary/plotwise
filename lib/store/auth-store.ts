'use client';

import { UserRole, UserProfile, BrokerCode, PlotHold } from '@/types';

const AUTH_SESSION_KEY = 'plotwise_ai_current_session_v2';
const USERS_STORAGE_KEY = 'plotwise_ai_registered_users_v2';
const BROKER_CODES_STORAGE_KEY = 'plotwise_ai_broker_codes_v2';
const PLOT_HOLDS_STORAGE_KEY = 'plotwise_ai_plot_holds_v2';

export const DEFAULT_ADMIN: UserProfile = {
  id: 'usr-admin-1',
  name: 'Alex Morgan',
  email: 'admin@plotwise.ai',
  password: 'admin',
  role: 'admin',
  agency_name: 'Green Valley Developers (Master Admin)',
  phone: '+91 98000 00000',
  created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
};

export const INITIAL_BROKERS: UserProfile[] = [
  {
    id: 'usr-broker-1',
    name: 'Dr. Vikram Mehta',
    email: 'vikram.mehta@realtybrokers.com',
    password: 'password123',
    role: 'broker',
    broker_code: 'BRK-VIP-909',
    agency_name: 'Apex Realty Group',
    phone: '+91 98765 43210',
    created_by_id: 'usr-admin-1',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'usr-broker-2',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@primeestate.com',
    password: 'password123',
    role: 'broker',
    broker_code: 'AGENT-SHARMA-42',
    agency_name: 'Prime Estate Brokers',
    phone: '+91 98123 45678',
    created_by_id: 'usr-admin-1',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'usr-broker-3',
    name: 'Amit Patel',
    email: 'amit.patel@metroprop.com',
    password: 'password123',
    role: 'broker',
    broker_code: 'PROP-EXPERT-77',
    agency_name: 'Metro PropTech Partners',
    phone: '+91 99000 11223',
    created_by_id: 'usr-admin-1',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export const INITIAL_CLIENTS: UserProfile[] = [
  {
    id: 'usr-client-1',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@gmail.com',
    password: 'password123',
    role: 'client',
    broker_code: 'BRK-VIP-909',
    assigned_broker_id: 'usr-broker-1',
    phone: '+91 98123 45678',
    created_by_id: 'usr-broker-1',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'usr-client-2',
    name: 'Priya Verma',
    email: 'priya.verma@outlook.com',
    password: 'password123',
    role: 'client',
    broker_code: 'BRK-VIP-909',
    assigned_broker_id: 'usr-broker-1',
    phone: '+91 97777 88888',
    created_by_id: 'usr-broker-1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

export const INITIAL_BROKER_CODES: BrokerCode[] = [
  {
    code: 'BRK-VIP-909',
    broker_id: 'usr-broker-1',
    broker_name: 'Dr. Vikram Mehta',
    agency_name: 'Apex Realty Group',
    phone: '+91 98765 43210',
    commission_rate: 2.5,
    active_clients: 14,
    total_sales: 18400000,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    code: 'AGENT-SHARMA-42',
    broker_id: 'usr-broker-2',
    broker_name: 'Sarah Jenkins',
    agency_name: 'Prime Estate Brokers',
    phone: '+91 98123 45678',
    commission_rate: 2.0,
    active_clients: 8,
    total_sales: 12000000,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    code: 'PROP-EXPERT-77',
    broker_id: 'usr-broker-3',
    broker_name: 'Amit Patel',
    agency_name: 'Metro PropTech Partners',
    phone: '+91 99000 11223',
    commission_rate: 3.0,
    active_clients: 21,
    total_sales: 31500000,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

export class AuthStore {
  // Get all registered users
  static getAllUsers(): UserProfile[] {
    if (typeof window === 'undefined') return [DEFAULT_ADMIN, ...INITIAL_BROKERS, ...INITIAL_CLIENTS];

    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    const initial = [DEFAULT_ADMIN, ...INITIAL_BROKERS, ...INITIAL_CLIENTS];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  // Get active logged-in session user
  static getCurrentUser(): UserProfile {
    if (typeof window === 'undefined') return DEFAULT_ADMIN;

    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    this.setCurrentUser(DEFAULT_ADMIN);
    return DEFAULT_ADMIN;
  }

  static setCurrentUser(user: UserProfile) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
      } catch (e) {}
    }
  }

  static logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_SESSION_KEY);
      window.location.href = '/login';
    }
  }

  // Admin registers a new Broker
  static registerBroker(data: {
    name: string;
    email: string;
    agency_name: string;
    phone: string;
    commission_rate?: number;
    broker_code?: string;
  }): UserProfile {
    const users = this.getAllUsers();
    const cleanCode = (data.broker_code || `BRK-${data.name.slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();

    const newBroker: UserProfile = {
      id: `usr-broker-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: 'password123',
      role: 'broker',
      broker_code: cleanCode,
      agency_name: data.agency_name,
      phone: data.phone,
      created_by_id: 'usr-admin-1',
      created_at: new Date().toISOString(),
    };

    users.unshift(newBroker);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    // Register Broker Code entry
    this.addBrokerCode({
      code: cleanCode,
      broker_id: newBroker.id,
      broker_name: data.name,
      agency_name: data.agency_name,
      phone: data.phone,
      commission_rate: data.commission_rate || 2.5,
    });

    return newBroker;
  }

  // Broker onboards a new Client
  static registerClient(data: {
    name: string;
    email: string;
    phone: string;
    broker_code: string;
    broker_id: string;
  }): UserProfile {
    const users = this.getAllUsers();

    const newClient: UserProfile = {
      id: `usr-client-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: 'password123',
      role: 'client',
      broker_code: data.broker_code,
      assigned_broker_id: data.broker_id,
      phone: data.phone,
      created_by_id: data.broker_id,
      created_at: new Date().toISOString(),
    };

    users.unshift(newClient);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }

    return newClient;
  }

  // Broker Codes List
  static getBrokerCodes(): BrokerCode[] {
    if (typeof window === 'undefined') return INITIAL_BROKER_CODES;

    try {
      const stored = localStorage.getItem(BROKER_CODES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    localStorage.setItem(BROKER_CODES_STORAGE_KEY, JSON.stringify(INITIAL_BROKER_CODES));
    return INITIAL_BROKER_CODES;
  }

  static validateBrokerCode(code: string): BrokerCode | undefined {
    const cleanCode = code.trim().toUpperCase();
    return this.getBrokerCodes().find((bc) => bc.code.toUpperCase() === cleanCode);
  }

  static addBrokerCode(newCode: Omit<BrokerCode, 'created_at' | 'active_clients' | 'total_sales'>): BrokerCode {
    const codes = this.getBrokerCodes();
    const entry: BrokerCode = {
      ...newCode,
      code: newCode.code.trim().toUpperCase(),
      active_clients: 0,
      total_sales: 0,
      created_at: new Date().toISOString(),
    };

    codes.unshift(entry);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BROKER_CODES_STORAGE_KEY, JSON.stringify(codes));
    }
    return entry;
  }

  static verifyClientWithBrokerCode(code: string): { success: boolean; broker?: BrokerCode; message?: string } {
    const broker = this.validateBrokerCode(code);
    if (!broker) {
      return { success: false, message: 'Invalid Broker Access Code. Please check with your agent.' };
    }

    const clientUser: UserProfile = {
      ...INITIAL_CLIENTS[0],
      broker_code: broker.code,
      assigned_broker_id: broker.broker_id,
    };

    this.setCurrentUser(clientUser);
    return { success: true, broker };
  }

  // Switch session profile
  static switchRole(role: UserRole): UserProfile {
    let targetUser: UserProfile;
    if (role === 'admin') targetUser = DEFAULT_ADMIN;
    else if (role === 'broker') targetUser = INITIAL_BROKERS[0];
    else targetUser = INITIAL_CLIENTS[0];

    this.setCurrentUser(targetUser);
    return targetUser;
  }

  // Plot Holds
  static getPlotHolds(): PlotHold[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PLOT_HOLDS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }

  static createPlotHold(data: {
    plot_id: string;
    broker_id: string;
    broker_name: string;
    client_name: string;
    client_phone: string;
    durationHours?: number;
  }): PlotHold {
    const holds = this.getPlotHolds();
    const expires = new Date(Date.now() + (data.durationHours || 48) * 3600000).toISOString();

    const hold: PlotHold = {
      id: `hold-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      plot_id: data.plot_id,
      broker_id: data.broker_id,
      broker_name: data.broker_name,
      client_name: data.client_name,
      client_phone: data.client_phone,
      expires_at: expires,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    holds.unshift(hold);
    if (typeof window !== 'undefined') {
      localStorage.setItem(PLOT_HOLDS_STORAGE_KEY, JSON.stringify(holds));
    }
    return hold;
  }
}
