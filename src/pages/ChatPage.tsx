import { useEffect, useState, useRef } from "react";
import { chatService } from "../services/chatService";
import tokenService from "../services/tokenService";
import { useUser } from "../context/user/UserContext";
import { useLanguage } from "../context/language/LanguageContext";

function getLocale(lang: string) {
    if (lang === "tr") return "tr-TR";
    if (lang === "de") return "de-DE";
    return "en-US";
}

function localizeAMPM(dateStr: string, lang: string) {
    if (lang === "tr") {
        return dateStr.replace("AM", "ÖÖ").replace("PM", "ÖS");
    }
    if (lang === "de") {
        return dateStr.replace("AM", "vorm.").replace("PM", "nachm.");
    }
    return dateStr;
}

export default function ChatPage() {
    const { t, lang } = useLanguage(); 
    const { user } = useUser();
    const [connected, setConnected] = useState(false);
    const [activeRoomId, setActiveRoomId] = useState("room_123"); 
    const [activeRoomName, setActiveRoomName] = useState("General Chat");
    const [messagesByRoom, setMessagesByRoom] = useState<{ [roomId: string]: any[] }>({}); 
    const [input, setInput] = useState("");
    const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
    const [privateMode, setPrivateMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const prevOnlineUsersRef = useRef<any[]>([]);

    useEffect(() => {
        if (!user) return;
        chatService.connect(tokenService.getToken() || "", () => setConnected(true), () => setConnected(false));

        const handleEvent = (event: any) => {
            if (event.type === "message") {
                const roomId = event.data?.chatRoomId;
                if (!roomId) return;
                setMessagesByRoom(prev => ({
                    ...prev,
                    [roomId]: [...(prev[roomId] || []), event.data]
                }));
            }
            if (event.type === "joined") {
                const username = event.user?.username || event.username || "";
                if (username) {
                    setMessagesByRoom(prev => ({
                        ...prev,
                        [activeRoomId]: [
                            ...(prev[activeRoomId] || []),
                            {
                                system: true,
                                message: t("chat_room_user_joined").replace("{{username}}", username),
                                timestamp: new Date().toISOString(),
                            }
                        ]
                    }));
                }
                chatService.getRoomInfo(activeRoomId);
            }
            if (event.type === "left") {
                const username = event.user?.username || event.username || "";
                if (username) {
                    setMessagesByRoom(prev => ({
                        ...prev,
                        [activeRoomId]: [
                            ...(prev[activeRoomId] || []),
                            {
                                system: true,
                                message: t("chat_room_user_left").replace("{{username}}", username),
                                timestamp: new Date().toISOString(),
                            }
                        ]
                    }));
                }
                chatService.getRoomInfo(activeRoomId);
            }
            if (event.type === "userJoined") {
                const username = event.user?.username || event.user?.name;
                if (username) {
                    setMessagesByRoom(prev => ({
                        ...prev,
                        [activeRoomId]: [
                            ...(prev[activeRoomId] || []),
                            {
                                system: true,
                                message: t("chat_room_user_joined").replace("{{username}}", username),
                                timestamp: new Date().toISOString(),
                            }
                        ]
                    }));
                }
                chatService.getRoomInfo(activeRoomId);
            }
            if (event.type === "userDisconnected") {
                const username = event.user?.username || event.user?.name;
                if (username) {
                    setMessagesByRoom(prev => ({
                        ...prev,
                        [activeRoomId]: [
                            ...(prev[activeRoomId] || []),
                            {
                                system: true,
                                message: t("chat_room_user_left").replace("{{username}}", username),
                                timestamp: new Date().toISOString(),
                            }
                        ]
                    }));
                }
                chatService.getRoomInfo(activeRoomId);
            }
            if (event.type === "onlineUsers" && Array.isArray(event.users)) {
                setOnlineUsers(event.users);
                prevOnlineUsersRef.current = event.users;
            }
            if (event.type === "roomInfo" && event.room && Array.isArray(event.room.members)) {
                const users = event.room.members.map((username: string, idx: number) => ({
                    id: idx,
                    username,
                    avatar: undefined,
                }));
                setOnlineUsers(users);
                prevOnlineUsersRef.current = users;
            }
            if (event.type === "authenticated") {
                chatService.joinRoom("room_123", "General Chat");
            }
        };
        chatService.onEvent(handleEvent);

        return () => {
            chatService.disconnect();
            chatService.offEvent(handleEvent);
            prevOnlineUsersRef.current = [];
        };
    }, [user]);

    function getPrivateChannelId(userA: string, userB: string) {
        return ["private", ...[userA, userB].sort()].join("_");
    }

    const handleStartPrivateChat = (otherUser: any) => {
        if (!user || !otherUser || !otherUser.username) return;
        const channelId = getPrivateChannelId(user.displayName, otherUser.username);
        setActiveRoomId(channelId);
        setActiveRoomName(t("chat_private_prefix").replace("{{username}}", otherUser.username));
        setPrivateMode(true);
        setSelectedUser(otherUser);
        chatService.joinRoom(channelId, t("chat_private_prefix").replace("{{username}}", otherUser.username));
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            setMessagesByRoom(prev => ({
                ...prev,
                [activeRoomId]: [
                    ...(prev[activeRoomId] || []),
                    {
                        senderName: user?.displayName || "",
                        message: input.trim(),
                        timestamp: new Date().toISOString(),
                    }
                ]
            }));
            chatService.sendMessage(activeRoomId, input.trim(), "text");
            setInput("");
        }
    };

    const handleBackToGeneral = () => {
        setActiveRoomId("room_123");
        setActiveRoomName("General Chat");
        setPrivateMode(false);
        setSelectedUser(null);
        setInput("");
        chatService.joinRoom("room_123", "General Chat"); 
    };

    const activeMessages = messagesByRoom[activeRoomId] || [];

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [activeMessages]);

    return (
        <div className="max-w-4xl mx-auto mt-24 p-6 bg-white rounded shadow flex flex-col md:flex-row gap-8">
            {/* Chat alanı */}
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">{t("chat_title")}</h1>
                <div className="mb-2 text-center text-gray-600">
                    {connected ? t("chat_connected") : t("chat_disconnected")}
                </div>
                <div className="mb-2 text-center">
                    <span className="font-semibold">
                        {privateMode
                            ? `${t("chat_channel")}: ${activeRoomName}`
                            : `${t("chat_channel")}: ${t("chat_room")}`}
                    </span>
                    {privateMode && (
                        <button
                            className="ml-4 px-3 py-1 bg-gray-200 rounded text-sm"
                            onClick={handleBackToGeneral}
                        >
                            {t("chat_room")}
                        </button>
                    )}
                </div>
                <div className="border rounded bg-gray-50 h-80 overflow-y-auto p-4 mb-4">
                    {activeMessages.length === 0 ? (
                        <div className="text-center text-gray-400">{t("chat_empty")}</div>
                    ) : (
                        activeMessages.map((msg, idx) => {
                            if (msg.system) {
                                return (
                                    <div key={idx} className="mb-2">
                                        <span className="text-xs text-gray-500 italic">{msg.message}</span>
                                    </div>
                                );
                            }
                            const isOwn = msg.senderName === user?.displayName;
                            return (
                                <div
                                    key={idx}
                                    className={`mb-2 flex ${isOwn ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-sm px-2.5 py-2 rounded shadow break-words whitespace-pre-line ${
                                            isOwn
                                                ? "bg-blue-100 text-right"
                                                : "bg-white"
                                        }`}
                                    >
                                        <span className="font-semibold text-blue-700">{msg.senderName}: </span>
                                        <span>{msg.message}</span>
                                        <span className="text-xs text-gray-400 ml-2">
                                            {localizeAMPM(
                                                new Date(msg.timestamp).toLocaleString(getLocale(lang), { hour12: true }),
                                                lang
                                            )}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="border rounded px-3 py-2 flex-1"
                        placeholder={t("chat_input_placeholder")}
                        disabled={!connected}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                        disabled={!connected || !input.trim()}
                    >
                        {t("chat_send")}
                    </button>
                </form>
            </div>
            {/* Online kullanıcılar paneli */}
            <div className="w-full md:w-64 bg-gray-100 rounded-lg shadow p-4 flex flex-col items-center">
                <h2 className="text-lg font-bold mb-4 text-blue-700">{t("chat_online_users")}</h2>
                {onlineUsers.length === 0 ? (
                    <div className="text-gray-500">{t("chat_no_online")}</div>
                ) : (
                    <ul className="w-full flex flex-col gap-3">
                        {onlineUsers.map((u: any, idx: number) => (
                            <li
                                key={u.id || idx}
                                className="flex items-center gap-3 bg-white rounded px-3 py-2 shadow cursor-pointer hover:bg-blue-50"
                                onClick={() => {
                                    if (u.username !== user?.displayName) {
                                        handleStartPrivateChat(u);
                                    }
                                }}
                            >
                                {u.avatar ? (
                                    <img src={u.avatar} alt={u.username || u.name} className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                                        {(u.username || u.name || "?")[0]}
                                    </div>
                                )}
                                <span className="font-semibold">{u.username || u.name}</span>
                                {u.username === user?.displayName && (
                                    <span className="ml-2 text-xs text-gray-400">(You)</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}