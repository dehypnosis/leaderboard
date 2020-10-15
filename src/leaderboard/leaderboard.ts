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
import { PlayerList, PlayerArrayList, PlayerBSTList } from "./list";

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
}

export interface PlayerWithRankAndTier extends PlayerWithRank {
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
    // private readonly list: PlayerList = new PlayerArrayList();
    private readonly list: PlayerList = new PlayerBSTList();

    /* data fetching */
    public count(): number {
        return this.list.size;
    }

    public get(args: PlayerLeaderBoardGetArgs): PlayerWithRankAndTier[] {
        if (args.strategy === "around_player") {
            const { player_id, range } = args as PlayerLeaderBoardGetArgsWithAroundPlayerStrategy;
            if (typeof player_id !== "number" || isNaN(player_id)) {
                throw new PlayerLeaderBoardGetPlayerIdError();
            }

            const player = this.map.get(player_id)!;
            const playerWithRank = player && this.list.find(player)!;
            if (!player || !playerWithRank) {
                throw new NotFoundPlayerError();
            }

            if (typeof range !== "number" || isNaN(range) || range < 0 || range > 50) {
                throw new PlayerLeaderBoardGetRangeError();
            }

            return this.list.getByRank(
                    Math.max(1, playerWithRank.rank - args.range),
                    playerWithRank.rank + args.range,
                )
                .map(this.setTier);

        } else if (args.strategy === "rank") {
            const { limit, offset } = args as PlayerLeaderBoardGetArgsWithRankStrategy;
            if (typeof limit !== "number" || isNaN(limit) || limit < 0 || limit > 100) {
                throw new PlayerLeaderBoardGetLimitError();
            }
            if (typeof offset !== "number" || isNaN(offset) || offset < 0) {
                throw new PlayerLeaderBoardGetOffsetError();
            }
            return this.list.getByRank(args.offset + 1, args.offset + args.limit)
                .map(this.setTier);
        }

        throw new PlayerLeaderBoardGetStrategyError();
    }

    public find(args: PlayerLeaderBoardFindArgs): PlayerWithRankAndTier {
        const player = this.map.get(args.id);
        const playerWithRank = player && this.list.find(player!)!
        if (!playerWithRank) {
            throw new NotFoundPlayerError();
        }
        return this.setTier(playerWithRank);
    }

    private setTier = (player: PlayerWithRank): PlayerWithRankAndTier => {
        this.assert(typeof player.rank === "number" && player.rank > 0, "player rank should be positive");
        const total = this.list.size;
        let tier = PlayerTier["100%"];
        const ratio = (player.rank / total) * 100;
        if (player.rank <= 100) {
            tier = PlayerTier["100#"];
        } else if (ratio <= 1) {
            tier = PlayerTier["1%"];
        } else if (ratio <= 5) {
            tier = PlayerTier["5%"];
        } else if (ratio <= 10) {
            tier = PlayerTier["10%"];
        } else if (ratio <= 25) {
            tier = PlayerTier["25%"];
        } else if (ratio <= 65) {
            tier = PlayerTier["65%"];
        }
        return { ...player, tier };
    }

    /* data manipulation */
    public onPlayerAdd(player: Player): void {
        this.assert(!this.map.has(player.id), "new player should not be registered to the list yet");
        this.list.insert(player);
        this.map.set(player.id, player);
    }

    public onPlayerUpdate(player: Player): void {
        const oldPlayer = this.map.get(player.id);
        this.assert(!!oldPlayer, "a player to update should be registered to the list already");
        this.list.delete(oldPlayer!);
        this.list.insert(player);
        this.map.set(player.id, player);
    }

    public onPlayerDelete(playerId: Player["id"]): void {
        const oldPlayer = this.map.get(playerId);
        this.assert(!!oldPlayer, "a player to delete should be registered to the list already");
        this.list.delete(oldPlayer!);
        this.map.delete(playerId);
    }

    public clear(): void {
        this.list.clear();
        this.map.clear();
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
