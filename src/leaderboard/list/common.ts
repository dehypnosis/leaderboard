import { PlayerList } from "./list";

const generatePlayer = (x: number) => {
    return { id: x, mmr: x };
};

export function doCommonPlayerListTest(list: PlayerList) {
    describe(`Common test for ${list.constructor.name} implementation`, () => {
        it("insert/delete/clear/size", () => {
            for (let id=1; id<=100; id++) {
               list.insert(generatePlayer(id));
            }

            expect(list.size).toEqual(100);

            list.delete(10000); // should ignore it!
            list.delete(100);

            expect(list.size).toEqual(99);

            list.clear();

            expect(list.size).toEqual(0);

            for (let id=1; id<=100; id++) {
               list.insert(generatePlayer(id));
            }
        });

        it("rankOf/insert/delete", () => {
            expect(list.rankOf(1)).toEqual(100);
            expect(list.rankOf(50)).toEqual(51);
            expect(list.rankOf(100)).toEqual(1);

            list.insert({ id: 101, mmr: 100 });
            expect(list.rankOf(101)).toEqual(1);
            expect(list.rankOf(100)).toEqual(2);
            expect(list.rankOf(50)).toEqual(52);
            expect(list.rankOf(1)).toEqual(101);

            list.delete(101);
            expect(list.rankOf(1)).toEqual(100);
            expect(list.rankOf(50)).toEqual(51);
            expect(list.rankOf(100)).toEqual(1);
        });

        it("getByRank", () => {
            const list1 = list.getByRank(1, 5);
            expect(list1.length).toEqual(5);
            expect(list1).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 100 }),
                expect.objectContaining({ id: 99 }),
                expect.objectContaining({ id: 98 }),
                expect.objectContaining({ id: 97 }),
                expect.objectContaining({ id: 96 }),
            ]));

            const list2 = list.getByRank(5, 8);
            expect(list2.length).toEqual(4);
            expect(list2).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 96 }),
                expect.objectContaining({ id: 95 }),
                expect.objectContaining({ id: 94 }),
                expect.objectContaining({ id: 93 }),
            ]));

            const list3 = list.getByRank(100, 200);
            expect(list3.length).toEqual(1);
            expect(list3).toEqual(expect.arrayContaining([
                expect.objectContaining({ id: 1 }),
            ]));

            const list4 = list.getByRank(101, 200);
            expect(list4.length).toEqual(0);

            const list5 = list.getByRank(100, 100);
            expect(list5.length).toEqual(1);
        });
    });
}
