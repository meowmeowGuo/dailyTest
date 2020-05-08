function fun(array1,array2,item){
  switch (item){
    case array1.includes[item]:console.log('array1');break;
    case array2.includes[item]:console.log('array2');break;
    default:break;
  }
}

function fun2(item){
  switch (item){
    case item>5:console.log('array1');break;
    case item<5:console.log('array2');break;
    default:break;
  }
}

a=[1,2,3,4,5,6];
b=[7,8,9,10,11];
fun(a,b,5);
fun2(7);