import express from 'express';
import userController from '../controllers/user.controller';

const userRouter = express.Router();

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/verify-session', userController.verifySession);
userRouter.get('/generate-otp/:regno', userController.generateOTP);
userRouter.post('/forgot-password', userController.forgotPass);

export default userRouter;