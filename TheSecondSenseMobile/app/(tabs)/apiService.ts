import { Platform } from 'react-native';
import { BASE_URL } from './api';
import * as FileSystem from 'expo-file-system/legacy';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
  transferPin: string;
}

export interface UserDto {
  userId: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  isVoiceAuthEnabled?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface LoginResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    isVoiceAuthEnabled?: boolean;
    transferPin?: string;
  };
}

export interface VoiceRegRequest {
  userId: string;
  phraseId: string;
  audioFile: Blob | { uri: string; name: string; type: string };
}

export interface ProcessVoiceRequest {
  userId: string;
  audioBase64: string;
  aiMode: "agent" | "guide";
}

export interface TransactionRequest {
  sourceAccountId: number;
  recipientAccountNumber: string;
  amount: number;
  currency?: string;
  description?: string;
  voiceFingerprint?: number[];
}

export interface AccountDto {
  accountId: number;
  userId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CardDto {
  cardId?: number | string;
  id?: number | string;
  userId?: string;
  accountId?: number;
  cardNumber?: string;
  maskedCardNumber?: string;
  last4?: string;
  cardType?: string;
  type?: string;
  network?: string;
  brand?: string;
  holderName?: string;
  cardHolder?: string;
  isActive?: boolean;
  status?: string;
  expiryDate?: string;
  expiresAt?: string;
}

export interface ContactLiteDto {
  name: string;
  phone: string;
}

export interface VoiceCandidate {
  id: string;
  name: string;
  accountNumber?: string;
  phone?: string;
}

export interface VoiceProcessResponse {
  status?: 'PENDING_CONFIRMATION' | 'SUCCESS' | 'FAILED';
  pendingConfirmation?: boolean;
  pendingOperationId?: string;
  candidates?: VoiceCandidate[];
  message?: string;
  matchedBeneficiaries?: any[];
  extractedEntities?: {
    amount?: number;
    currency?: string;
    recipientName?: string;
    beneficiary?: string;
    description?: string;
  };
  guidanceMessage?: string;
  guidanceSteps?: any[];
  actionData?: any;
  navigateToScreen?: string;
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
  async login(phone: string, password: string, transferPin: string): Promise<LoginResponse> {
    // MOCK LOGIN - bypasses real API
    //return this.mockLogin(phone, password, transferPin);
    
    // Uncomment below to use real API
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ phone, password, transferPin }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Raw login response:', data);
      
      // Map backend field names to frontend interface
      // Backend: accessToken, user.userId, user.fullName, user.phoneNumber
      const mappedData: LoginResponse = {
        token: data.accessToken || data.token,
        user: data.user ? {
          id: data.user.userId,
          name: data.user.fullName,
          email: data.user.email,
          phone: data.user.phoneNumber,
          isVoiceAuthEnabled: data.user.isVoiceAuthEnabled ?? false,
          transferPin: data.user.transferPin,
        } : undefined
      };
      
