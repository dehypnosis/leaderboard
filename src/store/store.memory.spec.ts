import { PlayerMemoryStore } from "./store.memory";
import { PlayerStoreConsumer, PlayerStoreEventType } from "./store";
import { BadRequestError, ValidationError } from "../error";


/* initialize store */
let store: PlayerMemoryStore;

beforeAll(async () => {
    store = new PlayerMemoryStore();
    await store.started();
});

afterAll(async () => {
    if (store) {
        await store.stopped();
    }
});


/* unit tests here */
const DATA_N = 25000;

describe("memory store", () => {
    it("should load InitialData.txt well and counts properly: started(), count()", () => {
        return expect(store.count()).resolves.toBe(DATA_N);
    });

    it("should initialize consumer properly: registerConsumer(), unregisterConsumer(), read()", async () => {
        const mock: PlayerStoreConsumer =  jest.fn();

        await store.registerConsumer(mock);
        await store.unregisterConsumer(mock);
        expect(mock).toBeCalledTimes(1);
        expect(mock).toBeCalledWith(
            expect.objectContaining({
                type: PlayerStoreEventType.INIT,
                payload: expect.arrayContaining([
                    expect.objectContaining({
                        id: expect.any(Number),
                        mmr: expect.any(Number),
                    }),
                ]),
            }),
        );
    });

    it("should throw an error for invalid mmr in create payload: validatePayload(), createAndBroadcast()", async () => {
        await expect(
            store.createAndBroadcast({
                id: 100,
                // @ts-ignore
                mmr: "100.5",
            })
        )
            .rejects.toThrowError(new ValidationError("mmr should be an integer greater than zero."));
    });

    it("should throw an error for invalid id in update payload: validatePayload(), updateAndBroadcast()", async () => {
        await expect(
            store.updateAndBroadcast({
                // @ts-ignore
                id: "1.5",
                mmr: 100,
            })
        )
            .rejects.toThrowError(new ValidationError("id should be an integer either equal or greater than zero."));
    });

    it("should throw an error for invalid id in delete payload: validatePayload(), deleteAndBroadcast()", async () => {
        await expect(
            store.deleteAndBroadcast({
                // @ts-ignore
                id: "1.5",
            })
        )
            .rejects.toThrow(new ValidationError("id should be an integer either equal or greater than zero."));
    });

    it("should throw an error for not existing id in update/delete payload: updateAndBroadcast(), deleteAndBroadcast()", async () => {
        await expect(
            store.deleteAndBroadcast({
                id: 99999999,
            })
        )
            .rejects.toThrow(new BadRequestError("cannot find the player with given id."));

        await expect(
            store.updateAndBroadcast({
                id: 99999999,
                mmr: 1,
            })
        )
            .rejects.toThrow(new BadRequestError("cannot find the player with given id."));
    });

    it("should return created payload well and should throw for duplicate id: createAndBroadcast(), registerConsumer(), unregisterConsumer()", async () => {
        const mock: PlayerStoreConsumer = jest.fn();

        await store.registerConsumer(mock);
        const payload = {
            id: 919191919,
            mmr: 10101010,
        };

        // should return created one
        const player = await store.createAndBroadcast(payload);
        await expect(player).toStrictEqual(expect.objectContaining(payload));
        await expect(store.count()).resolves.toBeGreaterThan(DATA_N);

        // unregister consumer and create duplicate one
        await store.unregisterConsumer(mock);
        await expect(store.createAndBroadcast(payload)).rejects.toThrowError(new BadRequestError("given player id already exists."));

        // mock should be called
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(mock).toHaveBeenLastCalledWith({
            type: PlayerStoreEventType.ADD,
            payload: player,
        });
    });

    it("should return update payload well: createAndBroadcast(), updateAndBroadcast(), deleteAndBroadcast()", async () => {
        const mock: PlayerStoreConsumer = jest.fn();

        await store.registerConsumer(mock);
        const payload = {
            id: 9988989,
            mmr: 10101010,
        };

        // should return created one
        const player = await store.createAndBroadcast(payload);
        await expect(player).toStrictEqual(expect.objectContaining(payload));

        // unregister consumer and create extra one
        const payload2 = { ...player, mmr: 202020202 };
        const player2 = await store.updateAndBroadcast(payload2);
        await expect(player2).not.toStrictEqual(expect.objectContaining(player));

        // mock should be called
        await new Promise(resolve => setTimeout(resolve, 1000));
        expect(mock).toHaveBeenLastCalledWith({
            type: PlayerStoreEventType.UPDATE,
            payload: payload2,
        });

        // delete user
        await expect(store.deleteAndBroadcast(player2)).resolves
            .toStrictEqual(expect.objectContaining(player2));
    });
});