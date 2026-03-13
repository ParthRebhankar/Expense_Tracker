// Auth utility functions for token management

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Store token after login/signup
export function setToken(token) {
    localStorage.setItem('expense_token', token);
}

// Get stored token
export function getToken() {
    return localStorage.getItem('expense_token');
}

// Store user info
export function setUser(user) {
    localStorage.setItem('expense_user', JSON.stringify(user));
}

// Get user info
export function getUser() {
    try {
        return JSON.parse(localStorage.getItem('expense_user'));
    } catch {
        return null;
    }
}

// Remove auth data (logout)
export function clearAuth() {
    localStorage.removeItem('expense_token');
    localStorage.removeItem('expense_user');
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!getToken();
}

// Helper: Make authenticated API calls
export async function authFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // If token is invalid/expired, redirect to login
    if (response.status === 401 || response.status === 403) {
        clearAuth();
        window.location.href = '/';
        throw new Error('Session expired. Please log in again.');
    }

    return response;
}

// Auth API calls
export async function signup(username, password) {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    setToken(data.token);
    setUser(data.user);
    return data;
}

export async function login(username, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token);
    setUser(data.user);
    return data;
}

export async function authenticate(username, password) {
    const res = await fetch(`${API_URL}/api/auth/authenticate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    setToken(data.token);
    setUser(data.user);
    return data;
}

export function logout() {
    clearAuth();
    window.location.href = '/';
}