      if (mappedData.token) {
        this.setToken(mappedData.token);
      }
      return mappedData;
    } catch (error) {
      throw error;
    }
    
  }

  // Mock login function for development/testing
  private async mockLogin(phone: string, password: string, transferPin: string): Promise<LoginResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Accept any credentials, or specific demo credentials
    if (!phone || !password || !transferPin) {
      throw new Error('Phone, password, and transfer PIN are required');
    }

    // Create mock response
    const mockResponse: LoginResponse = {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'mock-user-123',
        name: 'Amalia',
        email: 'amalia@wayfinder.com',
        phone: phone,
        transferPin: transferPin,
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

  async registerVoice(userId: string, phraseId: string, audioUri: string): Promise<{ success: boolean; message?: string; isVoiceAuthEnabled?: boolean; data?: any }> {
    try {
        console.log('Registering voice with:', { userId, phraseId, audioUri });
        
        if (!userId) {
          throw new Error('User ID is required for voice registration');
        }
        
        const url = `${this.baseUrl}/auth/voice-reg`;
        console.log('Sending to:', url, 'file:', audioUri);

        let responseStatus: number;
        let responseBody: string;

        if (Platform.OS === 'web') {
          // On web, audioUri is a blob:// URL — fetch can read it directly
          const audioBlob = await fetch(audioUri).then(r => r.blob());
          const formData = new FormData();
          formData.append('audioFile', audioBlob, 'voice.m4a');
          // userId and phraseId go ONLY as query params — not in the body too,
          // otherwise Spring @RequestParam concatenates them and throws "too large"
          const res = await fetch(
            `${url}?userId=${encodeURIComponent(userId)}&phraseId=${encodeURIComponent(phraseId)}`,
            {
              method: 'POST',
              headers: { ...(this.token && { Authorization: `Bearer ${this.token}` }) },
              body: formData,
            }
          );
          responseStatus = res.status;
          responseBody = await res.text().catch(() => '');
        } else {
          // On Android/iOS, audioUri is a file:// path — FileSystem.uploadAsync
          // reads the file natively (fetch+FormData silently sends empty bytes)
          const uploadResponse = await FileSystem.uploadAsync(url, audioUri, {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'audioFile',
            mimeType: 'audio/m4a',
            parameters: { userId, phraseId },
            headers: { ...(this.token && { Authorization: `Bearer ${this.token}` }) },
          });
          responseStatus = uploadResponse.status;
          responseBody = uploadResponse.body ?? '';
        }

        console.log('Voice reg status:', responseStatus, 'body:', responseBody);

        if (responseStatus < 200 || responseStatus >= 300) {
          let message = 'Voice registration failed';
          try { message = JSON.parse(responseBody)?.message || message; } catch {}
          return { success: false, message };
        }

        // Backend returns UserDto
        const userDto: UserDto = JSON.parse(responseBody || '{}');
        console.log('UserDto response:', userDto);

        return {
          success: true,
          message: 'Voice registered successfully',
          isVoiceAuthEnabled: userDto?.isVoiceAuthEnabled ?? true,
          data: userDto
        };
    } catch (error) {
      console.error('Voice registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Voice registration failed'
      };
    }
  }

  async checkVoiceRegistered(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/auth/voice-reg/check?userId=${encodeURIComponent(userId)}`,
        { method: 'GET', headers: this.getHeaders() }
      );
      if (!response.ok) return false;
      const data = await response.json().catch(() => null);
      return data?.registered === true || data?.hasVoice === true;
    } catch (error) {
      console.error('checkVoiceRegistered error:', error);
      return false;
    }
  }

  async logout(token?: string): Promise<string> {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const bearerToken = token || this.token;
      if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
      }
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers,
      });
      const message = await response.text();
      this.clearToken();
      return message;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // User/Account endpoints
  async getAccount(): Promise<any> {
    // MOCK ACCOUNT - bypasses real API
    //return this.mockGetAccount();

    // Uncomment below to use real API
    
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

  /**
   * GET /api/accounts/user/{userId}
   * Returns all accounts for a user
   */
  async getAccountsByUserId(userId: string): Promise<any[]> {
    const url = `${this.baseUrl}/accounts/user/${userId}`;
    const headers = this.getHeaders();
    console.log('[getAccountsByUserId] Requesting:', url);
    console.log('[getAccountsByUserId] Token present:', !!this.token);
    console.log('[getAccountsByUserId] Auth header:', (headers as any)['Authorization'] ?? 'MISSING');
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('[getAccountsByUserId] Status:', response.status);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[getAccountsByUserId] Error body:', body);
        throw new Error(`Failed to fetch accounts: ${response.status}`);
      }

      const data = await response.json();
      console.log('[getAccountsByUserId] Data:', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('[getAccountsByUserId] Network error:', error);
      throw error;
    }
  }

  /**
   * GET /api/accounts/{accountId}
   * Returns a single account by its ID
   */
  async getAccountById(accountId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch account');
      }

      return await response.json();
    } catch (error) {
      console.error('Get account by ID error:', error);
      throw error;
    }
  }

  /**
   * GET /api/accounts/{accountId}/balance
   * Returns only the balance for an account
   */
  async getBalance(accountId: number): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/accounts/${accountId}/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      return await response.json();
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  async getCardsByUserId(userId: string): Promise<CardDto[]> {
    try {
      const response = await fetch(`${this.baseUrl}/cards/user/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[getCardsByUserId] Error body:', body);
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.cards)) {
        return data.cards;
      }

      return [];
    } catch (error) {
      console.error('[getCardsByUserId] Network error:', error);
      throw error;
    }
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

  async getTransactions(userId: string, limit?: number): Promise<any[]> {
    // MOCK TRANSACTIONS - bypasses real API
    //return this.mockGetTransactions(limit);

    // Uncomment below to use real API
    
    try {
      let url = `${this.baseUrl}/trans/history?userId=${userId}`;
      if (limit) {
        url += `&limit=${limit}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const raw = await response.json();
      const items = Array.isArray(raw) ? raw : [];
      console.log(
        '[getTransactions] description fields:',
        items.map((tx: any, index: number) => ({
          id: tx?.id ?? tx?.transactionId ?? index,
          description: tx?.description,
        }))
      );
      return items.map((tx: any, index: number) => {
        const createdAt = tx?.createdAt ? new Date(tx.createdAt) : null;
        const hasValidDate = !!createdAt && !Number.isNaN(createdAt.getTime());
        const direction = String(tx?.direction ?? '').toUpperCase();
        const isCredit = direction === 'RECEIVED' || tx?.type === 'credit';
        const amount = Number(tx?.amount ?? 0);

        return {
          id: String(tx?.id ?? tx?.transactionId ?? index),
          type: isCredit ? 'credit' : 'debit',
          amount: Number.isFinite(amount) ? amount : 0,
          description: tx?.description?.trim?.() ?? '',
          receiverName: tx?.receiverName ?? '',
          category: tx?.category ?? 'transfer',
          date: hasValidDate
            ? createdAt.toLocaleDateString('ro-RO', {
                day: '2-digit',
                month: 'short',
              })
            : '-',
          time: hasValidDate
            ? createdAt.toLocaleTimeString('ro-RO', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-',
        };
      });
    } catch (error) {
      throw error;
    }
    
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
  async processVoiceCommand(
    userId: string,
    audioBase64: string,
    aiMode: "AGENT" | "GUIDE",
    contacts?: ContactLiteDto[]
  ): Promise<VoiceProcessResponse> {
    try {
      const body: Record<string, unknown> = { userId, audioBase64, aiMode };
      if (contacts && contacts.length > 0) {
        body.contacts = contacts;
      }
      const response = await fetch(`${this.baseUrl}/voice/process`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      const data = await response.json();
      console.log('[processVoiceCommand] Raw JSON:', JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  }

  async setTransferPin(userId: string, pin: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/set-transfer-pin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, pin }),
      });
      if (!response.ok) throw new Error('Failed to set transfer PIN');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async confirmTransfer(payload: {
    userId: string;
    confirmed: boolean;
    targetAccountNumber?: string;
    amount?: number;
    currency?: string;
    transferPin?: string;
  }): Promise<any> {
    try {
      console.log('[confirmTransfer] Payload:', JSON.stringify(payload));
      const response = await fetch(`${this.baseUrl}/voice/confirm-transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to confirm transfer');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async confirmVoiceOp(pendingOperationId: string, selectedCandidateId?: string): Promise<any> {
    try {
      const body: Record<string, unknown> = { pendingOperationId };
      if (selectedCandidateId) body.selectedCandidateId = selectedCandidateId;
      const response = await fetch(`${this.baseUrl}/voice/confirm`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to confirm operation');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async cancelVoiceOp(pendingOperationId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/voice/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ pendingOperationId }),
      });
      if (!response.ok) throw new Error('Failed to cancel operation');
      return await response.json().catch(() => null);
    } catch (error) {
      throw error;
    }
  }

  // Transaction endpoints
  async sendMoney(transactionData: TransactionRequest): Promise<any> {
    try {
      console.log('[sendMoney] Payload:', JSON.stringify(transactionData));
      const response = await fetch(`${this.baseUrl}/trans/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[sendMoney] Error body:', body);
        let message = 'Transaction failed';
        try { message = JSON.parse(body)?.message || message; } catch {}
        throw new Error(message);
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
