// node index.js
// FILE_PATH='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg.jpg'  NEW_SQUARE_FILE_NAME='/Users/joeeey/Downloads/美团/刀片/11/IMG_2336-no-bg-square.jpg' ./convert2_1_1_one_file.sh

const homedir = require('os').homedir();
const request = require('request');
const fs = require('fs');
const shell = require('shelljs');
const imageMapping = require('./products/imageMapping');

const rootFolder = `${homedir}/Downloads`;
const productsFolder = `${rootFolder}/E-commerce`;

const newProducts = ['宝娜斯2021新款字母防勾丝连裤袜黑色丝袜_双']

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
const imageTypeDir = 'image'
const videoTypeDir = 'video'
// // output/white-bg
const whiteBgOutputDir = 'white-bg';

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
    const sourceTypesDir = [
      imageTypeDir,
      videoTypeDir,
    ]
    outputSecondDirs.forEach(async (outputSecondDir) => {
      if (!fs.existsSync(`${outputDirFullPath}/${outputSecondDir}`)) {
        await fs.mkdirSync(`${outputDirFullPath}/${outputSecondDir}`);
        if (outputSecondDir===mainOutputDir || outputSecondDir===descriptionOutputDir) {
          sourceTypesDir.forEach(async (sourceTypeDir) => {
            await fs.mkdirSync(`${outputDirFullPath}/${outputSecondDir}/${sourceTypeDir}`);
          })
        }
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
    console.log('fileName: ', fileName);
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
  dataMapping.category=dataMapping.c
  return dataMapping;
};

const doJob = async (isNoBgFile = false) => {
  let productsJsonData = []
  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];
    const newProduct = newProducts[i];

    // 如果 source 文件下存在 image 文件， 则开始操作，否则跳过
    const sourceDirFullPath = `${newProductDir}/${sourceDir}`;
    const outPutDirFullName = `${newProductDir}/${outPutDir}`;
    const filesInSource = (await shell.exec(`ls ${sourceDirFullPath}`).stdout)
      .split('\n')
      .filter((x) => !!x);
    if (filesInSource.length === 0) {
      continue;
    }

    // 遍历 download 中的 source 文件
    // 分析文件类型，主图还是描述，放入对应的文件夹
    let productFirstCategory = ''
    for (let j = 0; j < filesInSource.length; j++) {
      const fileInSource = filesInSource[j];
      
      const fileInfo = parseSourceFileName(fileInSource);
      productFirstCategory = fileInfo.category
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

        // 主图操作
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
        if (fileInfo.type === 'main') {
          const desPath = `${outPutDirFullName}/${mainOutputDir}/${imageTypeDir}/${fileInfo.realSourceName}`
          await shell.exec(
            `cp ${fileInSourceFullPath} ${desPath}`
          );
        } else if (fileInfo.type === 'description') {
          const desPath = `${outPutDirFullName}/${descriptionOutputDir}/${imageTypeDir}/${fileInfo.realSourceName}`
          await shell.exec(
            `cp ${fileInSourceFullPath} ${desPath}`
          );
        }
      } else {
        // 不存在 platform, 说明是自己拍的图

        // 将大于 5M 的图片压缩下保存到原始位置
        const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
        const fileKBSize = parseFloat(
          (await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)).stdout
        );
        console.log('fileKBSize: ', fileKBSize);
        if (fileKBSize > 5 * 1024) {
          console.log('图片大于 5*1024k');
          const compressRate = 1 - (fileKBSize - 5 * 1024 + 300) / (5 * 1024);
          await shell.exec(
            `convert ${fileInSourceFullPath} -resize ${compressRate * 100
            }% ${fileInSourceFullPath}`
          );
        }

        // TODO 参照之前的逻辑完成这段逻辑
      }
    }
    // 生成 json 文件
    // - 每次都生成名称为 products/new/${category}.json
    // - 根据图片名称和 imageMapping 得到尽可能多的信息

    // 如果有 mapping 关系就生成多个商品名称
    let newProductJsonName = []
    const mappingFileNames = imageMapping[newProduct];
    if (mappingFileNames) {
      newProductJsonName = newProductJsonName.concat(mappingFileNames)
    } else {
      newProductJsonName = [newProduct]
    }

    const jsonData = newProductJsonName.map(x => {
      // productFirstCategory
      return {
        "美团类别": "TODO_家装建材_厨房卫浴_水龙头",
        "商品标题*": x,
        "产地": "",
        "商品品牌": "",
        "规格名称": "",
        "成本": "TODO",
        "外部链接": "",
        "价格（元）*": "TODO",
        "库存*": "66",
        "重量*": "TODO",
        "重量单位": "g",
        "商品条码(upc/ean等)": "",
        "店内码/货号": "",
        "店内一级分类*": productFirstCategory,
        "店内二级分类": "",
        "货架码/位置码": "",
        "最小购买量": "1",
        "售卖状态": "上架",
        "描述": "",
        "app_food_code": ""
      }
    })
    productsJsonData = productsJsonData.concat(jsonData)

    // await shell.exec(
    //   `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${squareRatioOutputDir}`
    // );
    continue;

    // 本来就是白底图 将图片从 source 拷贝到 no-bg 放大成 1:1 放到 square 中
    // if (isNoBgFile) {
    //   await shell.exec(
    //     `cp -r ${sourceDirFullPath}/* ${outPutDirFullName}/${whiteBgOutputDir}`
    //   );

    //   const filesInNoBg = (
    //     await shell.exec(`ls ${outPutDirFullName}/${whiteBgOutputDir}`).stdout
    //   )
    //     .split('\n')
    //     .filter((x) => !!x);
    //   filesInNoBg.forEach(async (fileInNoBg) => {
    //     const fileInWhiteBgOutputFullPath = `${outPutDirFullName}/${whiteBgOutputDir}/${fileInNoBg}`;
    //     const squareFileSavePath = `${outPutDirFullName}/${squareRatioOutputDir}`;
    //     const NEW_SQUARE_FILE_NAME = `${squareFileSavePath}/${fileInNoBg}`;
    //     // 生成 1:1 的图片
    //     await shell.exec(
    //       `FILE_PATH=${fileInWhiteBgOutputFullPath} NEW_SQUARE_FILE_NAME=${NEW_SQUARE_FILE_NAME} ./convert2_1_1_one_file.sh`
    //     );
    //   });

    //   continue;
    // }

    // filesInSource.forEach(async (fileInSource) => {
    //   const fileInSourceFullPath = `${sourceDirFullPath}/${fileInSource}`;
    //   const fileKBSize = parseFloat(
    //     (await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)).stdout
    //   );
    //   console.log('fileKBSize: ', fileKBSize);
    //   if (fileKBSize > 5 * 1024) {
    //     console.log('图片大于 5*1024k');
    //     const compressRate = 1 - (fileKBSize - 5 * 1024 + 300) / (5 * 1024);
    //     await shell.exec(
    //       `convert ${fileInSourceFullPath} -resize ${compressRate * 100
    //       }% ${fileInSourceFullPath}`
    //     );
    //   }
    // });
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

  console.log('productsJsonData: ', productsJsonData);

  // {
  //   "美团类别": "TODO_家装建材_厨房卫浴_水龙头",
  //   "商品标题*": x,
  //   "产地": "",
  //   "商品品牌": "",
  //   "规格名称": "",
  //   "成本": "TODO",
  //   "外部链接": "",
  //   "价格（元）*": "TODO",
  //   "库存*": "66",
  //   "重量*": "TODO",
  //   "重量单位": "g",
  //   "商品条码(upc/ean等)": "",
  //   "店内码/货号": "",
  //   "店内一级分类*": productFirstCategory,
  //   "店内二级分类": "",
  //   "货架码/位置码": "",
  //   "最小购买量": "1",
  //   "售卖状态": "上架",
  //   "描述": "",
  //   "app_food_code": ""
  // }

  const categoryMapping = {}
  for (let i = 0; i < productsJsonData.length; i++) {
    const productJsonData = productsJsonData[i];
    const firstCategory = productJsonData["店内一级分类*"]
    if (!categoryMapping[firstCategory]) {
      categoryMapping[firstCategory] = [productJsonData]
    } else {
      categoryMapping[firstCategory].push(productJsonData)
    }
  }

  console.log('categoryMapping: ', categoryMapping);
  Object.keys(categoryMapping).forEach(async key => {
    await shell.exec(`rm -rf products/new/`)
    const path = `products/new/${key}.json`
    await fs.writeFileSync(path, JSON.stringify(categoryMapping[key]));
  })


};

