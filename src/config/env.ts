const defaultApiUrl = 'http://10.0.2.2:3000';

export const env = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl).replace(/\/$/, ''),
} as const;
