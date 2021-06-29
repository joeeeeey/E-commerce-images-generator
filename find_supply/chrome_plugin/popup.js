// Initialize button with user's preferred color
let donwloadSourceBtn = document.getElementById('donwloadSourceBtn');
let goto1688MainPicListPageBtn = document.getElementById('goto1688MainPicListPageBtn');

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

  // chrome.storage.sync.get("color", ({ color }) => {
  //   document.body.style.backgroundColor = color;
  // });
  if (window.location.origin.includes('taobao')) {
    // document.querySelector('.tm-detail-meta').querySelector('.tb-thumb-warp').querySelectorAll('img')
    // '.mainwrap' '#description' '.content ke-post'
    // 'tm-video-box'  'lib-video' 'source' 'src'
  }

  if (window.location.origin.includes('1688')) {
    let productName = prompt("What's your product name?");
    // const productName = 'my_product';
    console.log('productName: ', productName);
    if (!productName) {
      return;
    }

    let productCategory = null;
    const splitValues = productName.split(' ')
    if (splitValues.length > 1) {

      productName = splitValues[0]
      productCategory = splitValues[1]
    }
    if (window.location.pathname.includes('/pic')) {
      const containers = document
        .getElementsByClassName('tab-nav-container')[0]
        .querySelectorAll('.tab-trigger');
      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        forceDownload(
          container.querySelector('img').src,
          `{p-1688}{type-main}{c-${productCategory}}{n-${productName}}end-ec${i}.jpg`
        );
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

      // donwload descriptiob
      const desContainer = document.querySelector('.desc-lazyload-container');
      imgEles = [];
      const imgs = desContainer.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const element = imgs[i];

        console.log(
          'element.parentNode.tagName: ',
          element.parentNode.tagName,
          i
        );
        if (
          element.parentNode.tagName !== 'A' &&
          element.parentNode.tagName !== 'TD'
        ) {
          imgEles.push(element);
        }
      }

      imgEles.forEach((ele, i) => {
        console.log('ele.src: ', ele.src);
        forceDownload(ele.src, `{p-1688}{type-description}{c-${productCategory}}{n-${productName}}end-ec${i}.jpg`);
      });
    }
  }
};

const handleGoto1688MainPicPage = () => {
  if (window.location.origin.includes('1688')) {
    if (window.location.pathname.includes('/offer')) {
      console.log('xixixi');
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
