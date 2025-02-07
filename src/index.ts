import cluster from 'cluster';
import os from 'os';
import { testConnection } from "./connections/pg-connection";
import app from "./app";

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Fork worker processes (one per CPU)
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died, restarting...`);
        cluster.fork();
    });
} else {
    console.log(`Worker ${process.pid} started`);
    
    // Initialize DB connection only for workers
    testConnection();

    // Start Express server
    app.listen();
    app.initializeRoutes();
}
