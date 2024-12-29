import { Request, Response } from 'express';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

class UserController {
    public login = asyncHandler(async (req: Request, res: Response) => {
        // if (true || null) {
        //     throw new ApiError('Username and password are required', 400);
        // }
        const token = 'some-token';
        const message = 'User logged in successfully';
        const status = 200;
        const data = { token };
        const apiResponse = new ApiResponse(message, status, data);
        res.status(status).json(apiResponse);
    });
}

export default new UserController();