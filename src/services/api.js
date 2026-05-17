import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para inyectar token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth
export const loginUser = (email, password) => api.post('/auth/login', { email, password });

// Hotels
export const createHotel = (data) => api.post('/hotels', data);
export const getHotels = () => api.get('/hotels');
export const getHotel = (id) => api.get(`/hotels/${id}`);

// Guests & Reservations
export const getGuests = (hotel_id) => api.get(`/guests`, { params: { hotel_id } });
export const getReservations = (hotel_id) => api.get(`/reservations`, { params: { hotel_id } });

// Services
export const getServices = (hotel_id) => api.get(`/services`, { params: { hotel_id } });

// Analytics
export const getAnalytics = (hotel_id) => api.get('/analytics', { params: { hotel_id } });

// Reviews
export const getReviews = () => api.get('/reviews');
export const createReview = (data) => api.post('/reviews', data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);

// Payments
export async function createCheckout(data) {
    const response = await api.post('/payments/checkout', data);
    return response.data;
}

export async function getOrders() {
    const response = await api.get('/payments/orders');
    return response.data;
}

// Settings
export async function getSettings() {
    const response = await api.get('/settings');
    return response.data;
}

export async function updateSettings(data) {
    const response = await api.put('/settings', data);
    return response.data;
}

// Notifications
export async function sendNotification(data) {
    const response = await api.post('/notifications/send', data);
    return response.data;
}

export async function testNotification() {
    const response = await api.get('/notifications/test');
    return response.data;
}

// ─── Super Admin ───────────────────────────────────────────────────────────

// Hotels
export async function adminGetHotels() {
    const response = await api.get('/admin/hotels');
    return response.data;
}

export async function adminCreateHotel(data) {
    const response = await api.post('/admin/hotels', data);
    return response.data;
}

export async function adminUpdateHotel(id, data) {
    const response = await api.put(`/admin/hotels/${id}`, data);
    return response.data;
}

export async function adminDeleteHotel(id) {
    const response = await api.delete(`/admin/hotels/${id}`);
    return response.data;
}

// Users
export async function adminGetUsers() {
    const response = await api.get('/admin/users');
    return response.data;
}

export async function adminCreateUser(data) {
    const response = await api.post('/admin/users', data);
    return response.data;
}

export async function adminUpdateUser(id, data) {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
}

export async function adminDeleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
}

// Integrations
export async function getIntegrations() {
    const response = await api.get('/integrations');
    return response.data;
}

export async function importCsv(file) {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post('/integrations/import/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
}

export async function saveIcalUrl(ical_url, provider) {
    const response = await api.post('/integrations/ical', { ical_url, provider });
    return response.data;
}

export async function syncIcalNow() {
    const response = await api.post('/integrations/ical/sync');
    return response.data;
}

export async function saveWebhookConfig(provider, webhook_secret) {
    const response = await api.post('/integrations/webhook-config', { provider, webhook_secret });
    return response.data;
}

export async function deleteIntegration(id) {
    const response = await api.delete(`/integrations/${id}`);
    return response.data;
}

export async function savePollingConfig(data) {
    const response = await api.post('/integrations/polling', data);
    return response.data;
}

export async function pollNow(id) {
    const response = await api.post(`/integrations/${id}/poll`);
    return response.data;
}

export async function getSyncLogs(id, limit = 50) {
    const response = await api.get(`/integrations/${id}/logs`, { params: { limit } });
    return response.data;
}

export default api;
