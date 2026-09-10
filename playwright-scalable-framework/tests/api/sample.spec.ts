import { test, expect } from '@playwright/test';
import { ApiHelper } from '../../utils/apiHelper';
import { environments } from '../../config/environments';

test.describe('API Tests', () => {
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ request }) => {
    // Setup base API URL context if needed or rely on the apiHelper
    apiHelper = new ApiHelper(request);
  });

  test('GET user list from reqres.in', async () => {
    const response = await apiHelper.get(`${environments.apiUrl}/users`, { page: 2 });
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.page).toBe(2);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test('POST create new user', async () => {
    const newUser = {
      name: 'morpheus',
      job: 'leader'
    };
    
    const response = await apiHelper.post(`${environments.apiUrl}/users`, newUser);
    
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.name).toBe(newUser.name);
    expect(body.job).toBe(newUser.job);
    expect(body).toHaveProperty('id');
  });
});
