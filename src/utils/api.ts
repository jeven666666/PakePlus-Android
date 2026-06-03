const API_BASE = '/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('agnes_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('agnes_token', token);
    } else {
      localStorage.removeItem('agnes_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}, maxRetries = 0): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeout);

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            this.setToken(null);
            window.location.href = '/auth';
          }
          return { error: data.error || '请求失败', status: res.status };
        }

        return { data, status: res.ok ? 200 : res.status };
      } catch (err: any) {
        lastError = err;
        if (err.name === 'AbortError') {
          lastError = new Error('请求超时');
          break;
        }
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
    return { error: lastError?.message || '网络错误', status: 0 };
  }

  private async retryRequest<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(path, options, 2);
  }

  // Auth
  async register(email: string, password: string, displayName?: string) {
    const res = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.data?.token) this.setToken(res.data.token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.data?.token) this.setToken(res.data.token);
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateProfile(data: { displayName?: string; signature?: string; avatarUrl?: string }) {
    return this.request<any>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request<any>('/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  async forgotPassword(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  }

  // Tasks
  async getTasks(params?: { status?: string; type?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return this.request<any>(`/tasks?${query.toString()}`);
  }

  async getTask(id: string) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(data: { type: string; prompt: string; negativePrompt?: string; params?: any; model?: string }) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelTask(id: string) {
    return this.request<any>(`/tasks/${id}/cancel`, { method: 'POST' });
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, { method: 'DELETE' });
  }

  // Images
  async generateImage(data: { prompt: string; negativePrompt?: string; params?: any; model?: string }) {
    return this.retryRequest<any>('/images/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Videos
  async generateVideo(data: { prompt: string; negativePrompt?: string; params?: any; model?: string }) {
    return this.retryRequest<any>('/videos/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Chat
  async chatCompletion(messages: Array<{ role: string; content: string }>, model?: string) {
    return this.request<any>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ messages, model }),
    });
  }

  async optimizePrompt(prompt: string) {
    return this.request<{ optimizedPrompt: string }>('/chat/optimize', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // TTS
  async synthesizeTts(data: { text: string; voice?: string; model?: string; params?: any }) {
    return this.request<any>('/tts/synthesize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Editor
  async processEditor(data: { imageId: string; tool: string; prompt?: string; params?: any }) {
    return this.request<any>('/editor/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Assets
  async getAssets(params?: { type?: string; favorited?: boolean; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.favorited) query.set('favorited', 'true');
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return this.request<any>(`/assets?${query.toString()}`);
  }

  async toggleFavorite(id: string) {
    return this.request<any>(`/assets/${id}/favorite`, { method: 'PUT' });
  }

  async deleteAsset(id: string) {
    return this.request<any>(`/assets/${id}`, { method: 'DELETE' });
  }

  async batchDeleteAssets(ids: string[]) {
    return this.request<any>('/assets/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  }

  // Templates
  async getTemplates() {
    return this.request<any>('/templates');
  }

  async createTemplate(data: { name: string; description?: string; type: string; content: any }) {
    return this.request<any>('/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplate(id: string, data: { name?: string; description?: string; type?: string; content?: any }) {
    return this.request<any>(`/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplate(id: string) {
    return this.request<any>(`/templates/${id}`, { method: 'DELETE' });
  }

  // Model configs
  async getModelConfigs() {
    return this.request<any>('/models');
  }

  async createModelConfig(data: any) {
    return this.request<any>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateModelConfig(id: string, data: any) {
    return this.request<any>(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteModelConfig(id: string) {
    return this.request<any>(`/models/${id}`, { method: 'DELETE' });
  }

  async testModelConnectivity(id: string) {
    return this.request<any>(`/models/${id}/test`, { method: 'POST' });
  }

  // Credits
  async getCredits() {
    return this.request<any>('/credits');
  }

  async redeemCode(code: string) {
    return this.request<any>('/credits/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async purchaseCredits(packageId: string) {
    return this.request<any>('/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ packageId }),
    });
  }

  async upgradeMembership(tier: 'pro' | 'enterprise') {
    return this.request<any>('/credits/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async getCreditsHistory() {
    return this.request<any>('/credits/history');
  }

  async getStorage() {
    return this.request<any>('/credits/storage');
  }

  async getInvite() {
    return this.request<any>('/credits/invite');
  }

  async getInviteRecords() {
    return this.request<any>('/credits/invite/records');
  }

  // Upload
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return res.json();
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();
export default api;
