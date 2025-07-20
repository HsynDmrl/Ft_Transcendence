import { BASE_WS_URL } from "../environment/environment";
import tokenService from "./tokenService";

type ChatEvent = any;

class ChatService {
    private ws: WebSocket | null = null;
    private listeners: ((event: ChatEvent) => void)[] = [];
    private onOpenCallbacks: (() => void)[] = [];
    private isAuthenticated: boolean = false;
    private isRoomJoined: boolean = false;
    private currentRoomId: string | null = null;

    connect(token?: string, onOpen?: () => void, onClose?: () => void) {
        if (this.ws) {
            if (this.ws.readyState === 1) {
                this.ws.close();
            }
            this.ws = null;
        }
        this.onOpenCallbacks = [];
        const baseUrl = BASE_WS_URL || "ws://localhost:3007";
        const accessToken = token || tokenService.getToken();
        const wsUrl = `${baseUrl}/chat`;

        try {
            this.ws = new WebSocket(wsUrl);
        } catch (err) {
            console.error("WebSocket connection error:", err);
            return;
        }

        this.ws.onopen = () => {
            if (accessToken && this.ws && this.ws.readyState === 1) {
                this.ws.send(JSON.stringify({ action: "authenticate", token: accessToken }));
            }
            if (onOpen) onOpen();
            this.onOpenCallbacks.forEach(cb => cb());
        };

        this.ws.onerror = (event) => {
            if (this.ws && this.ws.readyState === 1) {
                console.error("WebSocket error:", event);
            }
        };

        this.ws.onclose = () => {
            if (onClose) onClose();
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "authenticated") {
                    this.isAuthenticated = true;
                }
                if (data.type === "joined") {
                    this.isRoomJoined = true;
                    this.currentRoomId = data.roomId || (data.room && data.room.id) || null;
                }
                if (data.type === "left") {
                    this.isRoomJoined = false;
                    this.currentRoomId = null;
                }
                if (data.type === "error") {
                    if (data.message && data.message.toLowerCase().includes("not authenticated")) {
                        this.isAuthenticated = false;
                    }
                    if (data.message && data.message.toLowerCase().includes("not found")) {
                        this.isRoomJoined = false;
                        this.currentRoomId = null;
                    }
                }

                this.listeners.forEach((cb) => cb(data));
            } catch {}
        };
    }

    onOpen(cb: () => void) {
        if (!this.onOpenCallbacks.includes(cb)) {
            this.onOpenCallbacks.push(cb);
        }
    }

    offOpen(cb: () => void) {
        this.onOpenCallbacks = this.onOpenCallbacks.filter(fn => fn !== cb);
    }

    disconnect() {
        if (this.ws) {
            if (this.ws.readyState === 1) {
                try {
                    this.ws.close();
                } catch {}
            }
            this.ws = null;
        }
        this.listeners = [];
        this.onOpenCallbacks = [];
        this.isAuthenticated = false;
        this.isRoomJoined = false;
        this.currentRoomId = null;
    }

    joinRoom(roomId: string, roomName: string) {
        if (this.ws && this.ws.readyState === 1 && this.isAuthenticated) {
            this.ws.send(JSON.stringify({ action: "join", room: { id: roomId, name: roomName } }));
        }
    }

    leaveRoom(roomId: string) {
        if (this.ws && this.ws.readyState === 1 && this.isAuthenticated && this.isRoomJoined && this.currentRoomId === roomId) {
            this.ws.send(JSON.stringify({ action: "leave", roomId }));
        }
    }

    sendMessage(chatRoomId: string, message: string, messageType: string = "text") {
        if (
            this.ws &&
            this.ws.readyState === 1 &&
            this.isAuthenticated &&
            this.isRoomJoined &&
            this.currentRoomId === chatRoomId
        ) {
            this.ws.send(JSON.stringify({ action: "sendMessage", chatMessage: { chatRoomId, message, messageType } }));
        }
    }

    onEvent(cb: (event: ChatEvent) => void) {
        this.listeners.push(cb);
    }

    offEvent(cb: (event: ChatEvent) => void) {
        this.listeners = this.listeners.filter((fn) => fn !== cb);
    }

    getRoomInfo(roomId: string) {
        if (this.ws && this.ws.readyState === 1 && this.isAuthenticated) {
            this.ws.send(JSON.stringify({ action: "getRoomInfo", roomId }));
        }
    }
}

export const chatService = new ChatService();