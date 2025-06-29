import { getDecodedToken } from "../core/utils/decodeToken/decodeToken";

class TokenService {
    private accessTokenKey = "accessToken";
    private refreshTokenKey = "refreshToken";

    // Cookie'ye set etme (expires gün olarak)
    private setCookie(name: string, value: string, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax; Secure`;
    }

    // Cookie'den al
    private getCookie(name: string): string | null {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    // Cookie'den sil
    private deleteCookie(name: string) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax; Secure`;
    }

    // Access Token Metodları
    getToken() {
        return this.getCookie(this.accessTokenKey);
    }

    setToken(token: string) {
        this.setCookie(this.accessTokenKey, token);
    }

    // Refresh Token Metodları
    getRefreshToken() {
        return this.getCookie(this.refreshTokenKey);
    }

    setRefreshToken(refreshToken: string) {
        this.setCookie(this.refreshTokenKey, refreshToken);
    }

    setAllTokens(token: string, refreshToken: string) {
        this.setToken(token);
        this.setRefreshToken(refreshToken);
    }

    removeToken() {
        this.deleteCookie(this.accessTokenKey);
        this.deleteCookie(this.refreshTokenKey);
    }

    hasToken() {
        return this.getToken() !== null;
    }

    // Access Token decoded bilgileri
    getEmail() {
        const decodedToken = getDecodedToken(this.getToken());
        return decodedToken ? decodedToken.sub : null;
    }

    getTokenStart() {
        const decodedToken = getDecodedToken(this.getToken());
        return decodedToken ? decodedToken.iat : null;
    }

    getTokenExpire() {
        const decodedToken = getDecodedToken(this.getToken());
        return decodedToken ? decodedToken.exp : null;
    }

    // Refresh Token decoded bilgileri
    getRefreshEmail() {
        const decodedToken = getDecodedToken(this.getRefreshToken());
        return decodedToken ? decodedToken.sub : null;
    }

    getRefreshTokenStart() {
        const decodedToken = getDecodedToken(this.getRefreshToken());
        return decodedToken ? decodedToken.iat : null;
    }

    getRefreshTokenExpire() {
        const decodedToken = getDecodedToken(this.getRefreshToken());
        return decodedToken ? decodedToken.exp : null;
    }
}

export default new TokenService();
