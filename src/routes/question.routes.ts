import express from 'express';
import { verifyJwt,adminAccess } from '../middlewares/auth.middleware';
import questionController from '../controllers/question.controller';
import upload from '../middlewares/upload.middleware';
const questionRouter = express.Router();

questionRouter.post('/get',verifyJwt,adminAccess,questionController.getQuestions);
questionRouter.post('/create', verifyJwt,adminAccess, upload.single('img'),questionController.addQuestion);
questionRouter.delete('/:id',verifyJwt,adminAccess,questionController.deleteQuestion);
export default questionRouter;