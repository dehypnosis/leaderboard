import {PlayerLeaderBoard, PlayerTier} from "./leaderboard";
import {PlayerStoreEventType} from "../store";

const getPlayerFactory = () => {
    let id = 1;
    return () => {
        // for generating max 1M fake users with descending order of ranks
        const player = { id: id, mmr: 1000000 - id };
        id++;
        return player;
    };
};

/* unit tests here */
describe("leaderboard base manipulation", () => {
    /* initialize board */

    const board = new PlayerLeaderBoard();
    const generatePlayer = getPlayerFactory();

    it("can add node and count: count(), onPlayerAdd()", () => {
        const p1 = generatePlayer();
        board.onPlayerStoreEvent({
            type: PlayerStoreEventType.ADD,
            payload: p1,
        });
        expect(() => board.onPlayerAdd(p1)).toThrowError();
        board.onPlayerAdd(generatePlayer());
        board.onPlayerAdd(generatePlayer());
        board.onPlayerAdd(generatePlayer());
        board.onPlayerAdd(generatePlayer());
        expect(board.count()).toEqual(5);
    });

    it("can update node and count: count(), onPlayerUpdate()", () => {
        const count = board.count();
        expect(() => board.onPlayerUpdate(generatePlayer())).toThrowError();
        const p1 = generatePlayer();
        board.onPlayerAdd(p1);
        board.onPlayerStoreEvent({
            type: PlayerStoreEventType.UPDATE,
            payload: {...p1, mmr: 100},
        });
        expect(board.count()).toEqual(count + 1);
    });

    it("can delete node and count: count(), onPlayerAdd()", () => {
        const count = board.count();
        expect(() => board.onPlayerDelete(0)).toThrowError();
        const p1 = generatePlayer();
        board.onPlayerAdd(p1);
        board.onPlayerStoreEvent({
            type: PlayerStoreEventType.DELETE,
            payload: p1,
        });
        expect(board.count()).toEqual(count);
    });
});


