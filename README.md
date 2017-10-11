# Rec

Rec is a foundational library for implementing undo, redo, diffing, and event systems in JavaScript.

### Benefits:

* No dependencies.
* Extensively tested.
* Less than 100 lines long.

## Installation

```
npm install rec-js
```

## Usage

The entire library is in `rec.ts`.

### D

There are four types of deltas:

* `Insert` - Insert a value into an `Object` or `Array` at the given key.
* `Update` - Set a value in an `Object` or `Array` to a new value.
* `Delete` - Delete a value from an `Object` or `Array`. 
* `Compound` - A compound of the three earlier types of `D`.

### Apply

All deltas must be applied through the `Apply` function.

```
Apply(o : O, d : D) : O
```

An `O` is an `Object`. A `D` is a delta. `Apply` applies the `D` to the `O` argument.

`Apply` returns the same `O` after modification, for convenience. The object is modified by reference. It's not a new object.

```
let o = {}; // this could be any object - it doesn't have to be empty

let d = { type: INSERT, path : ["foo"], v : 12 };
o = Apply(o, d);
console.log(o); // prints { "foo" : 12 }
```

### Invert

The `Invert` function inverts any `D`. You can only invert a `D` after it has been applied. Continuing from the example above:

```
let dinverse = Invert(d);
o = Apply(o, dinverse);
console.log(o); // prints {}
```

## Building

```
npm run build
```

## Testing

Rec has been extensively tested by deterministic, random test generation. The test suite runs >10k unique tests.

To run the tests:

```
npm test
```