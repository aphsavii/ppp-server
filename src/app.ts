import express from 'express';
import { Request, Response } from 'express';
import { createServer, Server } from 'http';
import { redisClient } from './connections/redis-connection';
import cors from 'cors';

// Import routes
import userRouter from './routes/user.routes';
import aptitudeRouter from './routes/aptitude.routes';
import questionRouter from './routes/question.routes';
class App{
    public app: express.Application;
    public server: Server;

    constructor(){
        this.app = express();
        this.server = createServer(this.app);
        this.app.use(express.static('public'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors(
            {
                origin: "*",
                credentials: true
            }
        ));
        this.app.get('/', (req: Request, res: Response) => {
            res.send('Hello World');
        });
        redisClient.on("error", (err) => console.log("Redis Client Error", err))
        redisClient.connect().then(() => console.log("Connected to redis"));
    }

    public listen(){
        this.server.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    }

    public initializeRoutes(){
        // Add your routes here
        this.app.use('/user', userRouter);
        this.app.use('/aptitude', aptitudeRouter);
        this.app.use('/question', questionRouter);
    }
}

export default new App(); 