import { APIRequestContext } from '@playwright/test';

export class ApiHelper {
  private request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async get(endpoint: string, params?: { [key: string]: string | number | boolean }) {
    return await this.request.get(endpoint, { params });
  }

  async post(endpoint: string, data: any) {
    return await this.request.post(endpoint, { data });
  }

  async put(endpoint: string, data: any) {
    return await this.request.put(endpoint, { data });
  }

  async delete(endpoint: string) {
    return await this.request.delete(endpoint);
  }
}
