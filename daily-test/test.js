function f1(str) {
  if (typeof str !== 'string') {
    console.error('传入参数必须是字符串');
    return;
  }
  const array = str.split('');
  let midArray = [];
  let resultArray = [];
  if (array.length) {
    array.forEach((i, k) => {
      if (!resultArray.includes(i)) {
        midArray.push(i);
      }
      if (midArray.length > resultArray.length) {
        resultArray = midArray;
      }
    });
  }
}

const a = ['abcabcbb', 'bbbbb', 'pwwkew'];
