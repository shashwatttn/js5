export const uniqueArrayBuilder = (arr)=> arr.filter((value,index)=>{
    return arr.indexOf(value) === index;
}); 