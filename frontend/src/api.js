async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Something went wrong.');
    error.code = result.error?.code;
    error.status = response.status;
    throw error;
  }
  return result;
}

export const api = {
  accounts: () => request('/accounts'),
  createAccount: (name) => request('/accounts', { method: 'POST', body: JSON.stringify({ name }) }),
  balance: (id) => request(`/accounts/${id}/balance`),
  transactions: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/accounts/${id}/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (id, payload) => request(`/accounts/${id}/transactions`, {
    method: 'POST', body: JSON.stringify(payload),
  }),
  transfer: (payload) => request('/transfers', { method: 'POST', body: JSON.stringify(payload) }),
};
