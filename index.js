// node index.js
// FILE_PATH='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg.jpg'  NEW_SQUARE_FILE_NAME='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg-square.jpg' ./convert2_1_1_one_file.sh

const request = require('request');
const fs = require('fs');
const shell = require('shelljs');
const imageMapping = require('./products/imageMapping');

const rootFolder = '/Users/joeeey/Downloads';
const productsFolder = `${rootFolder}/E-commerce`;

const newProducts = ['不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂'];

const newProductsDir = newProducts.map((x) => `${productsFolder}/${x}`);

/**
 * 文件路径
 * ├── output
 * │   ├── 11 // 为 1:1 图片
 * │   │   ├── xxxxx_个-ec1.jpeg
 * │   └── white-bg // 为白底图
 * │   └── main // 为主图，和 1:1 图应该一样
 * │   └── description // 为描述图
 * ├── source // 存在源文件，包含 image video
 * │   ├── xxxxx_个-ec1.jpeg
 */
const outPutDir = 'output';
const sourceDir = 'source';
const taobaoDir = 'tb';
const meiduanElemaDir = '美团饿了么';
// output/11
const squareRatioOutputDir = '11';
const mainOutputDir = 'main';
const descriptionOutputDir = 'description';
// // output/white-bg
const whiteBgOutputDir = 'white-bg';

// 将 ['output', 'source', 'tb', '美团饿了么'] 目录创建
const createDirs = async () => {
  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];
    if (!fs.existsSync(newProductDir)) {
      await fs.mkdirSync(newProductDir);
    }

    // 创建第一层目录
    const oneLevelDirs = [outPutDir, sourceDir, taobaoDir, meiduanElemaDir];
    oneLevelDirs.forEach(async (oneLevelDir) => {
      if (!fs.existsSync(`${newProductDir}/${oneLevelDir}`)) {
        await fs.mkdirSync(`${newProductDir}/${oneLevelDir}`);
      }
    });

    // 创建 output 下的目录
    const outputDirFullPath = `${newProductDir}/${outPutDir}`;
    const outputSecondDirs = [
      squareRatioOutputDir,
      whiteBgOutputDir,
      mainOutputDir,
      descriptionOutputDir,
    ];
    outputSecondDirs.forEach(async (outputSecondDir) => {
      if (!fs.existsSync(`${outputDirFullPath}/${outputSecondDir}`)) {
        await fs.mkdirSync(`${outputDirFullPath}/${outputSecondDir}`);
      }
    });
  }
};

const getFromBetween = {
  results: [],
  string: '',
  getFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
      return false;
    const SP = this.string.indexOf(sub1) + sub1.length;
    const string1 = this.string.substr(0, SP);
    const string2 = this.string.substr(SP);
    const TP = string1.length + string2.indexOf(sub2);
    return this.string.substring(SP, TP);
  },
  removeFromBetween: function (sub1, sub2) {
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
      return false;
    const removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
    this.string = this.string.replace(removal, '');
  },
  getAllResults: function (sub1, sub2) {
    // first check to see if we do have both substrings
    if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0) return;

    // find one result
    const result = this.getFromBetween(sub1, sub2);
    // push it to the results array
    this.results.push(result);
    // remove the most recently found one from the string
    this.removeFromBetween(sub1, sub2);

    // if there's more substrings
    if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
      this.getAllResults(sub1, sub2);
    } else return;
  },
  get: function (string, sub1, sub2) {
    this.results = [];
    this.string = string;
    this.getAllResults(sub1, sub2);
    return this.results;
  },
};

// 1. 将本来不在对应文件夹的图片拷贝到对应目录的 source 中(E-commerce/{product}/source)，图片的名称需要带有目录名
// 2. 将原始图拷贝到 E-commerce/origin_source 目录
const cpOriginFilesIntoSource = async () => {
  const originFiles = (await shell.exec(`ls ${rootFolder}`).stdout)
    .split('\n')
    .filter((x) => !!x);

  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];
    const dirName = newProductDir.split('/').pop();
    targetFiles = originFiles.filter((file) => file.includes(dirName));
    console.log('targetFiles: ', targetFiles);
    await targetFiles.forEach(async (targetFile) => {
      await shell.exec(
        `cp ${rootFolder}/${targetFile} ${newProductDir}/${sourceDir}`
      );
      await shell.exec(
        `cp ${rootFolder}/${targetFile} ${productsFolder}/origin_source`
      );
    });
  }
};

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

