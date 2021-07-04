const fs = require('fs');
const { SocketAddress } = require('net');
const shell = require('shelljs');

const getAllProductData = async () => {
  let data = [];

  // const files = ['new.json']
  const files = (await shell.exec(`ls ./products/new|grep json`).stdout)
    .split('\n')
    .filter((x) => !!x);

  await files.forEach(async (file) => {
    if (file.includes('json')) {
      const productData = JSON.parse(
        await fs.readFileSync(`./products/new/${file}`, 'utf8')
      );
      data = data.concat(productData);
    }
  });

  return data;
};

const main = async () => {
  const asd = await getAllProductData()
  console.log('asd: ', asd);
  asd.forEach(x => {
    const name = x['商品标题*']
    const cost = x['成本']
    const price = x['价格（元）*']
    console.log(`${name}: ${price} - ${cost}`);
  })
}

main()