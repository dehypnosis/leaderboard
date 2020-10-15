import { PlayerList } from "./list";
import { Player } from "../../store";
import { PlayerWithRank } from "../leaderboard";

export class PlayerBSTList implements PlayerList {
    private root?: PlayerNode;

    private setRoot(node: PlayerNode): void {
        this.unsetRoot();
        this.root = node;
        delete node.parent;
    }

    private unsetRoot(): void {
        if (this.root) {
            delete this.root;
        }
    }

    public clear(): void {
        this.unsetRoot();
    }

    public get size(): number {
        return this.root ? this.root.size : 0;
    }

    // TODO: enhance here to make self-balanced tree
    public insert(item: Player): void {
        let current = this.root;
        if (!current) {
            this.setRoot(new PlayerNode(item));
            return
        }

        while (true) {
            const comparison = PlayerList.compare(item, current.item);
            if (comparison === 1) {
                if (current.left) {
                    current = current.left;
                } else {
                    current.setLeft(new PlayerNode(item));
                    break;
                }
            } else if (comparison === -1) {
                if (current.right) {
                    current = current.right;
                } else {
                    current.setRight(new PlayerNode(item));
                    break;
                }
            } else {
                console.error("cannot process equal items", { a: item, b: current.item });
                return;
            }
        }
    }

    // TODO: enhance here to make self-balanced tree
    public delete(item: Player): void {
        const current = this.findNode(item);
        if (!current) {
            return;
        }

        if (current.left && current.right) { // two branch
            // append left branch to leftest node of right branch
            let leftestNodeOfRight = current.right;
            while(leftestNodeOfRight.left) {
                leftestNodeOfRight = leftestNodeOfRight.left;
            }
            leftestNodeOfRight.setLeft(current.left);

            // append right branch to tree
            if (!current.parent) {
                this.setRoot(current.right);
            } else if (current.parent.left === current) {
                current.parent.setLeft(current.right);
            } else {
                current.parent.setRight(current.right);
            }

        } else if (current.left || current.right) { // single branch
            const leftOrRight = (current.left || current.right)!;
            if (!current.parent) {
                this.setRoot(leftOrRight);
            } else if (current.parent.left === current) {
                current.parent.setLeft(leftOrRight);
            } else {
                current.parent.setRight(leftOrRight);
            }

        } else { // no children
            if (!current.parent) { // root
                this.unsetRoot();
            } else {
                current.unsetParent();
            }
        }
    }

    public getByRank(start: number, end: number): ReadonlyArray<PlayerWithRank> {
        const limit = end - start + 1;
        if (!this.root || limit <= 0) {
            return [];
        }

        const items: PlayerWithRank[] = [];
        const queue: PlayerNode[] = [this.root!];
        while (queue.length) {
            const current = queue.shift()!;
            const rank = current.getRank();
            if (rank >= start && rank <= end) {
                items.push({ ...current.item, rank });
            }

            if (current.left && (start >= rank || rank <= end)) {
                queue.push(current.left);
            }
            if (current.right && (start <= rank || rank >= end)) {
                queue.push(current.right);
            }
        }
        return items.sort((a,b) => a.rank - b.rank);
    }

    public find(item: Player): PlayerWithRank | null {
        let current = this.findNode(item);
        if (!current) {
            return null;
        }
        return {
            ...current.item,
            rank: current.getRank(),
        };
    }

    private findNode(item: Player): PlayerNode | undefined {
        let current = this.root;
        while (true) {
            if (!current) {
                return;
            }

            const comparison = PlayerList.compare(item, current.item);
            if (comparison === 1) {
                current = current.left;
            } else if (comparison === -1) {
                current = current.right;
            } else {
                return current;
            }
        }
    }
}

class PlayerNode {
    public left?: PlayerNode;
    public right?: PlayerNode;
    public parent?: PlayerNode;
    public size: number = 1;

    constructor (public readonly item: Player) {
    }

    public unsetParent(): void {
        const p = this.parent;
        if (p) {
            if (p.left === this) {
                delete p.left;
            } else if (p.right === this) {
                delete p.right;
            } else {
                throw new Error("invalid connection");
            }
            delete this.parent;
            p.updateSize();
        }
    }

    public setLeft(node: PlayerNode): void {
        node.unsetParent();
        this.left = node;
        node.parent = this;
        this.updateSize();
    }

    public setRight(node: PlayerNode): void {
        node.unsetParent();
        this.right = node;
        node.parent = this;
        this.updateSize();
    }

    private updateSize() {
        let current = this as PlayerNode;
        while (current) {
            current.size = (current.left ? current.left.size : 0) + (current.right ? current.right.size : 0) + 1;
            current = current.parent!;
        }
    }

    public getRank() {
        // add all the right parts' size
        let rank = 1;
        let current: PlayerNode = this;
        if (current.right) {
            rank += current.right.size;
        }
        while (current.parent) {
            if (current === current.parent.left) {
                rank += 1;
                if (current.parent.right) {
                    rank += current.parent.right.size
                }
            }
            current = current.parent!;
        }
        return rank;
    }
}
