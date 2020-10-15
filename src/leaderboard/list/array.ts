import { Player } from "../../store";
import { PlayerList } from "./list";
import { PlayerWithRank } from "../leaderboard";

// naive approach for PoC
export class PlayerArrayList implements PlayerList {
    private readonly players: Player[] = [];

    public get size(): number {
        return this.players.length;
    }

    public getByRank(from: number, to: number): ReadonlyArray<PlayerWithRank> {
        const result: PlayerWithRank[] = [];
        for (let i=from-1; i<to; i++) {
            const player = this.players[i];
            if (player) {
                result.push({ ...player, rank: i+1 });
            } else if (result.length) {
                break;
            }
        }
        return result;
    }

    public find(item: Player): PlayerWithRank | null {
        for (let i=0; i<this.players.length; i++) {
            const player = this.players[i];
            if (player.id === item.id) {
                return { ...player, rank: i+1 }
            }
        }
        return null;
    }

    public insert(item: Player): void {
        this.players.push(item);
        this.players.sort(PlayerList.compare);
    }

    public delete(item: Player): void {
        const index = this.players.findIndex(it => it.id === item.id);
        if (index === -1) {
            return;
        }
        this.players.splice(index, 1);
        this.players.sort(PlayerList.compare);
    }

    public clear(): void {
        this.players.splice(0, this.players.length);
    }
}
