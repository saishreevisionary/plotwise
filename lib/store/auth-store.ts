'use client';

import { UserRole, UserProfile, BrokerCode, PlotHold } from '@/types';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

const AUTH_SESSION_KEY = 'plotwise_ai_current_session_v3';
const USERS_STORAGE_KEY = 'plotwise_ai_registered_users_v3';
const BROKER_CODES_STORAGE_KEY = 'plotwise_ai_broker_codes_v3';
const PLOT_HOLDS_STORAGE_KEY = 'plotwise_ai_plot_holds_v3';

export const DEFAULT_ADMIN: UserProfile = {
  id: 'usr-admin-1',
  name: 'Alex Morgan',
  email: 'admin@plotwise.com',
  password: 'admin123',
  role: 'admin',
  agency_name: 'Green Valley Developers (Master Admin)',
  phone: '+91 98000 00000',
  created_at: new Date().toISOString(),
};

export class AuthStore {
  /**
   * Synchronize Users, Broker Codes, and Plot Holds from Supabase Cloud Database
   */
  static async syncFromSupabase() {
    if (!isSupabaseConfigured() || typeof window === 'undefined') return;
    try {
      const supabase = createClient();

      // 1. Fetch Users
      const { data: dbUsers } = await supabase.from('users').select('*');
      if (dbUsers && dbUsers.length > 0) {
        const localUsers = this.getAllUsers();
        const mergedMap = new Map<string, UserProfile>();
        localUsers.forEach((u) => mergedMap.set(u.id, u));
        dbUsers.forEach((u: any) => {
          mergedMap.set(u.id, {
            id: u.id,
            name: u.name,
            email: u.email,
            password: u.password_hash || u.password || 'password123',
            role: u.role,
            phone: u.phone,
            broker_code: u.broker_code,
            agency_name: u.agency_name,
            assigned_broker_id: u.assigned_broker_id,
            created_by_id: u.created_by_id,
            created_at: u.created_at,
          });
        });
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(mergedMap.values())));
      }

      // 2. Fetch Broker Codes
      const { data: dbCodes } = await supabase.from('broker_codes').select('*');
      if (dbCodes && dbCodes.length > 0) {
        localStorage.setItem(BROKER_CODES_STORAGE_KEY, JSON.stringify(dbCodes));
      }

      // 3. Fetch Plot Holds
      const { data: dbHolds } = await supabase.from('plot_holds').select('*');
      if (dbHolds && dbHolds.length > 0) {
        localStorage.setItem(PLOT_HOLDS_STORAGE_KEY, JSON.stringify(dbHolds));
      }

