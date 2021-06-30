const fs = require('fs');
const shell = require('shelljs');

const main = async () => {
  const newProductPath = 'products/new';
  const existProduct = 'products';
  const newJsonFiles = (await shell.exec(`ls ${newProductPath}`).stdout)
    .split('\n')
    .filter((x) => !!x)
    .filter((x) => x.includes('json'));

  const existJsonFiles = (await shell.exec(`ls ${existProduct}`).stdout)
    .split('\n')
    .filter((x) => !!x)
    .filter((x) => x.includes('json'));

  // 遍历 new json 
  // - 如果在 existJson 存在，则合并 json 存储到 existJson
  // - 如果不存在，则复制文件到 exist json 中
  for (let i = 0; i < newJsonFiles.length; i++) {
    const newJsonFile = newJsonFiles[i];
    if (existJsonFiles.includes(newJsonFile)) {
      const existJsonData = JSON.parse(await fs.readFileSync(`${newProductPath}/${newJsonFile}`, 'utf-8'))
      const newJsonData = JSON.parse(await fs.readFileSync(`${existProduct}/${newJsonFile}`, 'utf-8'))
      // format stringify by undefined, 2
      fs.writeFileSync(`${existProduct}/${newJsonFile}`, JSON.stringify(newJsonData.concat(existJsonData),undefined,2))

    } else {
      await shell.exec(`cp ${newProductPath}/${newJsonFile} ${existProduct}/${newJsonFile}`)
    }
  }

  await shell.exec(`rm -rf ${newProductPath}/*.json`)

};

main();
