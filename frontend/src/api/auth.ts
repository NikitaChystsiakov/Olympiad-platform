import { http } from './http';
import type { AuthResponse } from '@/types';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  fullName: string;
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await http.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function googleLoginRequest(idToken: string) {
  const { data } = await http.post<AuthResponse>('/auth/google', { idToken });
  return data;
}

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await http.post<AuthResponse>('/auth/register', payload);
  return data;
}
