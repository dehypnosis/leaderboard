// @ts-ignore
import redblack from "redblack";
import { PlayerList } from "./list";
import { Player } from "../../store";

export class PlayerRedBlackTreeList implements PlayerList {
    public clear(): void {
    }

    public delete(id: Player["id"]): void {
    }

    public getByRank(start: number, end: number): ReadonlyArray<Player> {
        return [];
    }

    public rankOf(id: Player["id"]): number {
        return 0;
    }

    public insert(item: Player): void {
    }

    public get size(): number {
        return 0;
    }
}
