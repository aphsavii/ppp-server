import express from 'express';
import userController from '../controllers/user.controller';
import { verifyJwt, adminAccess } from '../middlewares/auth.middleware';
import upload from '../middlewares/upload.middleware';

const userRouter = express.Router();

userRouter.post('/register', userController.register);
userRouter.post('/login', userController.login);
userRouter.get('/verify-session', userController.verifySession);
userRouter.get('/generate-otp/:regno', userController.generateOTP);
userRouter.post('/forgot-password', userController.forgotPass);
userRouter.get('/dashboard', verifyJwt, userController.getUserDashboard);
userRouter.post('/update-avatar', verifyJwt, upload.single('avatar'), userController.uploadAvatar);
userRouter.post('/block', verifyJwt, adminAccess, userController.blockUser);
userRouter.post('/unblock', verifyJwt, adminAccess, userController.unblockUser);
userRouter.get('/blocked', verifyJwt, adminAccess, userController.getBlockedUsers);
userRouter.post('/add-jsprs', verifyJwt, adminAccess, userController.addJsprs);
userRouter.get('/jsprs', userController.getJsprs);
userRouter.post('/change-password', verifyJwt, userController.changePassword);
userRouter.put('/edit-profile', verifyJwt, userController.editProfile);

export default userRouter;