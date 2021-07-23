# 获取 token curl
# curl -i -k 'https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=8sifzjGiCR5bg3l0cVQ7bMjf&client_secret=f4iZXZHbAlVX5yQGt0zvGlFhzxB0fEj6'

# 解析图片文字 curl
# https://cloud.baidu.com/doc/OCR/s/zk3h7xz52
curl -i -k 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=24.250e18f2085a09b7aa81b5d3a9b0adf1.2592000.1628778190.282335-24535627' \
--data 'url=https://76f3604eb759.ngrok.io/%7Bp-%7D%7Btype-ocr%7D%7Bc-%E6%8F%92%E6%8E%92%E6%8F%92%E5%BA%A7%7D%7Bn-%E5%85%AC%E7%89%9B%E5%85%AB%E6%8F%92%E4%BD%8D%E6%8F%92%E5%BA%A7%E6%8E%A5%E7%BA%BF%E6%9D%BF%E6%8B%96%E7%BA%BF%E6%9D%BF%7D.PNG' \
-H 'Content-Type:application/x-www-form-urlencoded'
