export const environments = {
  get baseUrl() {
    return process.env.BASE_URL || 'https://www.saucedemo.com';
  },
  get apiUrl() {
    return process.env.API_URL || 'https://reqres.in/api';
  },
  credentials: {
    get standardUser() {
      return process.env.STANDARD_USER || 'standard_user';
    },
    get password() {
      return process.env.PASSWORD || 'secret_sauce';
    }
  }
};