const ECommercialPlatforms = ['1688', 'tabobao', 'tianmao', 'jd', 'pdd'];
// 解析文件资源名称
/**
 *
 * @param {*} fileName
 * Format:
 *  - 来自电商: {p-1688}{t-main}{c-宠物用品}{n-不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂}end-ec0.jpg
 *  - 来自自拍: {c-宠物}{n-不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂}end-ec0.jpg
 * @return {p: 'xx', c: 'xx', n: 'xxx', realSourceName: '不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂-ec0.jpg'}
 */
const parseSourceFileName = (fileName) => {
  const imgSuffix = ['jpg', 'png', 'jpeg'];
  const videoSuffix = ['mp4'];
  const dataMapping = {}; // {p: 'xx', c: 'xx', n: 'xxx'}

  // console.log('getFromBetween: ', getFromBetween);
  getFromBetween.get(fileName, '{', '}').forEach((x) => {
    console.log('x: ', x);
    dataMapping[x.split('-')[0]] = x.split('-').slice(1, 9999)[0];
  });

  const realSourceName = `${dataMapping.n}${fileName.split('}end')[1]}`;

  const { fileSuffix } = getFileInfoByPath(realSourceName);
  if (imgSuffix.includes(fileSuffix)) {
    dataMapping.fileType = 'image';
  } else if (videoSuffix.includes(fileSuffix)) {
    dataMapping.fileType = 'video';
  }
  dataMapping.realSourceName = realSourceName;
  return dataMapping;
};

