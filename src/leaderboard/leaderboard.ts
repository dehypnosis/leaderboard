import { Player, PlayerStoreConsumer, PlayerStoreEvent, PlayerStoreEventType } from "../store";
import {
    NotFoundPlayerError,
    InternalError,
    PlayerLeaderBoardGetPlayerIdError,
    PlayerLeaderBoardGetLimitError,
    PlayerLeaderBoardGetOffsetError,
    PlayerLeaderBoardGetRangeError,
    PlayerLeaderBoardGetStrategyError
} from "../error";

export enum PlayerTier {
    "100#" = "CHALLENGER", // top 100 players
    "1%" = "MASTER", // top 1% players
    "5%" = "DIAMOND", // top 5% players
    "10%" = "PLATINUM", // top 10% players
    "25%" = "GOLD", // top 25% players
    "65%" = "SILVER", // top 65% players
    "100%" = "BROZNE", // others
}

// extend interface
export interface PlayerWithRank extends Player {
    id: number;
    mmr: number;
    rank: number;
    tier: PlayerTier;
}

type PlayerLeaderBoardGetArgsWithRankStrategy = {
    strategy: "rank";
    offset: number;
    limit: number;
};
type PlayerLeaderBoardGetArgsWithAroundPlayerStrategy = {
    strategy: "around_player";
    player_id: number;
    range: number;
};
export type PlayerLeaderBoardGetArgs = PlayerLeaderBoardGetArgsWithRankStrategy | PlayerLeaderBoardGetArgsWithAroundPlayerStrategy;

export type PlayerLeaderBoardFindArgs = {
    id: Player["id"];
};

export class PlayerLeaderBoard implements PlayerStoreConsumer {
    private readonly map = new Map<Player["id"], Player>();
    private readonly tree = new Array<Player>();

    /* data fetching */
    public count(): number {
        return this.tree.length;
    }

    public get(args: PlayerLeaderBoardGetArgs): PlayerWithRank[] {
        if (args.strategy === "around_player") {
            const { player_id, range } = args as PlayerLeaderBoardGetArgsWithAroundPlayerStrategy;
            if (typeof player_id !== "number" || isNaN(player_id)) {
                throw new PlayerLeaderBoardGetPlayerIdError();
            }

            const player = this.map.get(player_id)!;
            if (!player) {
                throw new NotFoundPlayerError();
            }
            const index = this.tree.indexOf(player);
            this.assert(index !== -1, "player should exist");

            if (typeof range !== "number" || isNaN(range) || range < 0 || range > 50) {
                throw new PlayerLeaderBoardGetRangeError();
            }

            return this.tree
                .slice(
                    Math.max(0, index - args.range),
                    index + args.range + 1,
                )
                .map(p => this.mapPlayerWithRank(p));

        } else if (args.strategy === "rank") {
            const { limit, offset } = args as PlayerLeaderBoardGetArgsWithRankStrategy;
            if (typeof limit !== "number" || isNaN(limit) || limit < 0 || limit > 100) {
                throw new PlayerLeaderBoardGetLimitError();
            }
            if (typeof offset !== "number" || isNaN(offset) || offset < 0) {
                throw new PlayerLeaderBoardGetOffsetError();
            }
            return this.tree
                .slice(args.offset, args.offset + args.limit)
                .map(p => this.mapPlayerWithRank(p));
        }

        throw new PlayerLeaderBoardGetStrategyError();
    }

    public find(args: PlayerLeaderBoardFindArgs): PlayerWithRank {
        const player = this.map.get(args.id);
        if (!player) {
            throw new NotFoundPlayerError();
        }
        return this.mapPlayerWithRank(player);
    }

    private mapPlayerWithRank(player: Player): PlayerWithRank {
        const index = this.tree.indexOf(player);
        this.assert(index !== -1, "player should exist");
        const rank = index + 1;
        return {
            ...player,
            rank,
            tier: this.rankToTier(rank),
        };
    }

    private rankToTier(rank: number): PlayerTier {
        const total = this.tree.length;
        const ratio = (rank / total) * 100;
        if (rank <= 100) {
            return PlayerTier["100#"];
        } else if (ratio <= 1) {
            return PlayerTier["1%"];
        } else if (ratio <= 5) {
            return PlayerTier["5%"];
        } else if (ratio <= 10) {
            return PlayerTier["10%"];
        } else if (ratio <= 25) {
            return PlayerTier["25%"];
        } else if (ratio <= 65) {
            return PlayerTier["65%"];
        } else {
            return PlayerTier["100%"];
        }
    }

    /* data manipulation */
    public onPlayerAdd(player: Player): void {
        this.assert(!this.map.has(player.id), "new player should not be registered to the tree yet");
        this.map.set(player.id, player);
        this.tree.push(player);
        this.sort();
    }

    public onPlayerUpdate(player: Player): void {
        const oldPlayer = this.map.get(player.id);
        this.assert(!!oldPlayer, "a player to update should be registered to the tree already");
        this.map.set(player.id, player);
        this.tree.splice(this.tree.indexOf(oldPlayer!), 1, player);
        this.sort();
    }

    public onPlayerDelete(playerId: Player["id"]): void {
        const oldPlayer = this.map.get(playerId);
        this.assert(!!oldPlayer, "a player to delete should be registered to the tree already");
        this.map.delete(playerId);
        this.tree.splice(this.tree.indexOf(oldPlayer!), 1);
        this.sort();
    }

    public clear(): void {
        this.map.clear();
        this.tree.splice(0, this.tree.length);
    }

    private sort(): void {
        this.tree.sort((a, b) => {
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
        });
    }

    private assert(statement: boolean, message: string = "unexpected"): void {
        if (!statement) {
            throw new InternalError("assertion failed: " + message);
        }
    }

    /* handle store update */
    public readonly onPlayerStoreEvent = (event: PlayerStoreEvent) => {
        switch (event.type) {
            case PlayerStoreEventType.INIT:
                this.clear();
                for (const player of event.payload) {
                    this.onPlayerAdd(player);
                }
                break;
            case PlayerStoreEventType.ADD:
                this.onPlayerAdd(event.payload);
                break;
            case PlayerStoreEventType.UPDATE:
                this.onPlayerUpdate(event.payload);
                break;
            case PlayerStoreEventType.DELETE:
                this.onPlayerDelete(event.payload.id);
                break;
        }
    }
}