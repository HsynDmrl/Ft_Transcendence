import type {
    CreateUserDto,
    CreateUserResponseDto,
    UpdateUserDto,
    UpdateUserResponseDto,
    User,
    UserDetail
} from "../models/UserModels";

import { BaseService } from "./baseService";

class UserService extends BaseService<
    User[],
    UserDetail,
    CreateUserDto,
    CreateUserResponseDto,
    UpdateUserDto,
    UpdateUserResponseDto
> {
    constructor() {
        super("/users");
    }
}

export const userService = new UserService();
