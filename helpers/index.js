const shell = require('shelljs');
const request = require('request');
const fs = require('fs');

const storeNewJsonFileAtLocal = async () => {
  // 留档
  // products/new/*.json 
  const filesCount = (await shell.ls('products/new/*.json')).stdout
    .split('\n')
    .filter((x) => !!x).length;
  console.log('filesCount: ', filesCount);
  if (filesCount) {
    const dirName = Date.now().toString();
    console.log('dirName: ', dirName);
    await shell.exec(`mkdir -p products/new_store/${dirName}`);
    await shell.exec(`mv products/new/*.json products/new_store/${dirName}`);
  }
};

const callRemoveBgAPI = (
  localFilePath,
  whiteBgFileSavePath,
  squareFileSavePath
) => {
  return new Promise(function (resolve, reject) {
    const { fileName, fileSuffix } = getFileInfoByPath(localFilePath);
    request.post(
      {
        url: 'https://api.remove.bg/v1.0/removebg',
        formData: {
          image_file: fs.createReadStream(localFilePath),
          size: 'auto',
        },
        headers: {
          'X-Api-Key': process.env.API_KEY,
        },
        encoding: null,
      },
      async function (error, response, body) {
        console.log('body: ', body);
        if (error) {
          console.error('Request failed:', error);
          reject(error);
        }
        if (response.statusCode != 200) {
          console.error('Error:', response.statusCode, body.toString('utf8'));
          reject(error);
        }

        const newFileFullPath = `${whiteBgFileSavePath}/${fileName}-no-bg.${fileSuffix}`;
        await fs.writeFileSync(newFileFullPath, body);

        const NEW_SQUARE_FILE_NAME = `${squareFileSavePath}/${fileName}.${fileSuffix}`;
        // 生成 1000*1000 的图片
        await shell.exec(
          `FILE_PATH=${newFileFullPath} NEW_SQUARE_FILE_NAME=${NEW_SQUARE_FILE_NAME} ../convert2_1_1_one_file.sh`
        );

        resolve(1);
      }
    );
  });
}

module.exports = {
  callRemoveBgAPI,
  storeNewJsonFileAtLocal,
};
