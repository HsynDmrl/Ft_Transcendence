import axiosInstance from "../core/utils/interceptors/axiosInterceptors";

export interface Friend {
    id: number;
    displayName: string;
    avatar?: string;
    email: string;
}

export interface FriendRequest {
    id: number;
    fromDisplayName: string;
    toDisplayName: string;
    status: "pending" | "accepted" | "declined";
    createdAt: string;
}

class FriendsService {
    async getFriends(): Promise<Friend[]> {
        const res = await axiosInstance.get("/friendship/friends");
        return res.data;
    }

    async sendFriendRequest(friendDisplayName: string): Promise<{ message: string }> {
        const res = await axiosInstance.post("/friendship/request", { friendDisplayName });
        return res.data;
    }

    async getFriendRequests(): Promise<FriendRequest[]> {
        const res = await axiosInstance.get("/friendship/requests");
        return res.data;
    }

    async acceptFriendRequest(requestId: number): Promise<{ message: string }> {
        const res = await axiosInstance.post("/friendship/request/accept", { requestId });
        return res.data;
    }

    async declineFriendRequest(requestId: number): Promise<{ message: string }> {
        const res = await axiosInstance.post("/friendship/request/decline", { requestId });
        return res.data;
    }
}

export const friendsService = new FriendsService();