// 生成美团图片
// 并且压缩主图文件夹
const genMeituanFormattedImage = async (tmpDir, imageType) => {
  const files = (await shell.ls(`${tmpDir}/${imageType}`)).stdout.split('\n').filter((x) => !!x);

  await shell.exec(`mkdir -p ${tmpDir}/美团/${imageType}`);
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
        `cp ${tmpDir}/${imageType}/${fileName} ${tmpDir}/美团/${imageType}/${meituanFileName}`
      );
    } else {
      await shell.exec(`cp ${tmpDir}/${imageType}/${fileName} ${tmpDir}/美团/${imageType}/${fileName}`);
    }
  }
  if (imageType===mainOutputDir) {
    // 压缩 main 文件夹
    // 压缩文件放在 meituan 目录下
    await shell.exec(`cd ${tmpDir}/美团 && zip -vr meituan_main.zip ${imageType}/ -x "*.DS_Store"`)
  }
};

const genEleFormattedImage = async (tmpDir, imageType) => {
  const files = (await shell.ls(`${tmpDir}/${imageType}`)).stdout.split('\n').filter((x) => !!x);
  // console.log('files: ', files);
  // TODO fix meituan 文件夹  warning
  await shell.exec(`mkdir -p ${tmpDir}/饿了么/${imageType}`);
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
        `cp ${tmpDir}/${imageType}/${fileName} ${tmpDir}/饿了么/${imageType}/${eleMeFileName}`
      );
    } else {
      await shell.exec(`cp ${tmpDir}/${imageType}/${fileName} ${tmpDir}/饿了么/${imageType}/${fileName}`);
    }
  }
};

