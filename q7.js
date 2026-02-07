const arr = [1, [2, [3, 4], 5], [6, 7], 8];


// 1st way
const flattenUsingFlat = (array) => {
    return array.flat(Infinity);
};

console.log(flattenUsingFlat(arr));


// 2nd way

const flattenWithoutFlat = (array) => {
    let result = [];

    array.forEach(item => {
        if (Array.isArray(item)) {
            result = result.concat(flattenWithoutFlat(item));
        } else {
            result.push(item);
        }
    });

    return result;
};

// Example
// console.log(flattenWithoutFlat(arr));
