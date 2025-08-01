const API_URL = import.meta.env.VITE_API_URL + '/auth';

export async function register({ email, password }) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function login({ email, password }) {
   console.log('Registering with URL:', `${API_URL}/register`);
  console.log('Registering with data:', { email, password });
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
    console.log('Register response status:', res.status);
  const data = await res.json();
  console.log('Register response data:', data);
  
  return data;
} 
