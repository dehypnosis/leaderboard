import { Player } from "../../store";
import { PlayerList } from "./list";

// naive approach for PoC
export class PlayerArrayList implements PlayerList {
    private readonly array: Player[] = [];

    public get size(): number {
        return this.array.length;
    }

    public getByRank(from: number, to: number): ReadonlyArray<Player> {
        return this.array.slice(from-1, to);
    }

    public rankOf(id: Player["id"]): number {
        return this.array.findIndex(it => it.id === id) + 1;
    }

    public insert(item: Player): void {
        this.array.push(item);
        this.array.sort(PlayerList.compare);
    }

    public delete(id: Player["id"]): void {
        const index = this.array.findIndex(it => it.id === id);
        if (index === -1) {
            return;
        }
        this.array.splice(index, 1);
        this.array.sort(PlayerList.compare);
    }

    public clear(): void {
        this.array.splice(0, this.array.length);
    }
}
