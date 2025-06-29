export function getDecodedToken(token: string | null) {
    if (!token) return null;

    try {
        const payload = token.split('.')[1];
        if (!payload) return null;

        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
                .join('')
        );

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Token decode hatası:", e);
        return null;
    }
}
