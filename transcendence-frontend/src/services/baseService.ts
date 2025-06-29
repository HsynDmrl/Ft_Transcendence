import type { AxiosResponse } from "axios";
import axiosInstance from "../core/utils/interceptors/axiosInterceptors";

export interface PaginationRequest {
    page: number;
    size: number;
    sort?: string;
    [key: string]: any;
}

export interface PaginationResponse<T> {
    data: T[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export class BaseService<
    GetAllType,
    GetByIdType,
    AddRequestType,
    AddResponseType,
    UpdateRequestType,
    UpdateResponseType
> {
    public apiUrl: string;

    constructor(apiUrl: string) {
        this.apiUrl = apiUrl;
    }

    // Tüm verileri getir
    getAll(): Promise<AxiosResponse<GetAllType>> {
        return axiosInstance.get<GetAllType>(`${this.apiUrl}/getAll`);
    }

    // Sayfalama ile getir
    getAllPaginated(request: PaginationRequest): Promise<AxiosResponse<PaginationResponse<GetAllType>>> {
        return axiosInstance.get<PaginationResponse<GetAllType>>(`${this.apiUrl}/getAllPaginated`, {
            params: request,
        });
    }

    // ID ile getir
    getById(id: number): Promise<AxiosResponse<GetByIdType>> {
        return axiosInstance.get<GetByIdType>(`${this.apiUrl}/${id}`);
    }

    // Yeni ekle
    add(request: AddRequestType): Promise<AxiosResponse<AddResponseType>> {
        return axiosInstance.post<AddResponseType>(`${this.apiUrl}/add`, request);
    }

    // Güncelle
    update(request: UpdateRequestType): Promise<AxiosResponse<UpdateResponseType>> {
        return axiosInstance.put<UpdateResponseType>(`${this.apiUrl}/update`, request);
    }

    // Soft silme (veri DB'de kalır ama aktif değil)
    softDelete(id: number): Promise<AxiosResponse<void>> {
        return axiosInstance.delete<void>(`${this.apiUrl}/soft-delete/${id}`);
    }

    // Geri yükleme (soft silineni tekrar aktif yapar)
    restore(id: number): Promise<AxiosResponse<void>> {
        return axiosInstance.post<void>(`${this.apiUrl}/restore/${id}`, {});
    }

    // Kalıcı silme (veri tamamen silinir)
    hardDelete(id: number): Promise<AxiosResponse<void>> {
        return axiosInstance.delete<void>(`${this.apiUrl}/hard-delete/${id}`);
    }
}
