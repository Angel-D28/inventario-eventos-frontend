const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
    throw new Error('Falta EXPO_PUBLIC_API_URL en el archivo .env.local');
}

export const API_URL: string = apiUrl.replace(/\/+$/, '');