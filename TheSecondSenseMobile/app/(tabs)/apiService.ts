import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { Platform } from 'react-native';
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
  recipientAccountNumber?: string;
  recipientPhoneNumber?: string;
  amount: number;
  currency?: string;
  description?: string;
  voiceFingerprint?: number[];
  transferPin?: string;
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
  aiMode?: 'AGENT' | 'GUIDE';
  intent?: string;
  success?: boolean;
  requiresManualEntry?: boolean;
  requiresIbanEntry?: boolean;
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
  highlightButtonId?: string;
  actionData?: any;
  navigateToScreen?: string;
}

export interface ProviderDto {
  id: string;
  name: string;
  category?: string;
  targetAccountNumber?: string;
  keywords?: string;
}

export type BillStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface BillDto {
  id: string;
  userId?: string;
  providerId?: string;
  providerName?: string;
  providerCategory?: string;
  billName: string;
  amount: number;
  currency?: string;
  dueDate: string;
  status: BillStatus;
  accountNumber?: string;
  description?: string;
}

export interface CreateBillRequest {
  userId: string;
  providerId: string;
  billName: string;
  amount: number;
  currency: string;
  dueDate: string;
  accountNumber?: string;
  description?: string;
}

export interface BillQueryFilters {
  providerId?: string;
  providerName?: string;
  category?: string;
  status?: BillStatus;
}

export interface ConfirmPlataFacturiRequest {
  userId: string;
  confirmed: boolean;
  targetAccountNumber: string;
  amount: number;
  currency: string;
  description?: string;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;
  private unauthorizedHandler: (() => void) | null = null;
  private isHandlingUnauthorized = false;

  constructor() {
    this.baseUrl = BASE_URL;
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    this.isHandlingUnauthorized = false;
  }

  clearToken() {
    this.token = null;
  }

  setUnauthorizedHandler(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  private clearStoredTokens() {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('token');
    }
  }

  private handleUnauthorized() {
    if (this.isHandlingUnauthorized) {
      return;
    }

    this.isHandlingUnauthorized = true;
    this.clearToken();
    this.clearStoredTokens();

    if (this.unauthorizedHandler) {
      this.unauthorizedHandler();
      return;
    }

    router.replace('/login');
  }

