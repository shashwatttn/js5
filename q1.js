/*

Filter unique array members using Set.

*/  

const arr = [1,2,2,3,3,4,4,5,5];

const unique = [...new Set(arr)];

// or 

const uniqueArr = arr.filter((value,index)=>{
    return arr.indexOf(value) === index;
});


// indexOf(value) returns the first occurrence
console.log(unique);
console.log(uniqueArr);
