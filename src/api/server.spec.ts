import supertest from "supertest";
import { APIServer } from "./server";
import { PlayerMemoryStore } from "../store";

describe("api server", () => {
    const server = new APIServer(new PlayerMemoryStore(0));
    beforeAll(async () => {
        await server.start();
    });
    afterAll(async () => {
        await server.stop();
    });

    it("can restart: stop(), start()", async () => {
        await expect(server.stop()).resolves.toBeFalsy();
        await expect(server.start()).resolves.toBeFalsy();
    });
});

describe("api endpoints", () => {
    const server = new APIServer(new PlayerMemoryStore(10));
    const request = () => supertest((server as any).server!);
    beforeAll(async () => {
        await server.start();
    });
    afterAll(async () => {
        await server.stop();
    });

    it("GET / - Swagger document", async () => {
        return request().get("/").then(res => {
            return expect(res.status).toEqual(200);
        });
    });

    it("GET /players/:id", async () => {
        await request().get("/players/7700").then(res => {
            expect(res.body).toEqual(expect.objectContaining({
                id: 7700,
                mmr: 1336,
            }));
            expect(res.status).toEqual(200);
        });
    });

    it("PUT /players/:id", async () => {
        await request().put("/players/7700").then(res => {
            expect(res.status).toEqual(422);
        });
        await request().put("/players/7700").send({
            mmr: "777",
        }).then(res => {
            expect(res.body).toEqual(expect.objectContaining({
                id: 7700,
                mmr: 777,
            }));
            expect(res.status).toEqual(200);
        });
    });

    it("DELETE /players/:id", async () => {
        await request().delete("/players/11511").then(res => {
            expect(res.status).toEqual(200);
        });
        await request().delete("/players/11511").then(res => {
            expect(res.status).toEqual(404);
        });
    });

    it("POST /players", async () => {
        await request().post("/players").then(res => {
            expect(res.status).toEqual(422);
        });
        await request().post("/players").send({ id: 7700 }).then(res => {
            expect(res.status).toEqual(422);
        });
        await request().post("/players").send({ id: 7700, mmr: 0 }).then(res => {
            expect(res.status).toEqual(400);
        });
        await request().post("/players").send({ id: "50000", mmr: "50000" }).then(res => {
            expect(res.body).toEqual(expect.objectContaining({
                id: 50000,
                mmr: 50000,
                rank: 1,
                tier: "CHALLENGER",
            }));
            expect(res.status).toEqual(200);
        });
    });

    it("GET /count", async () => {
        await request().get("/players/count").then(res => {
            expect(res.status).toEqual(200);
            return request().get("/players?limit=" + res.body.total).then(res2 => {
                expect(res2.status).toEqual(200);
                expect(res2.body.length).toEqual(res.body.total);
            });
        });
    });

    it("GET /players", async () => {
        await request().get("/players?strategy=xxx").then(res => {
            expect(res.status).toEqual(422);
        });
        await request().get("/players?strategy=around_player").then(res => {
            expect(res.status).toEqual(422);
        });
        await request().get("/players?strategy=around_player&player_id=1000000").then(res => {
            expect(res.status).toEqual(404);
        });

        await request().get("/players?strategy=rank&offset=0&limit=100").then(res => {
            expect(res.status).toEqual(200);
            console.log(res.body);
            const fifth = res.body[4];
            expect(fifth).toEqual(expect.objectContaining({ rank: 5 }));

            return request().get("/players?strategy=rank&offset=4").then(res2 => {
                expect(res2.status).toEqual(200);
                expect(res2.body[0]).toEqual(expect.objectContaining(fifth));

                return request().get("/players?strategy=around_player&range=2&player_id="+fifth.id).then(res3 => {
                    expect(res3.status).toEqual(200);
                    expect(res3.body.length).toEqual(5);
                    expect(res3.body).toEqual(expect.arrayContaining([
                        expect.objectContaining({ rank: 3 }),
                        expect.objectContaining({ rank: 4 }),
                        expect.objectContaining(fifth),
                        expect.objectContaining({ rank: 6 }),
                        expect.objectContaining({ rank: 7 }),
                    ]));
                });
            });
        });
    });
});

jest.setTimeout(1000*60);
