import { APIServer } from "./server";
import { PlayerMemoryStore } from "../store";

const store = new PlayerMemoryStore();
const server = new APIServer(store);

beforeAll(async () => {
    await server.start();
});

afterAll(async () => {
    await server.stop();
});

/* unit tests here */
describe("api server", () => {
    it("can restart: stop(), start()", async () => {
        await expect(server.stop()).resolves.toBeFalsy();
        await expect(server.start()).resolves.toBeFalsy();
    });
});