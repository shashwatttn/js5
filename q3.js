// Write a program to implement inheritance upto 3 classes.
// The Class must contain private and public variables and static functions.

class Animal {
    #name;
    static count = 0;

    static totalAnimal() {
        return this.count;
    }

    constructor(name) {
        this.#name = name;
        Animal.count++;
    }

    get name() {
        return this.#name;
    }

    set name(value) {
        this.#name = value;
    }
}

class Mammal extends Animal {
    #walks;

    constructor(name, walks = true) {
        super(name);
        this.#walks = walks;
    }

    walksOnLand() {
        return this.#walks;
    }

    set walks(value) {
        this.#walks = value;
    }
}

class Rabbit extends Mammal {
    #jumps;

    constructor(name, walks, jumps = 2) {
        super(name, walks);
        this.#jumps = jumps;
    }

    get jumpsCount() {
        return this.#jumps;
    }
}


const r1 = new Rabbit("Bittu", true, 3);
const r2 = new Rabbit("Bunny", true, 2);

console.log(r1.name);           // Bunny
console.log(r1.walksOnLand());  // true
console.log(r1.jumpsCount);     // 3

console.log(Animal.totalAnimal()); // 2 
