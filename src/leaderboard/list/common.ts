import { PlayerList } from "./list";

const player = (x: number) => {
    return { id: x, mmr: x };
};

export function doCommonPlayerListTest(list: PlayerList) {
    describe(`Common test for ${list.constructor.name} implementation`, () => {
        it("insert/delete/clear/size", () => {
            for (let id=12; id<=29; id++) {
                list.insert(player(id));
            }
            for (let id=1; id<=10; id++) {
                list.insert(player(id));
            }
            list.insert(player(30));
            for (let id=100; id>30; id--) {
                list.insert(player(id));
            }
            list.insert(player(11));

            expect(list.size).toEqual(100);

            list.delete(player(10000)); // should ignore it!
            list.delete(player(100));

            expect(list.size).toEqual(99);

            list.clear();

            expect(list.size).toEqual(0);

            for (let id=1; id<=100; id++) {
               list.insert(player(id));
            }
        });

        it("rankOf/insert/delete", () => {
            expect(list.find(player(1))?.rank).toEqual(100);
            expect(list.find(player(50))?.rank).toEqual(51);
            expect(list.find(player(100))?.rank).toEqual(1);

            const dup100 = { id: 101, mmr: 100 };
            list.insert(dup100);
            expect(list.find(dup100)?.rank).toEqual(1);
            expect(list.find(player(100))?.rank).toEqual(2);
            expect(list.find(player(50))?.rank).toEqual(52);
            expect(list.find(player(1))?.rank).toEqual(101);

            expect(list.getByRank(1, 2)).toEqual([
                expect.objectContaining(dup100),
                expect.objectContaining(player(100)),
            ]);

            list.delete(dup100);
            expect(list.find(player(1))?.rank).toEqual(100);
            expect(list.find(player(50))?.rank).toEqual(51);
            expect(list.find(player(100))?.rank).toEqual(1);

            expect(list.getByRank(1, 2)).toEqual([
                expect.objectContaining(player(100)),
                expect.objectContaining(player(99)),
            ]);
        });

        it("getByRank", () => {
            const list1 = list.getByRank(1, 5);
            expect(list1.length).toEqual(5);
            expect(list1).toEqual([
                expect.objectContaining({ id: 100, rank: 1 }),
                expect.objectContaining({ id: 99, rank: 2 }),
                expect.objectContaining({ id: 98, rank: 3 }),
                expect.objectContaining({ id: 97, rank: 4 }),
                expect.objectContaining({ id: 96, rank: 5 }),
            ]);

            const list2 = list.getByRank(5, 8);
            expect(list2.length).toEqual(4);
            expect(list2).toEqual([
                expect.objectContaining({ id: 96, rank: 5 }),
                expect.objectContaining({ id: 95, rank: 6 }),
                expect.objectContaining({ id: 94, rank: 7 }),
                expect.objectContaining({ id: 93, rank: 8 }),
            ]);

            const list3 = list.getByRank(100, 200);
            expect(list3.length).toEqual(1);
            expect(list3).toEqual([
                expect.objectContaining({ id: 1, rank: 100 }),
            ]);

            const list4 = list.getByRank(101, 200);
            expect(list4.length).toEqual(0);

            const list5 = list.getByRank(100, 100);
            expect(list5.length).toEqual(1);
            expect(list5).toEqual([
                expect.objectContaining({ id: 1, rank: 100 }),
            ]);
        });
    });
}
