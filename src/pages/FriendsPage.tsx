import { useEffect, useState } from "react";
import { useLanguage } from "../context/language/LanguageProvider";
import { friendsService } from "../services/friendsService";
import { useUser } from "../context/user/UserContext";

interface Friend {
    id: number;
    displayName: string;
    avatar?: string;
    email: string;
}

export default function FriendsPage() {
    const { t } = useLanguage();
    const { user } = useUser();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Arkadaş daveti input ve mesaj state
    const [inviteName, setInviteName] = useState("");
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Davetler
    const [requests, setRequests] = useState<any[]>([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [requestsError, setRequestsError] = useState<string | null>(null);

    // Davet kabul etme işlemi
    const [acceptLoading, setAcceptLoading] = useState<number | null>(null);
    // Davet reddetme işlemi
    const [declineLoading, setDeclineLoading] = useState<number | null>(null);

    useEffect(() => {
        async function fetchFriends() {
            setLoading(true);
            setError(null);
            try {
                const res = await friendsService.getFriends();
                setFriends(res);
            } catch (err: any) {
                setError(t("friends_error"));
            }
            setLoading(false);
        }
        fetchFriends();
    }, [t]);

    useEffect(() => {
        async function fetchRequests() {
            setRequestsLoading(true);
            setRequestsError(null);
            try {
                const res = await friendsService.getFriendRequests();
                setRequests(res);
            } catch (err: any) {
                setRequestsError(t("friend_requests_error"));
            }
            setRequestsLoading(false);
        }
        fetchRequests();
    }, [t]);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteMessage(null);
        setInviteLoading(true);
        try {
            await friendsService.sendFriendRequest(inviteName);
            setInviteMessage(t("friend_invite_success"));
            setInviteName("");
        } catch (err: any) {
            console.log("sdfsdf", err);
            if (err?.response?.data.error === "Kullanıcı bulunamadı") {
                setInviteMessage(t("friend_invite_user_not_found"));
            } else if (err?.response?.data.error === "Zaten bekleyen bir istek var") {
                setInviteMessage(t("friend_invite_still_pending"));
            } else if (err?.response?.data.error === "Kendinize istek gönderemezsiniz") {
                setInviteMessage(t("friend_invite_self_request"));
            }
            else {
                setInviteMessage(t("friend_invite_error"));
            }
        }
        setInviteLoading(false);
    };

    const handleAccept = async (requestId: number) => {
        setAcceptLoading(requestId);
        try {
            await friendsService.acceptFriendRequest(requestId);
            // Davetler ve arkadaşlar listesini güncelle
            const updatedRequests = await friendsService.getFriendRequests();
            setRequests(updatedRequests);
            const updatedFriends = await friendsService.getFriends();
            setFriends(updatedFriends);
        } catch (err) {
            // Hata yönetimi eklenebilir
        }
        setAcceptLoading(null);
    };

    const handleDecline = async (requestId: number) => {
        setDeclineLoading(requestId);
        try {
            await friendsService.declineFriendRequest(requestId);
            // Davetler listesini güncelle
            const updatedRequests = await friendsService.getFriendRequests();
            setRequests(updatedRequests);
        } catch (err) {
            // Hata yönetimi eklenebilir
        }
        setDeclineLoading(null);
    };

    // Davetler bölümü için gelen ve gönderilen istekleri ayır
    const sentRequests = requests.filter(req => req.from.id === user?.id);
    const receivedRequests = requests.filter(req => req.to.id === user?.id);

    // Durum etiket rengi
    const getStatusColor = (status: string) => {
        if (status === "pending") return "bg-yellow-100 text-yellow-800 border-yellow-300";
        if (status === "accepted") return "bg-green-100 text-green-800 border-green-300";
        if (status === "declined") return "bg-red-100 text-red-800 border-red-300";
        return "bg-gray-100 text-gray-800 border-gray-300";
    };

    return (
        <div className="max-w-4xl mx-auto mt-24 p-6 bg-white rounded-md shadow-md">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">{t("friends_title")}</h1>
            {/* Arkadaş ekleme bölümü */}
            <form onSubmit={handleInviteSubmit} className="mb-8 flex flex-col md:flex-row items-center gap-4">
                <input
                    type="text"
                    value={inviteName}
                    onChange={e => setInviteName(e.target.value)}
                    placeholder={t("friend_invite_placeholder")}
                    className="border rounded px-3 py-2 flex-1"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded font-semibold"
                    disabled={inviteLoading}
                >
                    {t("friend_invite_button")}
                </button>
            </form>
            {inviteMessage && (
                <div
                    className={`mb-4 text-center font-semibold ${
                        inviteMessage === t("friend_invite_success")
                            ? "text-green-600"
                            : "text-red-600"
                    }`}
                >
                    {inviteMessage}
                </div>
            )}

            {/* Arkadaşlar listesi */}
            <h2 className="text-xl font-bold mb-4">{t("friends_list_title")}</h2>
            {loading ? (
                <p className="text-center text-gray-500">{t("friends_loading")}</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : friends.length === 0 ? (
                <p className="text-center text-gray-500">{t("friends_empty")}</p>
            ) : (
                <div className="mb-8">
                    <div className="flex flex-wrap gap-6">
                        {friends.map(friend => (
                            <div
                                key={friend.id}
                                className="flex items-center gap-3 bg-gray-50 rounded-lg shadow px-4 py-3 mb-2 min-w-[220px] max-w-xs"
                            >
                                {friend.avatar ? (
                                    <img src={friend.avatar} alt={friend.displayName} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl font-bold">
                                        {friend.displayName[0]}
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold text-lg">{friend.displayName}</div>
                                    <div className="text-gray-500 text-sm">{friend.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Davetler bölümü - iki sütunlu layout */}
            <h2 className="text-xl font-bold mb-4">{t("friend_requests_title")}</h2>
            {requestsLoading ? (
                <p className="text-center text-gray-500">{t("friend_requests_loading")}</p>
            ) : requestsError ? (
                <p className="text-center text-red-500">{requestsError}</p>
            ) : sentRequests.length === 0 && receivedRequests.length === 0 ? (
                <p className="text-center text-gray-500">{t("friend_requests_empty")}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Solda: Kullanıcının gönderdiği istekler */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-blue-700">{t("friend_request_sent") || "Gönderilen İstekler"}</h3>
                        <ul className="divide-y divide-gray-200">
                            {sentRequests.length === 0 ? (
                                <li className="py-2 text-gray-500 text-center">{t("friend_requests_empty")}</li>
                            ) : (
                                sentRequests.map(req => (
                                    <li
                                        key={req.id}
                                        className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-1"
                                    >
                                        <div>
                                            <span>
                                                <strong>{t("friend_request_to")}</strong> {req.to.displayName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 md:gap-4 mt-1 md:mt-0">
                                            <span className="text-xs text-gray-400">
                                                {new Date(req.createdAt).toLocaleString()}
                                            </span>
                                            <span className={`inline-block px-2 py-1 rounded border text-sm font-semibold ${getStatusColor(req.status)}`}>
                                                {t(`friend_request_status_${req.status}`)}
                                            </span>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                    {/* Sağda: Kullanıcıya gelen istekler */}
                    <div>
                        <h3 className="text-lg font-semibold mb-2 text-green-700">{t("friend_request_received") || "Gelen İstekler"}</h3>
                        <ul className="divide-y divide-gray-200">
                            {receivedRequests.length === 0 ? (
                                <li className="py-2 text-gray-500 text-center">{t("friend_requests_empty")}</li>
                            ) : (
                                receivedRequests.map(req => (
                                    <li key={req.id} className="py-3">
                                        {/* First row: Kimden & Status */}
                                        <div className="flex items-center justify-between">
                                            <span>
                                                <strong>{t("friend_request_from")}</strong> {req.from.displayName}
                                            </span>
                                            <span className={`inline-block px-2 py-1 rounded border text-sm font-semibold ${getStatusColor(req.status)}`}>
                                                {t(`friend_request_status_${req.status}`)}
                                            </span>
                                        </div>
                                        {/* Second row: Date & Buttons */}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-400">
                                                {new Date(req.createdAt).toLocaleString()}
                                            </span>
                                            {req.status === "pending" ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="px-4 py-1 bg-green-600 text-white rounded font-semibold hover:bg-green-700"
                                                        onClick={() => handleAccept(req.id)}
                                                        disabled={acceptLoading === req.id}
                                                    >
                                                        {acceptLoading === req.id ? t("friend_request_status_accepted") : t("friend_request_accept")}
                                                    </button>
                                                    <button
                                                        className="px-4 py-1 bg-red-600 text-white rounded font-semibold hover:bg-red-700"
                                                        onClick={() => handleDecline(req.id)}
                                                        disabled={declineLoading === req.id}
                                                    >
                                                        {declineLoading === req.id ? t("friend_request_status_declined") : t("friend_request_decline")}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div /> 
                                            )}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}
