const shell = require('shelljs');
const excelToJson = require('convert-excel-to-json');

const platforms = { ELE: 'eleme', MEITUAN: 'meituan' };

const isValidPlatform = (platform) => {
  // const platforms = ['eleme', 'meituan'];
  if (!Object.values(platforms).includes(platform)) {
    console.error(`platform: ${platform} is not existed in current platforms!`);
    return false;
  }
  return true;
};

const findExportedXLSFilePath = async (platform) => {
  if (!isValidPlatform(platform)) {
    return;
  }
  const path = `./${platform}`;

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

const getNameCodeMapping = async (platform) => {
  if (!isValidPlatform(platform)) {
    return;
  }

  const XSLFilePath = await findExportedXLSFilePath(platform);
  await shell.exec(
    `cp ${XSLFilePath.replace(
      /(\s+)/g,
      '\\$1'
    )} ./tmp/${platform}_exported.xlsx`
  );

  let nameCodeMapping = {};

  if (platform === platforms.ELE) {
    const res = getTemplateListData(`./tmp/${platform}_exported.xlsx`).value()[
      '任务结果'
    ];
  
    res.forEach((x) => {
      nameCodeMapping[x['D']] = x['C'];
    });
  }

  return nameCodeMapping;
};

module.exports = {
  getNameCodeMapping,
  getTemplateListData,
  findExportedXLSFilePath,
};
