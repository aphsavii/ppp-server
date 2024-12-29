import express from 'express';
import { Request, Response } from 'express';
import { createServer, Server } from 'http';
import userRouter from './routes/user.routes';

class App{
    public app: express.Application;
    public server: Server;

    constructor(){
        this.app = express();
        this.server = createServer(this.app);
        this.app.get('/', (req: Request, res: Response) => {
            res.send('Hello World');
        });
    }

    public listen(){
        this.server.listen(3000, () => {
            console.log('Server is running on port 3000');
        });
    }

    public initializeRoutes(){
        // Add your routes here
        this.app.use('/user', userRouter);
    }
}

export default new App(); 