import {Player, PlayerStoreConsumer, PlayerStoreEvent, PlayerStoreEventType} from "../store";

export enum PlayerTier {
    "Top100" = "CHALLENGER", // top 100 players
    "Top1%" = "MASTER", // top 1% players
    "Top5%" = "DIAMOND", // top 5% players
    "Top10%" = "PLATINUM", // top 10% players
    "Top25%" = "GOLD", // top 25% players
    "Top65%" = "SILVER", // top 65% players
    "Top100%" = "BROZNE", // others
}

// extend interface
export interface PlayerWithRank extends Player {
    id: number;
    mmr: number;
    rank: number;
    tier: PlayerTier;
}

export class PlayerNode {
    public next: PlayerNode | null = null;

    constructor(public readonly data: Player, public prev: PlayerNode | null = null) {
    }

    public setPrev(node: PlayerNode | null) {
        this.prev = node;
    }

    public setNext(node: PlayerNode | null) {
        this.next = node;
    }
}

export class PlayerLeaderBoard {
    private head: PlayerNode|null = null;
    // private map: Map<number, PlayerNode> = new Map();

    public readonly consumer: PlayerStoreConsumer = (event: PlayerStoreEvent) => {
        switch (event.type) {
            case PlayerStoreEventType.ADD:
                break;
            case PlayerStoreEventType.UPDATE:
                break;
            case PlayerStoreEventType.DELETE:
                break;
        }
    };

    // TODO...
}