const doJob = async (isFromTB = false, isNoBgFile = false) => {
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

          const NEW_SQUARE_FILE_NAME = `${squareFileSavePath}/${fileName}.${fileSuffix}`;
          // 生成 1000*1000 的图片
          await shell.exec(
            `FILE_PATH=${newFileFullPath} NEW_SQUARE_FILE_NAME=${NEW_SQUARE_FILE_NAME} ./convert2_1_1_one_file.sh`
          );

          resolve(1);
        }
      );
    });
  }

  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];

    // 如果 source 文件下存在 image 文件， 则开始操作，否则跳过
    const sourceDirFullPath = `${newProductDir}/${sourceDir}`;
    const outPutDirFullName = `${newProductDir}/${outPutDir}`;
    const filesInSource = (await shell.exec(`ls ${sourceDirFullPath}`).stdout)
      .split('\n')
      .filter((x) => !!x);
    if (filesInSource.length === 0) {
      continue;
    }

    // TODO isFromTB 从图片名称计算出来

    // 尺寸太小的话用 sips 扩展到(根据当前比例)最大边为 1000
    for (let j = 0; j < filesInSource.length; j++) {
      const fileInSource = filesInSource[j];

      const fileInfo = parseSourceFileName(fileInSource);
      // {fileType: 'image',p: 'xx', t: 'main', c: 'category', n: 'xxx', realSourceName: '不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂-ec0.jpg'}
      console.log('fileInfo: ', fileInfo);
      //  TODO do we need video operation
      if (fileInfo.fileType === 'video') {
        continue;
      }

      const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
      // 存在 platform, 说明是从电商平台获得的资源
      if (fileInfo.p) {
        const imageDimmesion = (
          await shell.exec(`identify -format '%w %h' ${fileInSourceFullPath}`)
        ).stdout;

        if (fileInfo.t === 'main') {
          const [imageWidth, imageHeight] = imageDimmesion;
          // 主图如果不是 1:1 直接四周留白
          if (imageWidth !== imageHeight) {
            await shell.exec(
              `convert ${fileInSourceFullPath} -resize 800x800 -gravity center -background white -extent 800x800 ${fileInSourceFullPath}`
            );

            const newImageDimmesion = (
              await shell.exec(
                `identify -format '%w %h' ${fileInSourceFullPath}`
              )
            ).stdout;
            console.log(
              '留白图片 Dimmesion is: ',
              newImageDimmesion.split(' ')
            );
          }
        }

        const fileKBSize = (
          await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)
        ).stdout;
        console.log('fileKBSize: ', fileKBSize);
        if (parseFloat(fileKBSize) < 100) {
          console.log('图片小于 100k, 扩大之');
          await shell.exec(`sips -Z 1000 ${fileInSourceFullPath}`);
        }

        if (parseFloat(fileKBSize) > 600) {
          console.log('图片大于 600k, 缩之');
          await shell.exec(
            `sips -Z 1000 ${fileInSourceFullPath} --setProperty format jpeg`
          );
        }

        // 拷贝调整后的图片放入 output 中
        // 文件名使用不带有 {} 的
        if (fileInfo.t === 'main') {
          console.log('main: herere', fileInSourceFullPath, );
          console.log('main22222: ', `${outPutDirFullName}/${squareRatioOutputDir}/${fileInfo.realSourceName}`)
          await shell.exec(
            `cp ${fileInSourceFullPath} ${outPutDirFullName}/${mainOutputDir}/${fileInfo.realSourceName}`
          );
        } else if (fileInfo.t === 'description') {
          await shell.exec(
            `cp ${fileInSourceFullPath} ${outPutDirFullName}/${descriptionOutputDir}/${fileInfo.realSourceName}`
          );
        }
      }
    }

    // await shell.exec(
    //   `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${squareRatioOutputDir}`
    // );
    continue;

    // 本来就是白底图 将图片从 source 拷贝到 no-bg 放大成 1:1 放到 square 中
    if (isNoBgFile) {
      // const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
      await shell.exec(
        `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${whiteBgOutputDir}`
      );

      const filesInNoBg = (
        await shell.exec(`ls ${outPutDirFullName}/${whiteBgOutputDir}`).stdout
      )
        .split('\n')
        .filter((x) => !!x);
      filesInNoBg.forEach(async (fileInNoBg) => {
        const fileInWhiteBgOutputFullPath = `${outPutDirFullName}/${whiteBgOutputDir}/${fileInNoBg}`;
        const squareFileSavePath = `${outPutDirFullName}/${squareRatioOutputDir}`;
        const NEW_SQUARE_FILE_NAME = `${squareFileSavePath}/${fileInNoBg}`;
        // 生成 1:1 的图片
        await shell.exec(
          `FILE_PATH=${fileInWhiteBgOutputFullPath} NEW_SQUARE_FILE_NAME=${NEW_SQUARE_FILE_NAME} ./convert2_1_1_one_file.sh`
        );
      });

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

    const filesInNoBgOutputDir = (
      await shell.exec(`ls ${outPutDirFullName}/${whiteBgOutputDir}`).stdout
    )
      .split('\n')
      .filter((x) => !!x);
    console.log('filesInSquareRatioOutputDir: ', filesInSquareRatioOutputDir);

    for (let j = 0; j < filesInSource.length; j++) {
      const sourceFile = filesInSource[j];
      const sourceFileName = getFileInfoByPath(sourceFile).fileName;
      // 在 no-bg 存在 但不在正方形存在，需要变成正方形
      const fileInNobg = filesInNoBgOutputDir.some((x) =>
        x.includes(sourceFileName)
      );
      const isFileInSquare = filesInSquareRatioOutputDir.some((x) =>
        x.includes(sourceFileName)
      );
      const whiteBgFileSavePath = `${outPutDirFullName}/${whiteBgOutputDir}`;
      const squareFileSavePath = `${outPutDirFullName}/${squareRatioOutputDir}`;

      // 在正方形中存在已经被 remove bg 处理过
      if (fileInNobg && isFileInSquare) {
        continue;
      }

      // 开始 remove bg
      const toBeRemoveFilePath = `${sourceDirFullPath}/${sourceFile}`;
      // console.log('toBeRemoveFilePath: ', toBeRemoveFilePath);
      await callRemoveBgAPI(
        toBeRemoveFilePath,
        whiteBgFileSavePath,
        squareFileSavePath
      );
    }
  }
};

const genMeituanFormatedImage = async (tmpDir) => {
  const files = (await shell.ls(tmpDir)).stdout.split('\n').filter((x) => !!x);
  console.log('files: ', files);

  await shell.exec(`mkdir -p ${tmpDir}/美团`);
  const picIndexPattern = /\-ec\d+\./i;
  // const fileName = '东成电钻水泥打灰打浆搅灰机J1Z-FF-16A-ec2.jpg'
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const matchedValue = fileName.match(picIndexPattern);
    if (matchedValue) {
      picIndex = matchedValue[0]; // e.g.  '-ec2.' | '-ec10.'
      const indexValue = parseInt(picIndex.match(/\d+/i)); // 以 1 开始
      const meituanFileName = `ZS${indexValue - 1}-${fileName.replace(
        picIndex,
        '.'
      )}`;
      await shell.exec(
        `cp ${tmpDir}/${fileName} ${tmpDir}/美团/${meituanFileName}`
      );
    } else {
      await shell.exec(`cp ${tmpDir}/${fileName} ${tmpDir}/美团/${fileName}`);
    }
  }
};

