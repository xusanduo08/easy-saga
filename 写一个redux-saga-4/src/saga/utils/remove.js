
export default function remove(arr, item){
  let index = arr.indexOf(item);
  if(index >= 0){
    arr.splice(index, 1);
  }
  
  return arr
}