describe("leaderboard", () => {
    /* initialize board */
    const board = new PlayerLeaderBoard();
    const N = 25000;

    it("should be cleared on INIT event: onPlayerStoreEvent(), clear()", () => {
        board.onPlayerAdd({ id: 1, mmr: 1 });

        // clear and fill new 25,000 users
        board.clear();
        expect(board.count()).toEqual(0);

        const generatePlayer = getPlayerFactory();
        board.onPlayerStoreEvent({
            type: PlayerStoreEventType.INIT,
            payload: new Array(N).fill(null).map(() => generatePlayer()),
        });
        console.log(`created ${N} fake users`);
    });

    it("can get user with proper rank including duplicate: find(), onPlayerAdd/Update/Delete()", () => {
        // CHALLENGER
        expect(board.find({ id: 1 })).toEqual(expect.objectContaining({ rank: 1, tier: PlayerTier["100#"] }));
        expect(board.find({ id: 100 })).toEqual(expect.objectContaining({ rank: 100, tier: PlayerTier["100#"] }));

        // MASTER
        expect(board.find({ id: 101 })).toEqual(expect.objectContaining({ rank: 101, tier: PlayerTier["1%"] }));
        expect(board.find({ id: 250 })).toEqual(expect.objectContaining({ rank: 250, tier: PlayerTier["1%"] }));

        // DIAMOND
        expect(board.find({ id: 251 })).toEqual(expect.objectContaining({ rank: 251, tier: PlayerTier["5%"] }));
        expect(board.find({ id: 1250 })).toEqual(expect.objectContaining({ rank: 1250, tier: PlayerTier["5%"] }));

        // PLATINUM
        expect(board.find({ id: 1251 })).toEqual(expect.objectContaining({ rank: 1251, tier: PlayerTier["10%"] }));
        expect(board.find({ id: 2500 })).toEqual(expect.objectContaining({ rank: 2500, tier: PlayerTier["10%"] }));

        // GOLD
        expect(board.find({ id: 2501 })).toEqual(expect.objectContaining({ rank: 2501, tier: PlayerTier["25%"] }));
        expect(board.find({ id: 6250 })).toEqual(expect.objectContaining({ rank: 6250, tier: PlayerTier["25%"] }));

        // SILVER
        expect(board.find({ id: 6251 })).toEqual(expect.objectContaining({ rank: 6251, tier: PlayerTier["65%"] }));
        expect(board.find({ id: 16250 })).toEqual(expect.objectContaining({ rank: 16250, tier: PlayerTier["65%"] }));

        // BRONZE
        expect(board.find({ id: 16251 })).toEqual(expect.objectContaining({ rank: 16251, tier: PlayerTier["100%"] }));
        expect(board.find({ id: 25000 })).toEqual(expect.objectContaining({ rank: 25000, tier: PlayerTier["100%"] }));

        // add a user with tied highest mmr
        expect(() => board.onPlayerAdd({ id: 25001, mmr: 1000000 - 1 })).not.toThrowError();
        expect([
            board.find({ id: 25001 }),
            board.find({ id: 1 }),
            board.find({ id: 100 }),
        ]).toEqual([
            expect.objectContaining({ rank: 1, tier: PlayerTier["100#"] }),
            expect.objectContaining({ id: 1, mmr: 999999, rank: 2, tier: PlayerTier["100#"] }),
            expect.objectContaining({ rank: 101, tier: PlayerTier["1%"] }),
        ]);

        // restore first user as highest mmr again
        expect(() => board.onPlayerUpdate({ id: 1, mmr: 1000000 })).not.toThrowError();
        expect(board.find({ id: 1 })).toEqual(expect.objectContaining({ rank: 1, tier: PlayerTier["100#"] }));
        expect(board.find({ id: 25001 })).toEqual(expect.objectContaining({ rank: 2, tier: PlayerTier["100#"] }));
        expect(board.find({ id: 100 })).toEqual(expect.objectContaining({ rank: 101, tier: PlayerTier["1%"] }));

        // delete created user
        expect(() => board.onPlayerDelete(25001)).not.toThrowError();
        expect(() => board.find({ id: 25001 })).toThrowError();
        expect(board.find({ id: 1 })).toEqual(expect.objectContaining({ rank: 1, tier: PlayerTier["100#"] }));
        expect(board.find({ id: 100 })).toEqual(expect.objectContaining({ rank: 100, tier: PlayerTier["100#"] }));
    });

    it("can fetch 'rank' strategy: get()", () => {
        // top edge case
        expect(board.get({ strategy: "rank", offset: 0, limit: 10 }))
            .toEqual([
                expect.objectContaining({ rank: 1, id: 1 }),
                expect.objectContaining({ rank: 2 }),
                expect.objectContaining({ rank: 3 }),
                expect.objectContaining({ rank: 4 }),
                expect.objectContaining({ rank: 5 }),
                expect.objectContaining({ rank: 6 }),
                expect.objectContaining({ rank: 7 }),
                expect.objectContaining({ rank: 8 }),
                expect.objectContaining({ rank: 9 }),
                expect.objectContaining({ rank: 10,  id: 10 }),
            ]);

        // regular case
        expect(board.get({ strategy: "rank", offset: 5, limit: 5 }))
            .toEqual([
                expect.objectContaining({ rank: 6 }),
                expect.objectContaining({ rank: 7 }),
                expect.objectContaining({ rank: 8, id: 8 }),
                expect.objectContaining({ rank: 9 }),
                expect.objectContaining({ rank: 10 }),
            ]);

        // bottom edge case
        expect(board.get({ strategy: "rank", offset: N-1, limit: 5 }))
            .toEqual([
                expect.objectContaining({ rank: N }),
            ]);
        expect(board.get({ strategy: "rank", offset: N, limit: 5 }))
            .toEqual([]);
    });

    it("can fetch 'around_player' strategy: get()", () => {
        // top edge case
        expect(board.get({ strategy: "around_player", range: 5, player_id: 1 }))
            .toEqual([
                expect.objectContaining({ rank: 1 }),
                expect.objectContaining({ rank: 2 }),
                expect.objectContaining({ rank: 3 }),
                expect.objectContaining({ rank: 4 }),
                expect.objectContaining({ rank: 5 }),
                expect.objectContaining({ rank: 6 }),
            ]);
        expect(board.get({ strategy: "around_player", range: 5, player_id: 3 }))
            .toEqual([
                expect.objectContaining({ rank: 1 }),
                expect.objectContaining({ rank: 2 }),
                expect.objectContaining({ rank: 3 }),
                expect.objectContaining({ rank: 4 }),
                expect.objectContaining({ rank: 5 }),
                expect.objectContaining({ rank: 6 }),
                expect.objectContaining({ rank: 7 }),
                expect.objectContaining({ rank: 8 }),
            ]);

        // regular case
        const M = Math.ceil(N/2);
        expect(board.get({ strategy: "around_player", range: 3, player_id: M }))
            .toEqual([
                expect.objectContaining({ rank: M-3 }),
                expect.objectContaining({ rank: M-2 }),
                expect.objectContaining({ rank: M-1 }),
                expect.objectContaining({ rank: M }),
                expect.objectContaining({ rank: M+1 }),
                expect.objectContaining({ rank: M+2 }),
                expect.objectContaining({ rank: M+3 }),
            ]);
        expect(board.get({ strategy: "around_player", range: 2, player_id: M }))
            .toEqual([
                expect.objectContaining({ rank: M-2 }),
                expect.objectContaining({ rank: M-1 }),
                expect.objectContaining({ rank: M }),
                expect.objectContaining({ rank: M+1 }),
                expect.objectContaining({ rank: M+2 }),
            ]);

        // bottom edge case
        expect(board.get({ strategy: "around_player", range: 5, player_id: N-2 }))
            .toEqual([
                expect.objectContaining({ rank: N-7 }),
                expect.objectContaining({ rank: N-6 }),
                expect.objectContaining({ rank: N-5 }),
                expect.objectContaining({ rank: N-4 }),
                expect.objectContaining({ rank: N-3 }),
                expect.objectContaining({ rank: N-2 }),
                expect.objectContaining({ rank: N-1 }),
                expect.objectContaining({ rank: N }),
            ]);
        expect(board.get({ strategy: "around_player", range: 5, player_id: N }))
            .toEqual([
                expect.objectContaining({ rank: N-5 }),
                expect.objectContaining({ rank: N-4 }),
                expect.objectContaining({ rank: N-3 }),
                expect.objectContaining({ rank: N-2 }),
                expect.objectContaining({ rank: N-1 }),
                expect.objectContaining({ rank: N }),
            ]);
    });
});
