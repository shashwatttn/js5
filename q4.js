
// Write a program to implement a class having static functions

function Animal(name) {
    // "Private" variable (closure-based)
    var _name = name;

    // Public privileged methods (can access private data)
    this.getName = function () {
        return _name;
    };

    this.setName = function (value) {
        _name = value;
    };

    // Increment static count
    Animal.count++;
}

// Static property
Animal.count = 0;

// Static method
Animal.totalAnimals = function () {
    return Animal.count;
};

// Shared prototype method (public)
Animal.prototype.sayHello = function () {
    console.log("Hello, I am an animal");
};


function Mammal(name, walks) {
    // Call parent constructor
    Animal.call(this, name);

    // "Private" variable
    var _walks = walks !== undefined ? walks : true;

    this.walksOnLand = function () {
        return _walks;
    };

    this.setWalks = function (value) {
        _walks = value;
    };
}

// Prototype inheritance
Mammal.prototype = Object.create(Animal.prototype);
Mammal.prototype.constructor = Mammal;


function Rabbit(name, walks, jumps) {
    // Call parent constructor
    Mammal.call(this, name, walks);

    // "Private" variable
    var _jumps = jumps !== undefined ? jumps : 2;

    this.getJumps = function () {
        return _jumps;
    };
}

// Prototype inheritance
Rabbit.prototype = Object.create(Mammal.prototype);
Rabbit.prototype.constructor = Rabbit;

var r1 = new Rabbit("Bunny", true, 3);
var r2 = new Rabbit("Bittu", true, 2);

console.log(r1.getName());        // Bunny
console.log(r1.walksOnLand());    // true
console.log(r1.getJumps());       // 3

console.log(Animal.totalAnimals()); // 2 
