import { APIServer } from "./api";
import { PlayerMemoryStore } from "./store";

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080
const hostname = process.env.HOSTNAME || "0.0.0.0";

// create and run API server
const server = new APIServer(new PlayerMemoryStore(), port, hostname);
server
    .start()
    .then(() => {
        console.log(`API Server has been started: http://${hostname}:${port}`)

        // add interrupt hook
        process.once("SIGINT", () => {
            console.log("Kill the server by SIGINT");
            server.stop();
        });
    });

