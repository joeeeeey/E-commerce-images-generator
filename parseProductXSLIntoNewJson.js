// 解析多个平台的商品导出xls 文件，合并到 new/x.json 中
// 适用于
// - 老商品的 json 信息导出到这里
// - 审核驳回到商品信息纠正

// xml to json
const fs = require('fs');
const shell = require('shelljs');
const { getPlatformProductMapping  } = require('./helpers/xls');
const { getJsonFileArrayData } = require('./helpers/sourceFile');
const { newProducts } = require('./helpers/constants');
const { categoryIDMapping } = require('./meituan/constants');

const main = async () => {
    const newProductPath = 'products/new';
    const newProductsData = await getJsonFileArrayData(newProductPath) // {fileA: [], fileB: []}
    const exportedELEMapping = await getPlatformProductMapping('eleme')
    const exportedMeituanMapping = await getPlatformProductMapping('meituan')
    // console.log('exportedMeituanMapping: ', JSON.stringify(Object.keys(exportedMeituanMapping)));

    const files = Object.keys(newProductsData)
    for (let j = 0; j < files.length; j++) {
      const file = files[j];
      const arrayData = newProductsData[file]
      arrayData.forEach(x => {
        const name = x['商品标题*']
        console.log('name: ', name);
        // console.log('exportedELEMapping: ', JSON.stringify(Object.keys(exportedELEMapping)));
        const elePro = exportedELEMapping[name]
        const meituanPro = exportedMeituanMapping[name]
        x['饿了么类别'] = elePro['商品三级类目']
        const meituanCategory = Object.keys(categoryIDMapping).filter(x => x.includes(meituanPro['商品类目名称']))[0]
        console.log('meituanCategory: ', meituanCategory);
        if (meituanCategory) {
          x['美团类别'] = meituanCategory
        }
  
        x['重量*'] = meituanPro['重量']
        x['价格（元）*'] = meituanPro['价格（元）']
        x['库存*'] = meituanPro['库存']
      })

      await fs.writeFileSync(`${newProductPath}/${file}`, JSON.stringify(arrayData,undefined,2))
    }
}

const getEleProductsIdMapping = async () => {
  const exportedELEMapping = await getPlatformProductMapping('eleme')
  // console.log('exportedELEMapping: ', exportedELEMapping);
  const mapping = {}
  newProducts.forEach(x => {
    const p = exportedELEMapping[x]
    // console.log('p: ', p['商品ID']);
    mapping[x] =  p['商品ID']
  })
  console.log('mapping: ', mapping);
  return mapping
}

getEleProductsIdMapping()