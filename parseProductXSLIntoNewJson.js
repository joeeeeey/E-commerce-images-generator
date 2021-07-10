// 解析多个平台的商品导出xls 文件，合并到 new/x.json 中
// 适用于
// - 老商品的 json 信息导出到这里
// - 审核驳回到商品信息纠正

// xml to json
const fs = require('fs');
const shell = require('shelljs');
const { getPlatformProductMapping  } = require('./helpers/xls');
const { getJsonFileArrayData } = require('./helpers/sourceFile');
const { categoryIDMapping } = require('./meituan/constants');
// const json2xls = require('json2xls');

// 从 product 目录下获取所有需要上传的东西
const getAllProductData = async () => {
  let data = [];

  // const files = ['new.json']
  const files = (await shell.exec(`ls ../products/new`).stdout)
    .split('\n')
    .filter((x) => !!x);

  await files.forEach(async (file) => {
    if (file.includes('json')) {
      const productData = JSON.parse(
        await fs.readFileSync(`../products/new/${file}`, 'utf8')
      );
      data = data.concat(productData);
    }
  });

  // mapping 过去
  data.forEach((x) => {
    x['商品名称'] = x['商品标题*'].replace(/\-/g, '_'); // '-' 为饿了么图片保留符号
    x['商品三级类目'] = x['饿了么类别'];
    x['重量'] = x['重量*'];
    x['售价'] = x['价格（元）*'];
    x['库存'] = x['库存*'];
    x['商品状态'] = '上架';
    x['店铺内一级分类名称'] = x['店内一级分类*'];
    x['店铺内二级分类名称'] = x['店内二级分类'];
  });

  // data.forEach((x) => {
  //   x['商品类目id'] = categoryIDMapping[x['美团类别']];
  // });

  return data;
};


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

main()