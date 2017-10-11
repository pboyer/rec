export type O = { [key: string] : any };
export type A = any[];
export type V = O | A | string | number | boolean;
export type I = string | number;

export type UPDATE = 'UPDATE';
export const UPDATE : UPDATE = 'UPDATE';
export type Update = { type : UPDATE, path? : I[], v : V, old? : V };

export type INSERT = 'INSERT';
export const INSERT : INSERT = 'INSERT';
export type Insert = { type : INSERT, path? : I[], v : V, old? : V };

export type DELETE = 'DELETE';
export const DELETE : DELETE = 'DELETE';
export type Delete = { type : DELETE, path? : I[], old? : V };

export type COMPOUND = 'COMPOUND';
export const COMPOUND : COMPOUND = 'COMPOUND';
export type Compound = { type : COMPOUND, ds : D[] };

export type D = Update | Insert | Delete | Compound;

export function Apply(o : O, d : D) : O {
    switch (d.type) {
    case UPDATE: {
        let path = d.path, dest = o;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];
        d.old = dest[i];
        dest[i] = d.v;
        return o;
    }
    case INSERT: {
        let path = d.path, dest = o;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];

        if (dest instanceof Array) {
            dest.splice(i as number, 0, d.v);
        } else {
            d.old = dest[i]; // an object insert may overwrite the key
            dest[i] = d.v;
        }

        return o;
    }
    case DELETE: {
        let path = d.path, dest = o;
        for (let i = 0, l = path.length - 1; i < l; i++) {
            dest = dest[path[i]];
        }

        let i = path[path.length-1];
        d.old = dest[i];

        if (dest instanceof Array) {
            dest.splice(i as number, 1);
        } else {
            delete(dest[i]);
        }

        return o;
    }
    case COMPOUND: {
        for (let i = 0, l = d.ds.length; i < l; i++) Apply(o, d.ds[i])
        return d;
    } 
    }
}

export function Invert(d : D) : D {
    switch (d.type) {
        case UPDATE:
            return {
                type: UPDATE,
                path : d.path,
                v : d.old,
                old : d.v
            };
        case INSERT:
            // This field is non-null when the client tried to insert a value into 
            // an Object where the key was already defined.
            if (d.old !== undefined) {
                return {
                    type: UPDATE,
                    path: d.path,
                    v : d.old,
                    old : d.v
                }
            }

            return {
                type: DELETE,
                path : d.path,
                old : d.v
            };
        case DELETE:
            return {
                type: INSERT,
                path : d.path,
                v : d.old,
                old : null
            };
        case COMPOUND: {
            let ds = d.ds.map(Invert);
            ds.reverse();
            return {
                type: COMPOUND,
                ds: ds
            };
        }
    }
}