      console.log('[Supabase Cloud Sync] Users, broker codes, and plot holds synced from Supabase Cloud.');
    } catch (err) {
      console.warn('Supabase AuthStore sync warning:', err);
    }
  }

  // Get all registered users
  static getAllUsers(): UserProfile[] {
    if (typeof window === 'undefined') return [DEFAULT_ADMIN];

    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    const initial = [DEFAULT_ADMIN];
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

  // Admin registers a new Broker dynamically (Saves locally & Syncs to Supabase)
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

    // Async push to Supabase Users table
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase
        .from('users')
        .insert({
          id: newBroker.id,
          name: newBroker.name,
          email: newBroker.email,
          password_hash: 'password123',
          role: 'broker',
          phone: newBroker.phone,
          broker_code: newBroker.broker_code,
          agency_name: newBroker.agency_name,
          created_by_id: newBroker.created_by_id,
        })
        .then(({ error }) => {
          if (error) console.warn('[Supabase Sync Warning] Users insert:', error.message);
          else console.log('[Supabase Sync] Broker successfully saved to Supabase users table.');
        });
    }

    return newBroker;
  }

  // Broker onboards a new Client dynamically
  static registerClient(data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    broker_code: string;
    broker_id: string;
  }): UserProfile {
    const users = this.getAllUsers();

    const clientPass = data.password && data.password.trim() ? data.password.trim() : 'password123';

    const newClient: UserProfile = {
      id: `usr-client-${Date.now()}`,
      name: data.name,
      email: data.email,
      password: clientPass,
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

    // Async push to Supabase Users table
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase
        .from('users')
        .insert({
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
          password_hash: clientPass,
          role: 'client',
          phone: newClient.phone,
          broker_code: newClient.broker_code,
          assigned_broker_id: newClient.assigned_broker_id,
          created_by_id: newClient.created_by_id,
        })
        .then(({ error }) => {
          if (error) console.warn('[Supabase Sync Warning] Users client insert:', error.message);
          else console.log('[Supabase Sync] Client successfully saved to Supabase users table.');
        });
    }

    return newClient;
  }

  // Broker Codes List
  static getBrokerCodes(): BrokerCode[] {
    let storedCodes: BrokerCode[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(BROKER_CODES_STORAGE_KEY);
        if (stored) storedCodes = JSON.parse(stored);
      } catch (e) {}
    }

    // Merge derived codes from registered users who have a role === 'broker'
    const users = this.getAllUsers();
    const userBrokerCodes: BrokerCode[] = users
      .filter((u) => u.role === 'broker' && u.broker_code)
      .map((u) => ({
        code: u.broker_code!.trim().toUpperCase(),
        broker_id: u.id,
        broker_name: u.name,
        agency_name: u.agency_name || 'Authorized Agency',
        phone: u.phone || '',
        commission_rate: 2.5,
        active_clients: 0,
        total_sales: 0,
        created_at: u.created_at || new Date().toISOString(),
      }));

    // Deduplicate by code
    const map = new Map<string, BrokerCode>();
    [...storedCodes, ...userBrokerCodes].forEach((item) => {
      if (!map.has(item.code.toUpperCase())) {
        map.set(item.code.toUpperCase(), item);
      }
    });

    return Array.from(map.values());
  }

  static validateBrokerCode(code: string): BrokerCode | undefined {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return undefined;
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

    // Async push to Supabase Broker Codes table
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase
        .from('broker_codes')
        .insert({
          code: entry.code,
          broker_id: entry.broker_id,
          broker_name: entry.broker_name,
          agency_name: entry.agency_name,
          phone: entry.phone,
          commission_rate: entry.commission_rate,
          active_clients: entry.active_clients,
          total_sales: entry.total_sales,
        })
        .then(({ error }) => {
          if (error) console.warn('[Supabase Sync Warning] Broker Codes insert:', error.message);
          else console.log('[Supabase Sync] Broker Code successfully saved to Supabase broker_codes table.');
        });
    }

    return entry;
  }

  // Strict credential authentication
  static authenticateUser(
    email: string,
    password: string,
    requiredRole?: UserRole
  ): { success: boolean; user?: UserProfile; message?: string } {
    const users = this.getAllUsers();
    const cleanEmail = email.trim().toLowerCase();

    // Match exact email or flexible admin matching (admin@plotwise.com, admin@plotwise.ai, admin@plotwise)
    let user = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

    if (!user && (requiredRole === 'admin' || cleanEmail.startsWith('admin'))) {
      user = DEFAULT_ADMIN;
    }

    if (!user) {
      return { success: false, message: 'Account not found. Please check your username/email.' };
    }

    if (user.password && user.password !== password.trim()) {
      return { success: false, message: 'Invalid password. Please enter the correct password.' };
    }

    if (requiredRole && user.role !== requiredRole) {
      return { success: false, message: `Access denied. Account is not registered as a ${requiredRole}.` };
    }

    const authenticatedProfile: UserProfile = {
      ...user,
      email: cleanEmail,
    };

    this.setCurrentUser(authenticatedProfile);
    return { success: true, user: authenticatedProfile };
  }

  static authenticateClient(data: {
    email: string;
    password?: string;
    broker_code: string;
  }): { success: boolean; user?: UserProfile; message?: string } {
    const cleanCode = data.broker_code.trim().toUpperCase();
    const broker = this.validateBrokerCode(cleanCode);
    if (!broker) {
      return { success: false, message: 'Invalid Broker Access Code. Access Denied.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const users = this.getAllUsers();

    // Look for existing registered client in registered users
    let clientUser = users.find(
      (u) => u.role === 'client' && u.email.trim().toLowerCase() === cleanEmail
    );

    if (!clientUser) {
      return {
        success: false,
        message: `Client account '${cleanEmail}' not found. Please ask your broker (${broker.broker_name}) to onboard your email first.`,
      };
    }

    if (data.password && clientUser.password && clientUser.password !== data.password.trim()) {
      return { success: false, message: 'Invalid client password. Please enter the correct password.' };
    }

    if (clientUser.broker_code && clientUser.broker_code.toUpperCase() !== cleanCode) {
      return {
        success: false,
        message: `Broker Code '${cleanCode}' does not match your assigned broker code (${clientUser.broker_code}).`,
      };
    }

    clientUser = {
      ...clientUser,
      broker_code: broker.code,
      assigned_broker_id: broker.broker_id,
    };

    this.setCurrentUser(clientUser);
    return { success: true, user: clientUser };
  }

  static verifyClientWithBrokerCode(code: string): { success: boolean; broker?: BrokerCode; message?: string } {
    const broker = this.validateBrokerCode(code);
    if (!broker) {
      return { success: false, message: 'Invalid Broker Access Code. Please check with your agent.' };
    }

    const clientUser: UserProfile = {
      id: `usr-client-guest-${Date.now()}`,
      name: 'Verified Guest Client',
      email: 'client@guest.com',
      role: 'client',
      broker_code: broker.code,
      assigned_broker_id: broker.broker_id,
    };

    this.setCurrentUser(clientUser);
    return { success: true, broker };
  }

  // Switch session profile for demo testing
  static switchRole(role: UserRole): UserProfile {
    const users = this.getAllUsers();

    if (role === 'admin') {
      this.setCurrentUser(DEFAULT_ADMIN);
      return DEFAULT_ADMIN;
    }

    const broker = users.find((u) => u.role === 'broker');
    if (broker) {
      this.setCurrentUser(broker);
      return broker;
    }

    this.setCurrentUser(DEFAULT_ADMIN);
    return DEFAULT_ADMIN;
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

    // Async push to Supabase Plot Holds table
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      supabase
        .from('plot_holds')
        .insert({
          id: hold.id,
          plot_id: hold.plot_id,
          broker_id: hold.broker_id,
          broker_name: hold.broker_name,
          client_name: hold.client_name,
          client_phone: hold.client_phone,
          expires_at: hold.expires_at,
          status: hold.status,
        })
        .then(({ error }) => {
          if (error) console.warn('[Supabase Sync Warning] Plot Holds insert:', error.message);
          else console.log('[Supabase Sync] Plot hold successfully saved to Supabase plot_holds table.');
        });
    }

    return hold;
  }
}
