

// xml to json
const excelToJson = require('convert-excel-to-json');
const fs = require('fs');
const shell = require('shelljs');
// const { categoryIDMapping } = require('./constants');
const json2xls = require('json2xls');


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
          sourceFile: './批量新增商品模板.xlsx',
          ...options,
        })['新增商品']
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
  const keys = getTemplateKeys();

  // console.log('formattedData: ',formattedData);
  await fs.writeFileSync('./constants.js', JSON.stringify(formattedData))
  return formattedData;
};

console.log('templateListWithKey: ', appendDataAfterTempalte());
