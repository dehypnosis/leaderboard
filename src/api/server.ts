import http from "http";
import path from "path";
import fs from "fs";
import YAML from "yaml";
import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import swaggerUI from "swagger-ui-express";
import {Player, PlayerStore} from "../store";
import {PlayerLeaderBoard, PlayerLeaderBoardFindArgs, PlayerLeaderBoardGetArgs} from "../leaderboard";
import { ErrorRequestHandler } from "express-serve-static-core";

const swaggerDoc = YAML.parse(fs.readFileSync(path.resolve(__dirname, "../../swagger.yaml")).toString());

export class APIServer {
    private readonly app = express();
    private readonly leaderboard = new PlayerLeaderBoard();
    private server: http.Server | undefined;

    constructor(private readonly store: PlayerStore, private readonly port: number = 8080, private readonly hostname: string = "0.0.0.0") {
        // configuration
        this.app.set("json spaces", 2);

        // add middleware
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(morgan("common")); // show request logs simply

        // mount players router
        const players = express.Router({ caseSensitive: false, strict: false });

        players.get("/count", (req, res) => {
            const total = this.leaderboard.count();
            res.json({ total });
        });

        players.get("/:id", (req, res) => {
            const payload: PlayerLeaderBoardFindArgs = {
                id: parseInt(req.params.id),
            };
            const player = this.leaderboard.find(payload);
            res.json(player);
        });

        players.put("/:id", async (req, res, next) => {
            try {
                const payload: Player = {
                    id: parseInt(req.params.id),
                    mmr: parseInt(req.body.mmr),
                };
                await this.store.updateAndBroadcast(payload);
                process.nextTick(() => {
                    const player = this.leaderboard.find({ id: payload.id });
                    res.json(player);
                });
            } catch (err) {
                next(err);
            }
        });

        players.delete("/:id", async (req, res, next) => {
            try {
                const payload: Pick<Player, "id"> = {
                    id: parseInt(req.params.id),
                };
                await this.store.deleteAndBroadcast(payload);
                res.status(200).end();
            } catch (err) {
                next(err);
            }
        });

        players.post("/", async (req, res, next) => {
            try {
                const payload: Player = {
                    id: parseInt(req.body.id),
                    mmr: parseInt(req.body.mmr),
                };
                await this.store.createAndBroadcast(payload);
                process.nextTick(() => {
                    const player = this.leaderboard.find({ id: payload.id });
                    res.json(player);
                });
            } catch (err) {
                next(err);
            }
        });

        const defaultGetPayload = {
            strategy: "rank",
            offset: 0,
            limit: 10,
            range: 5,
        };
        players.get("/", (req, res) => {
            const payload: PlayerLeaderBoardGetArgs = {
                ...defaultGetPayload as any,
            };
            for (const [k, v] of Object.entries(req.query)) {
                switch (k) {
                    case "strategy":
                        if (v) {
                            // @ts-ignore
                            payload[k] = v;
                        }
                        break;
                    default:
                        // @ts-ignore
                        payload[k] = parseInt(v);
                        break;
                }
            }
            const players = this.leaderboard.get(payload);
            res.json(players);
        });

        this.app.use("/players", players);

        // mount swagger doc
        this.app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

        // error middleware
        const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
            if (typeof error.code === "number") {
                res.status(error.code).json(error);
            } else {
                next(error);
            }
        };
        this.app.use(errorHandler);
    }

    /* lifecycle */
    public async start(): Promise<void> {
        // check server already runs
        if (this.server) {
            await this.stop();
        }

        // run lifecycle hooks
        await this.store.start();

        // register subscription
        await this.store.registerConsumer(this.leaderboard);

        // run http server
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.port, this.hostname, () => {
                    resolve();
                    console.log("HTTP API Server has been started");
                });
            } catch (err) {
                reject(err);
            }
        })
    }

    public async stop(): Promise<void> {
        if (!this.server) {
            return;
        }

        // stop http server
        await new Promise((resolve, reject) => {
            try {
                this.server!.close(() => {
                    console.log("HTTP API Server has been stopped");
                    delete this.server;
                    resolve();
                });
            } catch (err) {
                reject(err);
            }
        });

        // unregister subscription
        await this.store.unregisterConsumer(this.leaderboard);

        // run lifecycle hooks
        await this.store.stop();
    }
}
