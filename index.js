// node index.js
// FILE_PATH='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg.jpg'  NEW_SQUARE_FILE_NAME='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg-square.jpg' ./convert2_1_1_one_file.sh

const request = require('request');
const fs = require('fs');
const shell = require('shelljs');

const rootFolder = '/Users/joeeey/Downloads';
const productsFolder = `${rootFolder}/E-commerce`;

const dirs = [
  // '止水阀三角阀不锈钢',
  '东成充电式起子电钻电动螺丝刀电转钻',
  '东成无刷电动扳手充电式无刷冲击扳手',
  '东成石材切割机Z1E-FF-110',
  '东成石材切割机Z1E-FF02-110',
  '东成电钻水泥打灰打浆搅灰机J1Z-FF-16A',
  '东成圆电据手提木工台锯M1Y-FF-185',
  '东成电锤混凝土打孔钻墙Z1C-FF-26',
  '东成电锤电镐多功能Z1C-FF03-26',
  '东成型材切割机钢材大功率切割机J1G-FF02-355',
  '手提打磨砂轮切割机角向磨光机FF05-100B',
  '手提打磨砂轮切割机角向磨光机FF09-100',
  '冲击电锤钻头方柄',
].map((x) => `${productsFolder}/${x}`);

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

// 将本来不在对应文件夹的图片拷贝到对应目录的 source 中
// 图片的名称需要带有目录名
const cpOriginFilesIntoSource = async () => {
  // rootFolder
  const originFiles = (await shell.exec(`ls ${rootFolder}`).stdout)
    .split('\n')
    .filter((x) => !!x);

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    const dirName = dir.split('/').pop();
    targetFiles = originFiles.filter((file) => file.includes(dirName));
    console.log('targetFiles: ', targetFiles);
    await targetFiles.forEach(async (targetFile) => {
      await shell.exec(`cp ${rootFolder}/${targetFile} ${dir}/${sourceDir}`);
    });
  }
};

const doJob = async (isFromTB = false, isNoBgFile = false) => {
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
      for (let j = 0; j < filesInSource.length; j++) {
        const fileInSource = filesInSource[j];
        const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;

        const imageDimmesion = (
          await shell.exec(`identify -format '%w %h' ${fileInSourceFullPath}`)
        ).stdout;
        console.log('imageDimmesion: ', imageDimmesion.split(' '));
        let [imageWidth, imageHeight] = imageDimmesion;
        // TODO 如果不是 1:1 直接留白
        if (imageWidth !== imageHeight) {
          await shell.exec(
            `convert ${fileInSourceFullPath} -resize 800x800 -gravity center -background white -extent 800x800 ${fileInSourceFullPath}`
          );
        }

        const newImageDimmesion = (
          await shell.exec(`identify -format '%w %h' ${fileInSourceFullPath}`)
        ).stdout;
        console.log('newImageDimmesion: ', newImageDimmesion.split(' '));

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
          console.log('先出现啊啊啊')
          await shell.exec(
            `sips -Z 1000 ${fileInSourceFullPath} --setProperty format jpeg`
          );
        }
      }

      await shell.exec(
        `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${squareRatioOutputDir}`
      );
      continue;
    }

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
        `cp -r ${tmpDir}/${fileName} ${tmpDir}/${meituanFileName}`
      );
    }
  }
};

const genEleFormatedImage = async (tmpDir) => {
  const files = (await shell.ls(tmpDir)).stdout.split('\n').filter((x) => !!x);
  console.log('files: ', files);

  const picIndexPattern = /\-ec\d+\./i;
  // const fileName = '东成电钻水泥打灰打浆搅灰机J1Z-FF-16A-ec2.jpg'
  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const matchedValue = fileName.match(picIndexPattern);
    if (matchedValue) {
      picIndex = matchedValue[0]; // e.g.  '-ec2.' | '-ec10.'
      const indexValue = parseInt(picIndex.match(/\d+/i)); // 以 1 开始
      console.log('indexValue: ', indexValue);
      const eleMeFileName = fileName
        .replace(picIndex, '.')
        .replace('-', '_')
        .replace('.', `-${indexValue}.`);
      console.log('eleMeFileName: ', eleMeFileName);
      await shell.exec(
        `cp -r ${tmpDir}/${fileName} ${tmpDir}/${eleMeFileName}`
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

  // TODO 新增文件名， 美团饿了么的批量更新图片对文件名有不同对要求
  // 饿了么:
  //   - 除了结尾的 {number}. 之前， 其他地方不能出现 '-', 得换成 _
  // 美团:
  //   - 以 'ZS0-' 开头来区分多图
  //   - 移除结尾处 -{number}

  // 美图文件名
  await genMeituanFormatedImage(tmpDir);
  await genEleFormatedImage(tmpDir);

  await shell.exec(`open ${tmpDir}`);
};

const main = async () => {
  const { isNoBgFile, isFromTB } = process.env;
  await createDirs();
  await cpOriginFilesIntoSource();
  await doJob(!!isFromTB, !!isNoBgFile);
  await extractAllSuqareImages();
};

main();
