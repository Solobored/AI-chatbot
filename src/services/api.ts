import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout for AI responses
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatMessage {
  id: string;
  session_id: string;
  user_message: string;
  ai_response: string;
  mode: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  name: string;
  mode: string;
  created_at: string;
  updated_at: string;
  is_special: boolean;
  message_count: number;
}

export interface AIMode {
  id: string;
  name: string;
  description: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  mode: string;
  save_history: boolean;
}

export interface ChatResponse {
  response: string;
  message_id?: string;
  session_id: string;
  mode: string;
}

export interface ExportData {
  session: ChatSession;
  messages: ChatMessage[];
  exported_at: string;
}

export interface AnalysisResult {
  suggested_mode: string;
  suggested_name: string;
  mode_info: AIMode;
}

export const chatAPI = {
  // Chat functionality
  sendMessage: async (message: string, sessionId?: string, mode: string = 'general', saveHistory: boolean = true): Promise<ChatResponse> => {
    try {
      const response = await api.post<ChatResponse>('/chat', {
        message: message.trim(),
        session_id: sessionId,
        mode,
        save_history: saveHistory,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Backend server is not running. Please start the Flask server first.');
        }
        throw new Error(error.response?.data?.error || 'Failed to send message');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  // Session management
  getSessions: async (): Promise<ChatSession[]> => {
    try {
      const response = await api.get<ChatSession[]>('/sessions');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          return [];
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch sessions');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  createSession: async (name: string, mode: string = 'general', isSpecial: boolean = false): Promise<ChatSession> => {
    try {
      const response = await api.post<ChatSession>('/sessions', {
        name: name.trim(),
        mode,
        is_special: isSpecial,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to create session');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  createQuickSession: async (): Promise<ChatSession> => {
    try {
      const response = await api.post<ChatSession>('/sessions/quick');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to create quick session');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  analyzeRequest: async (description: string): Promise<AnalysisResult> => {
    try {
      const response = await api.post<AnalysisResult>('/analyze-request', {
        description: description.trim(),
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to analyze request');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await api.delete(`/sessions/${sessionId}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to delete session');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const response = await api.get<ChatMessage[]>(`/sessions/${sessionId}/messages`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          return [];
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch messages');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  exportSession: async (sessionId: string): Promise<ExportData> => {
    try {
      const response = await api.get<ExportData>(`/sessions/${sessionId}/export`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to export session');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  // AI modes
  getModes: async (): Promise<AIMode[]> => {
    try {
      const response = await api.get<AIMode[]>('/modes');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          // Return default modes if backend is offline
          return [
            { id: 'general', name: 'General Assistant', description: 'Helpful AI assistant for general questions' },
            { id: 'coding', name: 'Coding Assistant', description: 'Programming help and technical guidance' },
            { id: 'business', name: 'Business Consultant', description: 'Professional business advice and strategy' },
            { id: 'creative', name: 'Creative Writing', description: 'Creative writing and content creation' }
          ];
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch modes');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  // Data management
  eraseAllData: async (): Promise<{ new_session_id: string }> => {
    try {
      const response = await api.post<{ new_session_id: string }>('/erase');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to erase data');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  // Legacy support
  getChatHistory: async (): Promise<ChatMessage[]> => {
    try {
      const response = await api.get<ChatMessage[]>('/history');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          return [];
        }
        throw new Error(error.response?.data?.error || 'Failed to fetch chat history');
      }
      throw new Error('An unexpected error occurred');
    }
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      await api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  },
};