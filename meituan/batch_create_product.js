
// xml to json
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const shell = require('shelljs');
const { categoryIDMapping } = require('./constants');
const json2xls = require('json2xls');

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

  const files = ['new.json']
  // const files = (await shell.exec(`ls ../products/`).stdout)
  //   .split('\n')
  //   .filter((x) => !!x);

  await files.forEach(async (file) => {
    if (file.includes('json')) {
      const productData = JSON.parse(
        await fs.readFileSync(`../products/${file}`, 'utf8')
      );
      data = data.concat(productData);
    }
  });

  data.forEach((x) => {
    x['商品类目id'] = categoryIDMapping[x['美团类别']];
  });

  return data;
};

// 获取美团格式化的 xls 文件
const getTemplateListData = (options = {}) => {
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
          sourceFile: './自行创建商品表格-20201207.xls',
          ...options,
        })['商品录入']
      );

      return data;
    },
  };
};

const templateList = getTemplateListData();

const getTemplateKeys = () => {
  return Object.values(templateList.value()[0]);
};

const templateListWithKey = getTemplateListData({
  columnToKey: templateList.value()[0]
});

const appendDataAfterTempalte = async () => {
  // appendData => [{'商品类目id': 'xxx'}]
  const formattedData = templateListWithKey.value();
  formattedData.shift(); // 第一行是 field 信息
  const toBeAppendData = await getAllProductData();
  const keys = getTemplateKeys();
  toBeAppendData.forEach((x) => {
    formattedData.push(pickObjByKeys(x, keys, false));
  });

  console.log('formattedData: ',formattedData);
  return formattedData;
};

// console.log('getTemplateKeys: ', getTemplateKeys());
const main = async () => {
  const jsonArr = await appendDataAfterTempalte();

  const xls = json2xls(jsonArr);

  //  需要用 number 打开后导出为 xls
  fs.writeFileSync('../tmp/metuan_result.xls', xls, 'binary');
};

main();
