import { EventEmitter } from "events";
import { Player } from "./player";
import { ValidationError } from "./error";

export enum PlayerStoreEventType {
    "ADD" ="add",
    "UPDATE" = "update",
    "DELETE" = "delete",
}

export type PlayerStoreEvent = {
    type: PlayerStoreEventType.DELETE;
    player: Pick<Player, "id">;
} | {
    type: PlayerStoreEventType.ADD | PlayerStoreEventType.UPDATE;
    player: Player;
};

export type PlayerStoreConsumer = (event: PlayerStoreEvent) => void;

export abstract class PlayerStore {
    private static readonly EventName = "PLAYER";
    private readonly emitter = new EventEmitter();

    /* lifecycle */
    public async started(): Promise<void> {
        console.log("PlayerStore has been started");
    }

    public async stopped(): Promise<void> {
        this.emitter.removeAllListeners(PlayerStore.EventName);
        console.log("PlayerStore has been stopped");
    }

    /* pub/sub interface */
    public registerConsumer(consumer: PlayerStoreConsumer): Promise<void> {
        this.emitter.addListener(PlayerStore.EventName, consumer);

        // initialized with current data
        return this.read()
            .then((players) => {
                for (const player of players) {
                    consumer({
                        type: PlayerStoreEventType.ADD,
                        player,
                    });
                }
            });
    }

    public unregisterConsumer(consumer: PlayerStoreConsumer): Promise<void> {
        this.emitter.removeListener(PlayerStore.EventName, consumer);
        return Promise.resolve();
    }

    protected broadcast(event: PlayerStoreEvent) {
        console.log({ event });
        this.emitter.emit(PlayerStore.EventName, event);
    }

    /* public methods */
    public async createAndBroadcast(payload: Omit<Player, "id">): Promise<Player> {
        this.validatePayload({
            ...payload,
            id: 1,
        });

        const player = await this.create(payload);
        this.broadcast({
            type: PlayerStoreEventType.ADD,
            player,
        });
        return player;
    }

    public async updateAndBroadcast(payload: Player): Promise<Player> {
        this.validatePayload(payload);

        const player = await this.update(payload);
        this.broadcast({
            type: PlayerStoreEventType.UPDATE,
            player,
        });
        return player;
    }

    public async deleteAndBroadcast(payload: Pick<Player, "id">): Promise<Pick<Player, "id">> {
        this.validatePayload({
            ...payload,
            mmr: 1,
        });

        const player = await this.delete(payload);
        this.broadcast({
            type: PlayerStoreEventType.DELETE,
            player,
        });
        return player;
    }

    private validatePayload(payload: Player) {
        if (isNaN(payload.id) || payload.id <= 0 || payload.id % 1 !== 0) {
            throw new ValidationError("id should be an integer either equal or greater than zero.");
        }
        if (isNaN(payload.mmr) || payload.mmr < 0 || payload.mmr % 1 !== 0) {
            throw new ValidationError("mmr should be an integer greater than zero.");
        }
    }


    /* delegated methods */
    protected abstract create(payload: Omit<Player, "id">): Promise<Player>;

    protected abstract update(payload: Player): Promise<Player>;

    protected abstract delete(payload: Pick<Player, "id">): Promise<Pick<Player, "id">>;

    protected abstract read(): Promise<Player[]>;

    public abstract count(): Promise<number>;
}