import { EventEmitter } from "events";
import { Player } from "./player";
import {
    AlreadyExistingPlayerError,
    NotFoundPlayerError,
    PlayerIdValidationError,
    PlayerMMRValidationError,
} from "../error";


export enum PlayerStoreEventType {
    INIT = "init",
    ADD ="add",
    UPDATE = "update",
    DELETE = "delete",
}

export type PlayerStoreEvent = {
    type: PlayerStoreEventType.DELETE;
    payload: Pick<Player, "id">;
} | {
    type: PlayerStoreEventType.ADD | PlayerStoreEventType.UPDATE;
    payload: Player;
} | {
    type: PlayerStoreEventType.INIT;
    payload: Player[];
};

export interface PlayerStoreConsumer {
    onPlayerStoreEvent(event: PlayerStoreEvent): void;
}

export abstract class PlayerStore {
    private static readonly EventName = "PLAYER";
    private readonly emitter = new EventEmitter();

    /* lifecycle */
    public async start(): Promise<void> {
        console.log("PlayerStore has been started");
    }

    public async stop(): Promise<void> {
        this.emitter.removeAllListeners(PlayerStore.EventName);
        console.log("PlayerStore has been stopped");
    }

    /* pub/sub interface */
    public registerConsumer(consumer: PlayerStoreConsumer): Promise<void> {
        this.emitter.addListener(PlayerStore.EventName, consumer.onPlayerStoreEvent);

        // initialized with current data
        return this.read()
            .then((players) => {
                consumer.onPlayerStoreEvent({
                    type: PlayerStoreEventType.INIT,
                    payload: players,
                });
            });
    }

    public unregisterConsumer(consumer: PlayerStoreConsumer): Promise<void> {
        this.emitter.removeListener(PlayerStore.EventName,  consumer.onPlayerStoreEvent);
        return Promise.resolve();
    }

    protected broadcast(event: PlayerStoreEvent) {
        console.log({ event });
        this.emitter.emit(PlayerStore.EventName, event);
    }

    /* public methods */
    public async createAndBroadcast(payload: Player): Promise<Player> {
        await this.validatePayload(payload, false);

        const player = await this.create(payload);
        this.broadcast({
            type: PlayerStoreEventType.ADD,
            payload: player,
        });
        return player;
    }

    public async updateAndBroadcast(payload: Player): Promise<Player> {
        await this.validatePayload(payload, true);

        const player = await this.update(payload);
        this.broadcast({
            type: PlayerStoreEventType.UPDATE,
            payload: player,
        });
        return player;
    }

    public async deleteAndBroadcast(payload: Pick<Player, "id">): Promise<Pick<Player, "id">> {
        await this.validatePayload({
            ...payload,
            mmr: 1,
        }, true);

        const player = await this.delete(payload);
        this.broadcast({
            type: PlayerStoreEventType.DELETE,
            payload: player,
        });
        return player;
    }

    private async validatePayload(payload: Player, shouldExist: boolean): Promise<void> {
        if (typeof payload.id !== "number" || isNaN(payload.id) || payload.id <= 0 || payload.id % 1 !== 0) {
            throw new PlayerIdValidationError();
        }
        if (typeof payload.mmr !== "number" || isNaN(payload.mmr) || payload.mmr < 0 || payload.mmr % 1 !== 0) {
            throw new PlayerMMRValidationError();
        }

        const exists = await this.has(payload);
        if (shouldExist && !exists) {
            throw new NotFoundPlayerError();
        } else if (!shouldExist && exists) {
            throw new AlreadyExistingPlayerError();
        }
    }


    /* delegated methods */
    protected abstract create(payload: Player): Promise<Player>;

    protected abstract update(payload: Player): Promise<Player>;

    protected abstract delete(payload: Pick<Player, "id">): Promise<Pick<Player, "id">>;

    protected abstract read(): Promise<Player[]>;

    public abstract has(payload: Pick<Player, "id">): Promise<boolean>;

    public abstract count(): Promise<number>;
}

new PlayerMMRValidationError()