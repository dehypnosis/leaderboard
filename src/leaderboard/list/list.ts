import { Player } from "../../store";

export abstract class PlayerList {
    public static compare(a: Player, b: Player) {
        if (a.mmr > b.mmr) {
            return -1;
        } else if (a.mmr < b.mmr) {
            return 1;
        } else if (a.id > b.id) {
            return -1;
        } else if (a.id < b.id) {
            return 1;
        } else {
            return 0;
        }
    }

    public abstract get size(): number;
    public abstract getByRank(from: number, to: number): ReadonlyArray<Player>; // should fetch [from, to], from/to are both positive integer
    public abstract rankOf(id: Player["id"]): number; // can ignore missing one (just do not return positive integer)
    public abstract insert(item: Player): void; // can ignore inserting duplicate one case
    public abstract delete(id: Player["id"]): void; // can ignore deleting missing one case
    public abstract clear(): void;
}
