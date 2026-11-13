
const API_BASE_URL = "http://127.0.0.1:5000";

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, token } = options;

  const headers = {};

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
  console.error("API ERROR:", response.status, data);

  throw new Error(
    data.error || data.message || `HTTP Error ${response.status}`
  );
}

  return data;
}
