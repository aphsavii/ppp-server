import express from 'express';
import userController from '../controllers/user.controller';
import { verifyJwt } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const userRouter = express.Router();

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/verify-session', userController.verifySession);
userRouter.get('/generate-otp/:regno', userController.generateOTP);
userRouter.post('/forgot-password', userController.forgotPass);
userRouter.get('/dashboard', verifyJwt, userController.getUserDashboard);
userRouter.post('/update-avatar', verifyJwt, upload.single('avatar'), userController.uploadAvatar);

export default userRouter;