const genEleFormatedImage = async (tmpDir) => {
  const files = (await shell.ls(tmpDir)).stdout.split('\n').filter((x) => !!x);
  console.log('files: ', files);
  // TODO fix meituan 文件夹  warning
  await shell.exec(`mkdir -p ${tmpDir}/饿了么`);
  const picIndexPattern = /\-ec\d+\./i;
  // const fileName = '东成电钻水泥打灰打浆搅灰机J1Z-FF-16A-ec2.jpg'
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const matchedValue = fileName.match(picIndexPattern);
    if (matchedValue) {
      picIndex = matchedValue[0]; // e.g.  '-ec2.' | '-ec10.'
      const indexValue = parseInt(picIndex.match(/\d+/i)); // 以 1 开始
      const eleMeFileName = fileName
        .replace(picIndex, '.')
        .replace('-', '_')
        .replace('.', `-${indexValue}.`);
      await shell.exec(
        `cp ${tmpDir}/${fileName} ${tmpDir}/饿了么/${eleMeFileName}`
      );
    } else {
      await shell.exec(`cp ${tmpDir}/${fileName} ${tmpDir}/饿了么/${fileName}`);
    }
  }
};

const genSameImageWithDiffName = async (tmpDir) => {
  console.log('genSameImageWithDiffName: ');
  const filesInTmp = (await shell.ls(tmpDir)).stdout
    .split('\n')
    .filter((x) => !!x);
  for (let i = 0; i < newProducts.length; i++) {
    const newProduct = newProducts[i];
    console.log('newProducts: ', newProduct);
    const mappingFileNames = imageMapping[newProduct];
    console.log('mappingFileNames: ', mappingFileNames);
    if (!mappingFileNames) continue;
    const newProductFileNames = filesInTmp.filter((x) =>
      x.includes(newProduct)
    ); // [asd-ec1.png asd.jpg]
    // console.log('newProductFileNames: ', newProductFileNames);

    for (let k = 0; k < newProductFileNames.length; k++) {
      const newProductFileName = newProductFileNames[k];

      for (let j = 0; j < mappingFileNames.length; j++) {
        const mappingFileName = mappingFileNames[j];
        // const regex = new RegExp(newProductFileName, 'i')
        const formatedName = newProductFileName.replace(
          newProduct,
          mappingFileName
        );
        console.log('formatedName: ', formatedName);
        await shell.exec(
          `cp ${tmpDir}/${newProductFileName} ${tmpDir}/${formatedName}`
        );
      }
    }
  }
};

const compressOutput = async (tmpDir) => {
  const filesInTmp = (await shell.ls(tmpDir)).stdout
    .split('\n')
    .filter((x) => !!x);

  for (let i = 0; i < filesInTmp.length; i++) {
    const fileInTmp = filesInTmp[i];
    const fileKBSize = (
      await shell.exec(`du -k ${tmpDir}/${fileInTmp} |cut -f1`)
    ).stdout;

    if (parseFloat(fileKBSize) > 300) {
      console.log('压缩最终图');
      await shell.exec(
        `sips -Z 600 ${tmpDir}/${fileInTmp} --setProperty format jpeg`
      );
    }
  }
};

const extractAllSuqareImages = async () => {
  const tmpDir = '/tmp/allImages';

  await shell.exec(`rm -rf ${tmpDir}`);
  await shell.exec(`mkdir -p ${tmpDir}`);
  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];
    const sourceDirFullPath = `${newProductDir}/${outPutDir}/${squareRatioOutputDir}`;
    await shell.exec(`cp -r ${sourceDirFullPath}/* ${tmpDir}/`);
  }

  // 压缩下图片
  await compressOutput(tmpDir);

  // 根据 mapping 关系生成不同命名的相同图片
  await genSameImageWithDiffName(tmpDir);

  // 生成美团和饿了么格式的文件名
  await genMeituanFormatedImage(tmpDir);
  await genEleFormatedImage(tmpDir);

  await shell.exec(`open ${tmpDir}`);
};

/**
 * 分类图片: 根据 download 目录的图片视屏，将图片视屏归类为
 *   - 主图
 *   - 描述图
 * 生成 json 文件
 *   - 根据一级分类生成 -new_${一级分类}.json
 *   - create_xls 只是用 new_ 前缀的文件
 *   - 用一个脚本合并 new_ 前缀的文件 和已有的 json 目录
 */
const main = async () => {
  const { isNoBgFile, isFromTB } = process.env;
  // 在 E-commerce 中根据产品名称创建目录
  await createDirs();
  await cpOriginFilesIntoSource();
  await doJob(!!isFromTB, !!isNoBgFile);
  // await extractAllSuqareImages();
};

main();
