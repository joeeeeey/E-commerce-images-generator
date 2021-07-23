// Initialize button with user's preferred color
let donwloadSourceBtn = document.getElementById('donwloadSourceBtn');
let goto1688MainPicListPageBtn = document.getElementById(
  'goto1688MainPicListPageBtn'
);

// TODO
// 在美团上用 http 接口调用 api 唤醒 macos 系统
// // 美团 detail 获得商品名称
// document.querySelectorAll('.product-name')[0].getAttribute('value')

// // 美团选择图片
// document.querySelector('.imgs-select-label').click()

// chrome.storage.sync.get("color", ({ color }) => {
//   donwloadSourceBtn.style.backgroundColor = color;
// });

// The body of this function will be executed as a content script inside the
// current page
const handleDownloadResource = () => {
  const forceDownload = (url, fileName) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function () {
      const urlCreator = window.URL || window.webkitURL;
      const link = document.createElement('a');
      link.href = urlCreator.createObjectURL(this.response);
      link.download = fileName;
      link.click();
    };
    xhr.send();
  };

  const downloadObjectAsJsonFile = (obj, fileName) => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(obj, undefined, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `${fileName}.json`);
    a.click();
  };

  // 淘宝操作，下载主图和描述图都在同一个页面, 不同类别需要选中相应的主图
  if (window.location.origin.includes('taobao')) {
    let productName = prompt("What's your product name?");
    if (!productName) {
      return;
    }

    let productCategory = null;
    const splitValues = productName.split(' ');
    if (splitValues.length > 1) {
      productName = splitValues[0];
      productCategory = splitValues[1];
    }
    if (!productCategory) {
      alert('productCategory is null!');
      return;
    }
    const mainImageUrl = document
      .querySelector('.tb-main-pic')
      .querySelector('img')
      .src.replace('400x400', '800x800');
    setTimeout(() => {
      forceDownload(
        mainImageUrl,
        `{p-taobao}{type-main}{c-${productCategory}}{n-${productName}}end-ec0.jpg`
      );
    }, Math.random() * 2000);

    // const videoUrl = document.querySelector('.lib-video video source').src
    // forceDownload(
    //   videoUrl,
    //   `{p-taobao}{type-description}{c-${productCategory}}{n-${productName}}end.mp4`
    // );

    const desImgs = document
      .querySelector('#description')
      .querySelectorAll('img');
    let imgEles = [];
    for (let i = 0; i < desImgs.length; i++) {
      const element = desImgs[i];

      if (!element.attributes['data-ks-lazyload']) {
        imgEles.push(element);
      }
    }
    imgEles.forEach(async (ele, i) => {
      // console.log('ele.src: ', ele.src);
      setTimeout(() => {
        console.log('ele.src: ', ele.src);
        forceDownload(
          ele.src,
          `{p-taobao}{type-description}{c-${productCategory}}{n-${productName}}end-ec${i}.jpg`
        );
      }, Math.random() * 6000);
    });

    // Get the price and product url
    try {
      // 目前通过这个节点能取到 1688 的价格，但稳妥的方式是在页面上选择一下商品
      // price 为我们的成本 => cost
      const price = document.querySelector('.tb-rmb-num').innerText;
      const productUrl = window.location.href
      if (price || productUrl) {
        downloadObjectAsJsonFile(
          {
            productUrl,
            cost: price,
          },
          productName
        );
      }
    } catch (error) {
      alert(`Get price error: ${error.toString()}`);
    }
  }


  // 天猫操作，与淘宝类似
  if (window.location.origin.includes('tmall')) {
    let productName = prompt("What's your product name?");
    if (!productName) {
      return;
    }

    let productCategory = null;
    const splitValues = productName.split(' ');
    if (splitValues.length > 1) {
      productName = splitValues[0];
      productCategory = splitValues[1];
    }
    if (!productCategory) {
      alert('productCategory is null!');
      return;
    }

    const mainImageUrl = document
      .querySelector('.tb-booth img')
      .src.replace('430x430', '800x800');
    setTimeout(() => {
      forceDownload(
        mainImageUrl,
        `{p-tmall}{type-main}{c-${productCategory}}{n-${productName}}end-ec0.jpg`
      );
    }, Math.random() * 2000);

    document.querySelector('.tb-booth img').src

    // Get the price and product url
    try {
      // 目前通过这个节点能取到 tmall 的价格，但稳妥的方式是在页面上选择一下商品
      // price 为我们的成本 => cost
      const price = document.querySelector('.tm-price').innerText;
      const productUrl = window.location.href
      if (price || productUrl) {
        downloadObjectAsJsonFile(
          {
            productUrl,
            cost: price,
          },
          productName
        );
      }
    } catch (error) {
      alert(`Get price error: ${error.toString()}`);
    }
  }



  if (window.location.origin.includes('1688')) {
    let productName = prompt("What's your product name?");
    if (!productName) {
      return;
    }

    let productCategory = null;
    const splitValues = productName.split(' ');
    if (splitValues.length > 1) {
      productName = splitValues[0];
      productCategory = splitValues[1];
    }
    if (!productCategory) {
      alert('productCategory is null!');
      return;
    }
    if (window.location.pathname.includes('/pic')) {
      const containers = document
        .getElementsByClassName('tab-nav-container')[0]
        .querySelectorAll('.tab-trigger');
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        setTimeout(() => {
          forceDownload(
            container.querySelector('img').src,
            `{p-1688}{type-main}{c-${productCategory}}{n-${productName}}end-ec${i}.jpg`
          );
        }, Math.random() * 6000);
      }
    }

    if (window.location.pathname.includes('/offer')) {
      // download video
      const videoContainer = document.querySelector('.video-content');
      if (videoContainer) {
        const videoUrl = videoContainer
          .querySelector('video')
          .querySelector('source').src;
        forceDownload(
          videoUrl.replace('http://', 'https://'),
          `{p-1688}{type-description}{c-${productCategory}}{n-${productName}}end.mp4`
        );
      }

      // donwload description
      const desContainer = document.querySelector('.desc-lazyload-container');
      imgEles = [];
      const imgs = desContainer.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const element = imgs[i];

        if (
          element.parentNode.tagName !== 'A' &&
          element.parentNode.tagName !== 'TD'
        ) {
          imgEles.push(element);
        }
      }

      imgEles.forEach(async (ele, i) => {
        // console.log('ele.src: ', ele.src);

        setTimeout(() => {
          console.log('ele.src: ', ele.src);
          forceDownload(
            ele.src,
            `{p-1688}{type-description}{c-${productCategory}}{n-${productName}}end-ec${i}.jpg`
          );
        }, Math.random() * 6000);
      });

      // Get the price and product url
      try {
        // 目前通过这个节点能取到1688的价格，但稳妥的方式是在页面上选择一下商品
        // price 为我们的成本 => cost
        const price = document
          .querySelectorAll('.obj-sku')[0]
          .querySelectorAll('.table-sku')[0]
          .querySelectorAll('.price')[0]
          .querySelector('.value').innerText;
        const productUrl = window.location.origin + window.location.pathname;
        if (price || productUrl) {
          downloadObjectAsJsonFile(
            {
              productUrl,
              cost: price,
            },
            productName
          );
        }
      } catch (error) {
        alert(`Get price error: ${error.toString()}`);
      }
    }
  }
};

