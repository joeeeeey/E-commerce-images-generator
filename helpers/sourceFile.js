const { getFromBetween } = require('./string');


// 根据文件路径得出文件名称，后缀
// 取最后一个 .
const getFileInfoByPath = (path) => {
  const fileFullName = path.split('/').pop();
  const splitWithDotArr = fileFullName.split('.');
  const fileSuffix = splitWithDotArr.pop();
  const fileName = splitWithDotArr
    .slice(0, splitWithDotArr.length - 1)
    .join('.');
  return {
    fileName,
    fileSuffix,
    fileFullName,
  };
};

/**
 *
 * @param {*} fileName
 * @method 解析文件资源名称
 * Format:
 *  - 来自电商: {p-1688}{t-main}{c-宠物用品}{n-不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂}end-ec0.jpg
 *  - 来自自拍: {c-宠物}{n-不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂}end-ec0.jpg
 * @return {p: 'xx', c: 'xx', n: 'xxx', realSourceName: '不锈钢铝合金猫砂铲金属铲屎神器猫铲爆款长柄猫砂-ec0.jpg'}
 */
const parseSourceFileName = (fileName) => {
  const imgSuffix = ['jpg', 'png', 'jpeg'];
  const videoSuffix = ['mp4'];
  const dataMapping = {}; // {p: 'xx', c: 'xx', n: 'xxx'}

  getFromBetween.get(fileName, '{', '}').forEach((x) => {
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
  dataMapping.category = dataMapping.c;
  return dataMapping;
};

/**
 *
 * @param {Array} filesInSource
 * @method 将断开的图片 ec-${number} 重排序，为了适应美团图片规则
 * eg: [xxx-ec2, xx-ec4]
 * @return [xxx-ec0, xx-ec1]
 * @TODO
 * 目前 filesInSource 也包含 videos, 是否需要对 video 处理，还是这个方法就只处理图片
 */
const getFileIndexMapping = (filesInSource) => {
  const fileIndexArray = [];
  const picIndexPattern = /\-ec\d+\./i;
  const mainImageSource = filesInSource.filter((x) => x.includes('type-main'));
  const desImageSource = filesInSource.filter((x) =>
    x.includes('type-description')
  );

  const getMp = (files) => {
    for (let j = 0; j < files.length; j++) {
      const fileInSource = files[j];

      const fileInfo = parseSourceFileName(fileInSource);
      //  TODO do we need video operation
      if (fileInfo.fileType !== 'image') {
        continue;
      }
      const matchedValue = fileInSource.match(picIndexPattern);
      if (matchedValue) {
        picIndex = matchedValue[0]; // e.g.  '-ec2.' | '-ec10.'
        const indexValue = parseInt(picIndex.match(/\d+/i)); // 以 1 开始
        fileIndexArray.push(indexValue);
      }
    }

    const fileIndexMapping = {};
    const sortedArr = fileIndexArray.sort((a, b) => a - b);
    sortedArr.forEach((x, index) => {
      fileIndexMapping[x] = index;
    });
    return fileIndexMapping;
  };

  return {
    main: getMp(mainImageSource),
    des: getMp(desImageSource),
  };
};

// 适用于不同规格的相同产品
// 比如铅笔蓝色, 铅笔红色，在生存 json 文件时，应该用规格名
// 根据 mapping 关系生成不同命名的相同图片
const genSameImageWithDiffName = async (tmpDir) => {
  const filesInTmp = (await shell.ls(tmpDir)).stdout
    .split('\n')
    .filter((x) => !!x);
  for (let i = 0; i < newProducts.length; i++) {
    const newProduct = newProducts[i];
    const mappingFileNames = imageMapping[newProduct];
    if (!mappingFileNames) continue;
    const newProductFileNames = filesInTmp.filter((x) =>
      x.includes(newProduct)
    ); // [asd-ec1.png asd.jpg]

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

// 主图如果不是 1:1 直接四周留白成 800x800
// TODO 800x800 应该是个变量
const extendToSquare = async (fileInSourceFullPath) => {
  const imageDimension = (
    await shell.exec(`identify -format '%w %h' ${fileInSourceFullPath}`)
  ).stdout;

  const [imageWidth, imageHeight] = imageDimension;

  if (imageWidth !== imageHeight) {
    await shell.exec(
      `convert ${fileInSourceFullPath} -resize 800x800 -gravity center -background white -extent 800x800 ${fileInSourceFullPath}`
    );
  }
};

// < 100k 变大， > 600k 变小
const resizeFileSize = async (fileInSourceFullPath) => {
  const fileKBSize = (
    await shell.exec(`du -k ${fileInSourceFullPath} |cut -f1`)
  ).stdout;
  // console.log('fileKBSize: ', fileKBSize);
  if (parseFloat(fileKBSize) < 100) {
    // console.log('图片小于 100k, 扩大之');
    await shell.exec(`sips -Z 1000 ${fileInSourceFullPath}`);
  }

  if (parseFloat(fileKBSize) > 600) {
    // console.log('图片大于 600k, 缩之');
    await shell.exec(
      `sips -Z 1000 ${fileInSourceFullPath} --setProperty format jpeg`
    );
  }
}

module.exports = {
  resizeFileSize,
  extendToSquare,
  getFileInfoByPath,
  parseSourceFileName,
  getFileIndexMapping,
  genSameImageWithDiffName,
};
