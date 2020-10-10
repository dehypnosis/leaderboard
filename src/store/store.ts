import { EventEmitter } from "events";
import { Player } from "./player";
import { ValidationError } from "../error";


export enum PlayerStoreEventType {
    // TODO: add init, i think it is a problem related to sorting.... or binary search
    ADD ="add",
    UPDATE = "update",
    DELETE = "delete",
    LOAD = "load",
}

export type PlayerStoreEvent = {
    type: PlayerStoreEventType.DELETE;
    payload: Pick<Player, "id">;
} | {
    type: PlayerStoreEventType.ADD | PlayerStoreEventType.UPDATE;
    payload: Player;
} | {
    type: PlayerStoreEventType.LOAD;
    payload: Player[];
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
                consumer({
                    type: PlayerStoreEventType.LOAD,
                    payload: players,
                });
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
    public async createAndBroadcast(payload: Player): Promise<Player> {
        this.validatePayload(payload);

        const player = await this.create(payload);
        this.broadcast({
            type: PlayerStoreEventType.ADD,
            payload: player,
        });
        return player;
    }

    public async updateAndBroadcast(payload: Player): Promise<Player> {
        this.validatePayload(payload);

        const player = await this.update(payload);
        this.broadcast({
            type: PlayerStoreEventType.UPDATE,
            payload: player,
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
            payload: player,
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
    protected abstract create(payload: Player): Promise<Player>;

    protected abstract update(payload: Player): Promise<Player>;

    protected abstract delete(payload: Pick<Player, "id">): Promise<Pick<Player, "id">>;

    protected abstract read(): Promise<Player[]>;

    public abstract count(): Promise<number>;
}