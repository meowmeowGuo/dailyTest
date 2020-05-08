let a = 1;
const array = [1, 2, 3, 4, 5];

function do1(p, index = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      a = a + 1;
      console.log(index, ':', a);
      resolve(index);
    }, (5 - index) * 1000);
  });
}

async function test1() {
  for (let i = 0; i < 5; i++) {
    await do1(a, i);
  }
}

test1();

async function test2(array) {
  array.forEach(async (i, k) => await do1(i, k));
  console.log('done');
}

// test2(array);

/*

function do2(index) {
  console.log('index', index);
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(index, Date.now());
    });
  });
}

async function test1() {
  for (let i = 0; i < 5; i++) {
    await do2(i);
  }
}
*/

