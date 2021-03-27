// node index.js
// FILE_PATH='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg.jpg'  NEW_SQUARE_FILE_NAME='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg-square.jpg' ./convert2_1_1_one_file.sh

const request = require('request');
const fs = require('fs');
const shell = require('shelljs');

const rootFolderPrefixPath = '/Users/joeeey/Downloads/E-commerce';


const dirs = [
  '不锈钢插销',
  '1.5平方护套线',
  '空调出水管',
].map((x) => `${rootFolderPrefixPath}/${x}`);

const outPutDir = 'output';
const sourceDir = 'source';
const taobaoDir = 'tb';
const meiduanElemaDir = '美团饿了么';
// output/11
const squareRatioOutputDir = '11';
// // output/white-bg
const whiteBgOutputDir = 'white-bg';

// 将 ['output', 'source', 'tb', '美团饿了么'] 目录创建
const createDirs = async () => {
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    if (!fs.existsSync(dir)) {
      await fs.mkdirSync(dir);
    }

    // 创建第一层目录
    const oneLevelDirs = [outPutDir, sourceDir, taobaoDir, meiduanElemaDir];
    oneLevelDirs.forEach(async (oneLevelDir) => {
      if (!fs.existsSync(`${dir}/${oneLevelDir}`)) {
        await fs.mkdirSync(`${dir}/${oneLevelDir}`);
      }
    });

    // 创建 output 下的目录
    const outputDirFullPath = `${dir}/${outPutDir}`;
    const outputSecondDirs = [squareRatioOutputDir, whiteBgOutputDir];
    outputSecondDirs.forEach(async (outputSecondDir) => {
      if (!fs.existsSync(`${outputDirFullPath}/${outputSecondDir}`)) {
        await fs.mkdirSync(`${outputDirFullPath}/${outputSecondDir}`);
      }
    });
  }
};

const doJob = async (isFromTB = false) => {
  // 根据文件路径得出文件名称，后缀
  // 注意 . 只能出现一次
  const getFileInfoByPath = (path) => {
    const fileFullname = path.split('/').pop();
    const [fileName, fileSuffix] = fileFullname.split('.');
    return {
      fileName,
      fileSuffix,
      fileFullname,
    };
  };

  // 调用 API 去除背景
  // TODO 试试淘宝的抠图 , https://luban.aliyun.com/web/gen-next/entry
  // 目前不支持 api
  function callRemoveBgAPI(
    localFilePath,
    whiteBgFileSavePath,
    squareFileSavePath
  ) {
    return new Promise(function (resolve, reject) {
      const { fileName, fileSuffix } = getFileInfoByPath(localFilePath);
      request.post(
        {
          url: 'https://api.remove.bg/v1.0/removebg',
          // url: 'https://example.com/',
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
          // console.log('response: ', response);
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

          const NEW_SQUARE_FILE_NAME = `${squareFileSavePath}/${fileName}-square.${fileSuffix}`;
          // 生成 1000*1000 的图片
          await shell.exec(
            `FILE_PATH=${newFileFullPath} NEW_SQUARE_FILE_NAME=${NEW_SQUARE_FILE_NAME} ./convert2_1_1_one_file.sh`
          );

          resolve(1);
        }
      );
    });
  }

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];

    // 如果 source 文件下存在 image 文件， 则开始操作，否则跳过
    const sourceDirFullPath = `${dir}/${sourceDir}`;
    const outPutDirFullName = `${dir}/${outPutDir}`;
    const filesInSource = (await shell.exec(`ls ${sourceDirFullPath}`).stdout)
      .split('\n')
      .filter((x) => !!x);
    if (filesInSource.length === 0) {
      continue;
    }

    // isFromTB 为 true, 则直接将 source 中的图片拷贝到 output/11
    if (isFromTB) {
      // 尺寸太小的话用 sips 扩展到(根据当前比例)最大边为 1000
      filesInSource.forEach(async (fileInSource) => {
        const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
        const fileKBSize = (
          await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)
        ).stdout;
        console.log('fileKBSize: ', fileKBSize);
        if (parseFloat(fileKBSize) < 100) {
          console.log('图片小于 100k, 扩大之');
          await shell.exec(`sips -Z 1000 ${fileInSourceFullPath}`);
        }
      });
      // const sourceDir = `${dir}/${outPutDir}/${squareRatioOutputDir}`
      await shell.exec(
        `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${squareRatioOutputDir}`
      );
      continue;
    }

    filesInSource.forEach(async (fileInSource) => {
      const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
      const fileKBSize = parseFloat(
        (await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)).stdout
      );
      console.log('fileKBSize: ', fileKBSize);
      if (fileKBSize > 5 * 1024) {
        console.log('图片大于 5*1024k');
        const compressRate = 1 - (fileKBSize - 5 * 1024 + 300) / (5 * 1024);
        await shell.exec(
          `convert ${fileInSourceFullPath} -resize ${
            compressRate * 100
          }% ${fileInSourceFullPath}`
        );
      }
    });
    //  如果图片大于 5m，把图片压缩下让其小于 5m
    // convert /Users/joeeey/Downloads/IMG_2377.jpg  -resize 80% /Users/joeeey/Downloads/IMG_2377.jpg

    const filesInSquareRatioOutputDir = (
      await shell.exec(`ls ${outPutDirFullName}/${squareRatioOutputDir}`).stdout
    )
      .split('\n')
      .filter((x) => !!x);
    console.log('filesInSquareRatioOutputDir: ', filesInSquareRatioOutputDir);

    for (let j = 0; j < filesInSource.length; j++) {
      const sourceFile = filesInSource[j];
      const sourceFileName = getFileInfoByPath(sourceFile).fileName;
      // 已经被 remove bg 处理过
      if (filesInSquareRatioOutputDir.some((x) => x.includes(sourceFileName))) {
        continue;
      }

      // 开始 remove bg
      const toBeRemoveFilePath = `${sourceDirFullPath}/${sourceFile}`;
      console.log('toBeRemoveFilePath: ', toBeRemoveFilePath);
      const whiteBgFileSavePath = `${outPutDirFullName}/${whiteBgOutputDir}`;
      const squareFileSavePath = `${outPutDirFullName}/${squareRatioOutputDir}`;
      await callRemoveBgAPI(
        toBeRemoveFilePath,
        whiteBgFileSavePath,
        squareFileSavePath
      );
    }
  }
};

const extractAllSuqareImages = async () => {
  const tmpDir = '/tmp/allImages';
  await shell.exec(`rm -rf ${tmpDir}`);
  await shell.exec(`mkdir -p ${tmpDir}`);
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    const sourceDirFullPath = `${dir}/${outPutDir}/${squareRatioOutputDir}`;
    await shell.exec(`cp -r ${sourceDirFullPath}/* ${tmpDir}/`);
  }
  await shell.exec(`open ${tmpDir}`);
};

const main = async () => {
  await createDirs();
  const isFromTB = false;
  await doJob(isFromTB);
  await extractAllSuqareImages();
};

main();
