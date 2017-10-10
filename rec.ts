
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

export type D = Update | Insert | Delete;

export function Apply(o : O, d : D | D[]) : O {
    if (d instanceof Array){
        for (let id of d){
            Apply(o, id);
        }
        return o;
    }

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
        d.old = null;

        if (dest instanceof Array) {
            // todo check it's a number
            dest.splice(i as number, 1, d.v);
        } else {
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
    }
}

export function Invert(d : D[] | D) : D[] | D {
    if (d instanceof Array){
        let dn = d.map(Invert);
        dn.reverse();
        return dn as D[];
    }

    switch (d.type) {
        case UPDATE:
            return {
                type: UPDATE,
                path : d.path,
                v : d.old,
                old : d.v
            };
        case INSERT:
            return {
                type: DELETE,
                path : d.path,
                v : d.old,
                old : d.v
            };
        case DELETE: {
            return {
                type: INSERT,
                path : d.path,
                v : d.old,
                old : null
            };
        }
    }
}