// 适用于不同规格的相同产品
// 比如铅笔蓝色, 铅笔红色，在生存 json 文件时，应该用规格名
// 根据 mapping 关系生成不同命名的相同图片
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
        const formattedName = newProductFileName.replace(
          newProduct,
          mappingFileName
        );
        console.log('formattedName: ', formattedName);
        await shell.exec(
          `cp ${tmpDir}/${newProductFileName} ${tmpDir}/${formattedName}`
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
      await shell.exec(
        `sips -Z 600 ${tmpDir}/${fileInTmp} --setProperty format jpeg`
      );
    }
  }
};

// 提取所有 image
// - 只是把 output 里面文件夹的图片拿出来，不做其他处理
// - 为了适应目前平台，不同商品的图片会混在一起，而不是单独的文件夹
// - images 中分为 main 和 description 两个文件夹, main 中的逻辑与之前相同
const extractAllOutputImages = async () => {
  const tmpDir = '/tmp/allImages';

  await shell.exec(`rm -rf ${tmpDir}`);
  await shell.exec(`mkdir -p ${tmpDir}/${mainOutputDir}`);
  await shell.exec(`mkdir -p ${tmpDir}/${descriptionOutputDir}`);
  for (let i = 0; i < newProductsDir.length; i++) {
    const newProductDir = newProductsDir[i];
    const outputDirFullPath = `${newProductDir}/${outPutDir}`;
    await shell.exec(`cp -r ${outputDirFullPath}/${mainOutputDir}/${imageTypeDir}/* ${tmpDir}/${mainOutputDir}`);
    await shell.exec(`cp -r ${outputDirFullPath}/${descriptionOutputDir}/${imageTypeDir}/* ${tmpDir}/${descriptionOutputDir}`);
  }

  const imgTypesDir = [mainOutputDir, descriptionOutputDir]
  // // 压缩下图片
  for (let i = 0; i < imgTypesDir.length; i++) {
    const dir = imgTypesDir[i];
    await compressOutput(`${tmpDir}/${dir}`);
  }

  // // 根据 mapping 关系生成不同命名的相同图片
  for (let i = 0; i < imgTypesDir.length; i++) {
    const dir = imgTypesDir[i];
    await genSameImageWithDiffName(`${tmpDir}/${dir}`);
  }

  // // 生成美团和饿了么格式的文件名
  for (let i = 0; i < imgTypesDir.length; i++) {
    const dir = imgTypesDir[i];
    await genMeituanFormattedImage(tmpDir, dir);
  }

  for (let i = 0; i < imgTypesDir.length; i++) {
    const dir = imgTypesDir[i];
    await genEleFormattedImage(tmpDir, dir);
  }

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
  // await extractAllOutputImages();
};

main();
