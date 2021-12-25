// 将 product/new/*.json 的文件合并到 products/*.json 中
const fs = require('fs');
const shell = require('shelljs');
const { storeNewJsonFileAtLocal } = require('./helpers/index')

const newProductPath = 'products/new';
const existProduct = 'products';


const findDuplicatedProduct = (data) => {
  // data => [{},{}]
  const keys = data.map(x => x['商品标题*']);
  const keyCountMapping = {}
  keys.forEach(key => {
    if (keyCountMapping[key]) {
      keyCountMapping[key] += 1
    } else {
      keyCountMapping[key] = 1
    }
  });
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (keyCountMapping[key]>1) {
      // 说明重复
      console.error(`Product name "${key}" is duplicated`)
      return true
    }
  }
  return false
}

const findTODOProducts = async (newJsonFiles, existJsonFiles) => {
  for (let i = 0; i < newJsonFiles.length; i++) {
    const newJsonFile = newJsonFiles[i];
    const newJsonData = JSON.parse(await fs.readFileSync(`${newProductPath}/${newJsonFile}`, 'utf-8'))
    if (JSON.stringify(newJsonData).includes('TODO')) {
      console.error(`New json ${newJsonFile}: Has TODO!!!`);
      return false
    }

    if (existJsonFiles.includes(newJsonFile)) {
      const existJsonData = JSON.parse(await fs.readFileSync(`${existProduct}/${newJsonFile}`, 'utf-8'))
      const mergedData = newJsonData.concat(existJsonData)
      if (findDuplicatedProduct(mergedData)) {
        console.error(`Exist json ${newJsonFile}: Has Duplicated product name!!`);
        return false;
      }
    }
  }

  // if (existJsonFiles.includes(newJsonFile)) {
// const newJsonData = JSON.parse(await fs.readFileSync(`${existProduct}/${newJsonFile}`, 'utf-8'))
  return true
}

const main = async () => {
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

  const canMerge = await findTODOProducts(newJsonFiles, existJsonFiles)
  if (!canMerge) {
    return
  }
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

  await storeNewJsonFileAtLocal()

  await shell.exec(`rm -rf ${newProductPath}/*.json`)

};

main();