const handleGoto1688MainPicPage = () => {
  if (window.location.origin.includes('1688')) {
    if (window.location.pathname.includes('/offer')) {
      // https://detail.1688.com/offer/616657133265.html?spm=a26352.13672862.offerlist.8.566913cfgkOJWt
      const productId = window.location.pathname
        .split('/offer/')[1]
        .split('.html')[0];
      console.log('productId: ', productId);
      // https://detail.1688.com/pic/620669764450.html
      const url = `https://detail.1688.com/pic/${productId}.html`;
      window.open(url, '_blank');
    } else {
      alert('pathname not includes /offer');
    }
  } else {
    alert('pathname not includes 1688');
  }
};

// const getCookies = () => {
//   var cookies = document.cookie.split(';');
//   var ret = '';
//   for (var i = 1; i <= cookies.length; i++) {
//       ret += i + ' - ' + cookies[i - 1] + "<br>";
//   }
//   return ret;
// }

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
};

// 导出饿了么商品
const exportELEProducts = () => {
  const ebToken = getCookie('WMSTOKEN');

  fetch(
    'https://mtop.ele.me/h5/mtop.ele.newretail.itemjob.create/1.0?jsv=2.6.1&appKey=12574478&t=1625207649192&sign=33850aefb1c5decc758b826aa6054642&api=mtop.ele.newretail.itemJob.create&v=1.0&type=json&dataType=json&valueType=string',
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        accept: 'application/json',
        'x-ele-eb-token': `${ebToken};${ebToken}`,
        'content-type': 'application/x-www-form-urlencoded',
        'x-ele-platform': 'eb',
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        // 'Set-Cookie': document.cookie,
        // "WMUSS=${ebToken}; WMSTOKEN=${ebToken}; OUTER_AUTH_LOGIN=${ebToken}%3B${ebToken}; cna=tXxkGXcov2cCAT2qh4nsvPM6; _m_h5_tk=edeb9fe6a9ea1b9ac3be03b075a7efb3_1625212900546; _m_h5_tk_enc=4e7e229b9916d5a9bf2dda1663af3b28; xlly_s=1; EGG_SESS=E8JLyvyH2YhLC4z2MSK64VHJVPAVNs5Xo4EKRs13lLA3VqH_eBFkYpLio-qtN92J; tfstk=coPcBu4wv0tQ6tDudsGbokcKjbpca1YrDlrba5aygoRtUKVSusqyUpRrbTmum5p1.; l=eBO-4MF7j9XVD4HQBO5Cnurza77TrIdb8sPzaNbMiInca6GPesG0dNCBLktpDdtx_t5VnetrnrEgPREpPJzLSxMk2k2yLb1rGwJM8e1..; isg=BLCw9o-BpG3VrHhp-aOz2EwegXgC-ZRD2L6gJaoAsIv3ZVEPUg13074XvGUFdUwb'",
      },
      body: {
        data: '%7B%22jobType%22%3A%22ITEM_EXPORT%22%2C%22jobKey%22%3A%22store_524915311%22%2C%22ext%22%3A%22%7B%5C%22sellerId%5C%22%3A%5C%222210984392918%5C%22%2C%5C%22storeId%5C%22%3A%5C%22524915311%5C%22%7D%22%7D',
      },
    }
  )
    .then((response) => {
      console.log(response.json().then((res) => console.log(res)));
    })
    .catch((err) => {
      console.error(err);
    });
};

donwloadSourceBtn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: handleDownloadResource,
  });
});

goto1688MainPicListPageBtn.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: handleGoto1688MainPicPage,
  });
});