  private async fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status === 401) {
      this.handleUnauthorized();
      throw new Error('Sesiunea a expirat. Te rugăm să te autentifici din nou.');
    }

    return response;
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
        throw new Error(error?.message || 'Autentificarea a eșuat');
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
      throw new Error('Numărul de telefon, parola și PIN-ul de transfer sunt obligatorii');
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
        throw new Error(error?.message || 'Înregistrarea a eșuat');
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
          throw new Error('ID-ul utilizatorului este necesar pentru înregistrarea vocală');
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
          let message = 'Înregistrarea vocală a eșuat';
          try { message = JSON.parse(responseBody)?.message || message; } catch {}
          return { success: false, message };
        }

        // Backend returns UserDto
        const userDto: UserDto = JSON.parse(responseBody || '{}');
        console.log('UserDto response:', userDto);

        return {
          success: true,
          message: 'Înregistrare vocală realizată cu succes',
          isVoiceAuthEnabled: userDto?.isVoiceAuthEnabled ?? true,
          data: userDto
        };
    } catch (error) {
      console.error('Voice registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Înregistrarea vocală a eșuat'
      };
    }
  }

  async checkVoiceRegistered(userId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithAuth(
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers,
      });
      const message = await response.text();
      this.clearToken();
      this.clearStoredTokens();
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-a putut încărca contul');
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
      const response = await this.fetchWithAuth(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('[getAccountsByUserId] Status:', response.status);

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[getAccountsByUserId] Error body:', body);
        throw new Error(`Nu s-au putut încărca conturile: ${response.status}`);
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/accounts/${accountId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-a putut încărca contul');
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/accounts/${accountId}/balance`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-a putut încărca soldul');
      }

      return await response.json();
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }

  async closeAccount(accountId: number, userId: string): Promise<string> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/accounts/${accountId}/close`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId }),
      });

      const message = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(message || 'Nu s-a putut închide contul.');
      }

      return message || 'Cont închis cu succes.';
    } catch (error) {
      throw error;
    }
  }

  async blockAccount(accountId: number, reason = 'User requested'): Promise<string> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/accounts/${accountId}/block`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ reason }),
      });

      const message = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(message || 'Nu s-a putut bloca contul.');
      }

      return message || 'Cont blocat cu succes.';
    } catch (error) {
      throw error;
    }
  }

  async unblockAccount(accountId: number): Promise<string> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/accounts/${accountId}/unblock`, {
        method: 'POST',
        headers: this.getHeaders(false),
      });

      const message = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(message || 'Nu s-a putut debloca contul.');
      }

      return message || 'Cont deblocat cu succes.';
    } catch (error) {
      throw error;
    }
  }

  async getCardsByUserId(userId: string): Promise<CardDto[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/cards/user/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[getCardsByUserId] Error body:', body);
        throw new Error('Nu s-au putut încărca cardurile');
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

      const response = await this.fetchWithAuth(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-au putut încărca tranzacțiile');
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/voice/process`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let message = 'Procesarea comenzii vocale a eșuat';
        try {
          message = JSON.parse(errorBody)?.message || message;
        } catch {
          if (errorBody?.trim()) {
            message = errorBody;
          }
        }
        throw new Error(message);
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
      const response = await this.fetchWithAuth(`${this.baseUrl}/auth/set-transfer-pin`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, pin }),
      });
      if (!response.ok) throw new Error('Setarea PIN-ului de transfer a eșuat');
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
    description?: string;
  }): Promise<any> {
    try {
      const preparedPayload = {
        ...payload,
        targetAccountNumber: payload.targetAccountNumber?.trim() || undefined,
      };
      console.log('[confirmTransfer] Payload:', JSON.stringify(preparedPayload));
      const response = await this.fetchWithAuth(`${this.baseUrl}/voice/confirm-transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(preparedPayload),
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let message = 'Confirmarea transferului a eșuat';
        try {
          message = JSON.parse(errorBody)?.message || message;
        } catch {
          if (errorBody?.trim()) {
            message = errorBody;
          }
        }
        throw new Error(message);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async confirmPlataFacturi(payload: ConfirmPlataFacturiRequest): Promise<any> {
    try {
      const targetAccountNumber = payload.targetAccountNumber?.trim();
      if (!targetAccountNumber) {
        throw new Error('Contul destinatar este obligatoriu');
      }
      if (!Number.isFinite(payload.amount)) {
        throw new Error('Suma este obligatorie');
      }
      if (!payload.currency?.trim()) {
        throw new Error('Moneda este obligatorie');
      }
      console.log('[confirmPlataFacturi] Payload:', JSON.stringify(payload));
      const response = await this.fetchWithAuth(`${this.baseUrl}/voice/confirm-plata-facturi`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Confirmarea plății facturii a eșuat');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async confirmVoiceOp(pendingOperationId: string, selectedCandidateId?: string): Promise<any> {
    try {
      const body: Record<string, unknown> = { pendingOperationId };
      if (selectedCandidateId) body.selectedCandidateId = selectedCandidateId;
      const response = await this.fetchWithAuth(`${this.baseUrl}/voice/confirm`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Confirmarea operațiunii a eșuat');
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async cancelVoiceOp(pendingOperationId: string): Promise<any> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/voice/cancel`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ pendingOperationId }),
      });
      if (!response.ok) throw new Error('Anularea operațiunii a eșuat');
      return await response.json().catch(() => null);
    } catch (error) {
      throw error;
    }
  }

  // Transaction endpoints
  async sendMoney(transactionData: TransactionRequest): Promise<any> {
    try {
      const recipientAccountNumber = transactionData.recipientAccountNumber?.trim();
      const recipientPhoneNumber = transactionData.recipientPhoneNumber?.trim();
      if (!transactionData.sourceAccountId) {
        throw new Error('Contul sursă este obligatoriu');
      }
      if (!recipientAccountNumber && !recipientPhoneNumber) {
        throw new Error('Trebuie furnizat fie contul destinatar, fie numărul de telefon al destinatarului');
      }
      if (!Number.isFinite(transactionData.amount) || transactionData.amount <= 0) {
        throw new Error('Suma trebuie să fie mai mare decât 0');
      }

      const payload: TransactionRequest = {
        ...transactionData,
        recipientAccountNumber,
        recipientPhoneNumber,
      };

      console.log('[sendMoney] Payload:', JSON.stringify(payload));
      const response = await this.fetchWithAuth(`${this.baseUrl}/trans/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.error('[sendMoney] Error body:', body);
        let message = `Transferul a eșuat (${response.status})`;

        if (body?.trim()) {
          try {
            const parsed = JSON.parse(body);
            message =
              parsed?.message ||
              parsed?.error ||
              parsed?.details ||
              parsed?.title ||
              (Array.isArray(parsed?.errors) ? parsed.errors.join(', ') : undefined) ||
              message;
          } catch {
            message = body.trim();
          }
        }

        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async requestMoney(requestData: any): Promise<any> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/trans/request`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Cererea a eșuat');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Beneficiary endpoints
  async getBeneficiaries(): Promise<any[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/beneficiary`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-au putut încărca beneficiarii');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async addBeneficiary(beneficiaryData: any): Promise<any> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/beneficiary`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(beneficiaryData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Adăugarea beneficiarului a eșuat');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  // Provider endpoints
  async getProviders(): Promise<ProviderDto[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/providers`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-au putut încărca furnizorii');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async findProviderByName(name: string): Promise<ProviderDto> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/providers/search/by-name?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Nu s-a putut identifica furnizorul după nume');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async searchProviders(name: string): Promise<ProviderDto[]> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/providers/search/multiple?name=${encodeURIComponent(name)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Căutarea furnizorilor a eșuat');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  // Bills endpoints
  async createBill(payload: CreateBillRequest): Promise<BillDto> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Crearea facturii a eșuat');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getPendingBillsByUserId(userId: string): Promise<BillDto[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills/user/${userId}/pending`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-au putut încărca facturile în așteptare');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getPendingBillsByProviderName(userId: string, providerName: string): Promise<BillDto[]> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/bills/user/${userId}/provider?name=${encodeURIComponent(providerName)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Nu s-au putut încărca facturile furnizorului');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getPendingBillsByCategory(userId: string, category: string): Promise<BillDto[]> {
    try {
      const response = await this.fetchWithAuth(
        `${this.baseUrl}/bills/user/${userId}/category?category=${encodeURIComponent(category)}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Nu s-au putut încărca facturile pentru categorie');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getBillsByUserIdFiltered(userId: string, filters: BillQueryFilters): Promise<BillDto[]> {
    try {
      const params = new URLSearchParams();
      if (filters.providerId) params.append('providerId', filters.providerId);
      if (filters.providerName) params.append('providerName', filters.providerName);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const query = params.toString();
      const url = `${this.baseUrl}/bills/user/${userId}${query ? `?${query}` : ''}`;
      const response = await this.fetchWithAuth(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Nu s-au putut încărca facturile filtrate');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getAllBillsByUserId(userId: string): Promise<BillDto[]> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills/user/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Nu s-au putut încărca facturile');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      throw error;
    }
  }

  async getBillById(billId: string): Promise<BillDto> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills/${billId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Nu s-a putut încărca factura');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async updateBillStatus(billId: string, status: BillStatus): Promise<BillDto> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills/${billId}/status?status=${encodeURIComponent(status)}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Actualizarea statusului facturii a eșuat');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async deleteBill(billId: string): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/bills/${billId}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || 'Ștergerea facturii a eșuat');
      }
    } catch (error) {
      throw error;
    }
  }
}

export const apiService = new ApiService();
