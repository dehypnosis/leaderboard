/* wrap and type untyped external library for anti-corruption */
import redblack from "redblack";


export class RBTree<K, V> {
    private tree = redblack.tree();

    public get(key: K): V | null {
        return this.tree.get(key);
    }

    public insert(key: K, value: V): RBTree<K, V> {
        this.tree.insert(key, value);
        return this;
    }

    public delete(key: K): RBTree<K, V> {
        this.tree.delete(key);
        return this;
    }
}