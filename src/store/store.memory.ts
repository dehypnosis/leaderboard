import * as fs from "fs";
import * as path from "path";
import { PlayerStore } from "./store";
import { Player } from "./player";


export class PlayerMemoryStore extends PlayerStore {
    private readonly map: Map<Player["id"], Player> = new Map();

    // Here, read given InitialData.txt file... to pretend to bootstrap initial database
    public async start(): Promise<void> {
        await super.start();

        this.map.clear();
        if (process.env.SKIP_LOAD) {
            return;
        }

        const lines = fs
            .readFileSync(path.resolve(__dirname, "../../res/InitialData.txt"))
            .toString()
            .trim()
            .split("\n");

        for (const line of lines) {
            const [_id, _mmr] = line.split(",");
            const id = parseInt(_id, 10);
            const mmr = parseInt(_mmr, 10);
            this.map.set(id, { id, mmr });
        }
        console.log(this.map.size, "# of users has been loaded from 'InitialData.txt' to PlayerMemoryStore");
    }

    protected create(payload: Player): Promise<Player> {
        const player = payload;
        this.map.set(payload.id, player);
        console.log(player, "has been created in PlayerMemoryStore");
        return Promise.resolve(player);
    }

    protected update(payload: Player): Promise<Player> {
        const player = payload;
        this.map.set(payload.id, player);
        console.log(player, "has been updated in PlayerMemoryStore");
        return Promise.resolve(player);
    }

    protected delete(payload: Pick<Player, "id">): Promise<Pick<Player, "id">> {
        this.map.delete(payload.id);
        return Promise.resolve(payload);
    }

    protected read(): Promise<Player[]> {
        return Promise.resolve(Array.from(this.map.values()));
    }

    public count(): Promise<number> {
        return Promise.resolve(this.map.size);
    }

    public has(payload: Pick<Player, "id">): Promise<boolean> {
        return Promise.resolve(this.map.has(payload.id));
    }
}