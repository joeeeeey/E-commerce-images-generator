
const shell = require('shelljs');

mapping = {
  '公牛GN-103D无线一插位插座接线板16A4000W_个':   '公牛GN_103D无线一插位插座接线板16A4000W_个',
  '公牛USB插座排插有线1.5米开关GNV-UUA124_个':   '公牛USB插座排插有线1.5米开关GNV_UUA124_个',
  '公牛USB插座排插有线1.5米开关GNV-UUA122_个':   '公牛USB插座排插有线1.5米开关GNV_UUA122_个',
  '公牛三插位无线无开关黄色锤型GN-C221X_个':   '公牛三插位无线无开关黄色锤型GN_C221X_个',
  '公牛三芯电源线带插头1.5米10A2500WGNT-10BS_个':   '公牛三芯电源线带插头1.5米10A2500WGNT_10BS_个',
  '公牛电工胶布9米黑色耐高温防阻燃绝缘胶带GN-ET6_个':   '公牛电工胶布9米黑色耐高温防阻燃绝缘胶带GN_ET6_个',
  '公牛电工胶布18米黑色耐高温防阻燃绝缘胶带GN-ET6_个':   '公牛电工胶布18米黑色耐高温防阻燃绝缘胶带GN_ET6_个',
}


const main = async () => {
  const files = (await shell.exec(`ls /Users/joeeey/Downloads`).stdout)
  .split('\n')
  .filter((x) => !!x);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    keys = Object.keys(mapping)
    for (let j = 0; j < keys.length; j++) {
      const key = keys[j];
      if (file.includes(key)) {
        const newFile = file.replace(key, mapping[key])
        console.log('newFile: ', newFile);
        await shell.exec(`mv /Users/joeeey/Downloads/${file} /Users/joeeey/Downloads/${newFile}`)
      }
    }
  }
}

main()