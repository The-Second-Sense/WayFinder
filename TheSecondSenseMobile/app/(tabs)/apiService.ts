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
    // MOCK LOGIN - bypasses real API
    return this.mockLogin(phone, password);
    
    // Uncomment below to use real API
    /*
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
      console.log('Raw login response:', data);
      
      // Map accessToken to token for consistency
      const mappedData: LoginResponse = {
        token: data.accessToken || data.token,
        user: data.user
      };
      
      if (mappedData.token) {
        this.setToken(mappedData.token);
      }
      return mappedData;
    } catch (error) {
      throw error;
    }
    */
  }

  // Mock login function for development/testing
  private async mockLogin(phone: string, password: string): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Accept any credentials, or specific demo credentials
    if (!phone || !password) {
      throw new Error('Phone and password are required');
    }

    // Create mock response
    const mockResponse: LoginResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'mock-user-123',
        name: 'Amalia',
        email: 'amalia@wayfinder.com',
        phone: phone,
      }
    };

    // Set the token
    this.setToken(mockResponse.token);
    
    console.log('Mock login successful:', mockResponse);
    return mockResponse;
  }

  async register(userData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      console.log('Raw registration response:', response);
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Registration failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async registerVoice(userId: string, phraseId: string, audioUri: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
        console.log('Registering voice with:', { userId, phraseId, audioUri });
        
        if (!userId) {
          throw new Error('User ID is required for voice registration');
        }
        
        const formData = new FormData();
        
        // Fetch the audio blob from the URI
        const audioResponse = await fetch(audioUri);
        const audioBlob = await audioResponse.blob();
        
        // Append the audio file to FormData
        formData.append('audioFile', audioBlob, 'voice.m4a');
      
        const url = `${this.baseUrl}/auth/voice-reg?userId=${encodeURIComponent(userId)}&phraseId=${encodeURIComponent(phraseId)}`;
        
        console.log('Sending to:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...(this.token && { Authorization: `Bearer ${this.token}` }),
          },
          body: formData,
        });

        console.log('Raw voice registration response:', response);
        const responseData = await response.json().catch(() => null);
        console.log('Response data:', responseData);

        if (!response.ok) {
          return {
            success: false,
            message: responseData?.message || 'Voice registration failed'
          };
        }

        // Ensure response has success property
        return {
          success: responseData?.success !== false,
          message: responseData?.message,
          data: responseData?.data || responseData
        };
    } catch (error) {
      console.error('Voice registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Voice registration failed'
      };
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
    // MOCK ACCOUNT - bypasses real API
    return this.mockGetAccount();

    // Uncomment below to use real API
    /*
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
    */
  }

  // Mock account function for development/testing
  private async mockGetAccount(): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      balance: 12450.75,
      name: "Alex Ionescu",
      accountNumber: "RO49 INGB 0001 2233 4455",
      monthlyChange: +12.4,
    };
  }

  async getTransactions(limit?: number): Promise<any[]> {
    // MOCK TRANSACTIONS - bypasses real API
    return this.mockGetTransactions(limit);

    // Uncomment below to use real API
    /*
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
    */
  }

  // Mock transactions function for development/testing
  private async mockGetTransactions(limit?: number): Promise<any[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockTransactions = [
      {
        id: 'TXN-001',
        type: 'debit',
        amount: 150.00,
        description: 'Payment to John Doe',
        category: 'transfer',
        date: '24 Feb 2026',
        time: '14:30',
      },
      {
        id: 'TXN-002',
        type: 'credit',
        amount: 500.00,
        description: 'Monthly allowance',
        category: 'transfer',
        date: '22 Feb 2026',
        time: '09:15',
      },
      {
        id: 'TXN-003',
        type: 'debit',
        amount: 89.99,
        description: 'Online shopping',
        category: 'shopping',
        date: '21 Feb 2026',
        time: '16:45',
      },
      {
        id: 'TXN-004',
        type: 'debit',
        amount: 200.00,
        description: 'Electricity bill',
        category: 'utilities',
        date: '20 Feb 2026',
        time: '11:20',
      },
      {
        id: 'TXN-005',
        type: 'credit',
        amount: 1000.00,
        description: 'Salary deposit',
        category: 'transfer',
        date: '15 Feb 2026',
        time: '08:00',
      }
    ];

    // Apply limit if provided
    const result = limit ? mockTransactions.slice(0, limit) : mockTransactions;
    console.log('Mock transactions returned:', result);
    return result;
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
