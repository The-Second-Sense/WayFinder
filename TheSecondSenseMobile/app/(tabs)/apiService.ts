import { BASE_URL } from './api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface VoiceRegRequest {
  userId: string;
  phraseId: string;
  audioFile: Blob | { uri: string; name: string; type: string };
}

export interface TransactionRequest {
  sourceAccountId: string;
  recipientAccountNumber: string;
  amount: number;
  currency?: string;
  description?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  // Token management
  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(includeContentType = true): HeadersInit {
    const headers: HeadersInit = {};

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Authentication endpoints
  async login(phone: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Login failed');
      }

      const data = await response.json();
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async registerVoice(userId: string, phraseId: string, audioUri: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('phraseId', phraseId);
      formData.append('audioFile', {
        uri: audioUri,
        name: 'voice.m4a',
        type: 'audio/m4a',
      } as any);

      const response = await fetch(`${this.baseUrl}/auth/voice-reg`, {
        method: 'POST',
        headers: {
          ...(this.token && { Authorization: `Bearer ${this.token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Voice registration failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      this.clearToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // User/Account endpoints
  async getAccount(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getTransactions(limit?: number): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/transactions`;
      if (limit) {
        url += `?limit=${limit}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Voice command endpoints
  async processVoiceCommand(text: string, sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/voice/command`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ text, sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Transaction endpoints
  async sendMoney(transactionData: TransactionRequest): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/trans/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Transaction failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async requestMoney(requestData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/trans/request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Beneficiary endpoints
  async getBeneficiaries(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/beneficiary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch beneficiaries');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async addBeneficiary(beneficiaryData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/beneficiary`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(beneficiaryData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Failed to add beneficiary');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
