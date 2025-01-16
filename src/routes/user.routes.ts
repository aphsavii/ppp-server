import express from 'express';
import userController from '../controllers/user.controller';
import { verifyJwt } from '../middlewares/auth.middleware';

const userRouter = express.Router();

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/verify-session', userController.verifySession);
userRouter.get('/generate-otp/:regno', userController.generateOTP);
userRouter.post('/forgot-password', userController.forgotPass);
userRouter.get('/dashboard', verifyJwt, userController.getUserDashboard);

export default userRouter;