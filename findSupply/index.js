// 根据关键词同时打开 1688 淘宝 京东 拼多多

const fs = require('fs');
const shell = require('shelljs');

const keywords = ['乌江涪陵榨菜'];

const get1688EncodedKeyword = async (keyword) => {
  const result = await shell
    .exec(`keyword=${keyword} python3 ./find_supply/get_1688_keywords.py`)
    .stdout.split('\n')[0];

  console.log('result: ', result);
  return result;
};

// 默认使用销量倒序
const get1688Urls = async (k) => {
  // console.log('k: ', k);
  const encodedK = await get1688EncodedKeyword(k);
  const productSearchUrl = `https://s.1688.com/selloffer/offer_search.htm?${encodedK}\\&memberTags=205185\\&sortType=va_rmdarkgmv30\\&descendOrder=true`;
  const companySearchUrl = `https://s.1688.com/company/company_search.htm?${encodedK}\\&memberTags=205185\\&sortType=bookedCount`; // 默认 filter 实力商家并且销量倒序
  // url = 'https://s.1688.com/selloffer/offer_search.htm?'+urllib.parse.urlencode(query)
  return [companySearchUrl, productSearchUrl];
};

const getTaobaoUrls = (k) => {
  // https://s.taobao.com/search?q=%E7%8C%AB%E7%A0%82&imgfile=&commend=all&ssid=s5-e&search_type=item&sourceId=tb.index&spm=a21bo.1000386.201856-taobao-item.1&ie=utf8&initiative_id=tbindexz_20170306&sort=sale-desc
  return [
    `https://s.taobao.com/search?q=${encodeURIComponent(k)}\\&sort=sale-desc`,
  ];
};

const getPDDUrls = (k) => {
  return [`http://yangkeduo.com/search_result.html?search_key=${encodeURIComponent(k)}\\&sort_type=_sales`] 
};

const getJDUrls = (k) => {
  return [`https://search.jd.com/Search?keyword=${encodeURIComponent(k)}\\&psort=3`]
};

const main = async () => {
  const links = [];
  const fns = [get1688Urls, getTaobaoUrls, getJDUrls, getPDDUrls];
  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    for (let p = 0; p < fns.length; p++) {
      const fn = fns[p];
      const urls = await fn(keyword);
      for (let j = 0; j < urls.length; j++) {
        const url = urls[j];
        links.push(url);
      }
    }
  }

  console.log('links: ', links);
  links.forEach(async (link) => await shell.exec(`open ${link}`));
};

main();
