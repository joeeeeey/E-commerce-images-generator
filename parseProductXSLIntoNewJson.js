// 解析多个平台的商品导出xls 文件，合并到 new/x.json 中
// 适用于
// - 老商品的 json 信息导出到这里
// - 审核驳回到商品信息纠正

// xml to json
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const shell = require('shelljs');
const { getNameCodeMapping, getTemplateListData, findExportedXLSFilePath, getPlatformProductMapping  } = require('./helpers/xls');
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
    asd = await getPlatformProductMapping('eleme')
    console.log('asd: ', asd);
}

main()