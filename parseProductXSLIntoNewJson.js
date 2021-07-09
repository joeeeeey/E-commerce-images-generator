// 解析多个平台的商品导出xls 文件，合并到 new/x.json 中
// 适用于
// - 老商品的 json 信息导出到这里
// - 审核驳回到商品信息纠正

// xml to json
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const shell = require('shelljs');
const { findExportedXLSFilePath, getNameCodeMapping } = require('./helpers/xls');
// const json2xls = require('json2xls');

// 辅助方法
const pickObjByKeys = (obj, keys, ingoreNull = true) => {
  const newObj = {};
  keys.map((key) => {
    if (ingoreNull) {
      if (obj[key] || typeof obj[key] === 'boolean') {
        newObj[key] = obj[key];
      }
    } else {
      newObj[key] = obj[key];
    }
    return true;
  });

  return JSON.parse(JSON.stringify(newObj));
};

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

const findExportedXLSInDownloads = async () => {
  const path = '~/Downloads';
  const xlsFiles = (await shell.exec(`ls ${path}`).stdout)
    .split('\n')
    .filter((x) => x.includes('门店导出商品'));
  return `${path}/${xlsFiles[0]}`;
};

const getTemplateListData = (filePath, options = {}) => {
  let data = null;
  const setValue = (val) => {
    data = val;
  };
  return {
    value: () => {
      if (data) {
        return data;
      }
      setValue(
        excelToJson({
          sourceFile: filePath,
          ...options,
        })
      );

      return data;
    },
  };
};

// const templateList = getTemplateListData();

const getTemplateKeys = () => {
  return Object.values(templateList.value()[0]);
};

// const templateListWithKey = getTemplateListData({
//   columnToKey: templateList.value()[0]
// });

const appendDataAfterTempalte = async () => {
  // appendData => [{'商品类目id': 'xxx'}]
  const formattedData = templateListWithKey.value();
  formattedData.shift(); // 第一行是 field 信息
  formattedData.pop(); // 第二行是 stub 信息
  const toBeAppendData = await getAllProductData();
  const keys = getTemplateKeys();
  toBeAppendData.forEach((x) => {
    formattedData.push(pickObjByKeys(x, keys, false));
  });

  console.log('formattedData: ', formattedData);
  // console.log('formattedData: ',formattedData);
  return formattedData;
};

// const getNameCodeMapping = async () => {
//   const XSLFilePath = await findExportedXLSFilePath('eleme');
//   await shell.exec(
//     `cp ${XSLFilePath.replace(/(\s+)/g, '\\$1')} ./tmp/ele_exported.xlsx`
//   );

//   const res = getTemplateListData('./tmp/ele_exported.xlsx').value()[
//     '任务结果'
//   ];

//   const nameCodeMapping = {};
//   res.forEach((x) => {
//     nameCodeMapping[x['D']] = x['C'];
//   });

//   return nameCodeMapping;
// };

// module.exports = {
//   getNameCodeMapping: getNameCodeMapping,
// };

getNameCodeMapping('eleme');
