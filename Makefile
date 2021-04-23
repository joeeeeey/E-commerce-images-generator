# API_KEYS
# d8EixPRE1hhobPptBHKse3aZ WwXJNXnEFmotVYjGPntqc2r1 QLAP2FtKMnMu43XBAFeyb4o7

start:
	API_KEY=WwXJNXnEFmotVYjGPntqc2r1 node index.js
	# API_KEY=QLAP2FtKMnMu43XBAFeyb4o7 node index.js

resize_no_bg_image:
	isNoBgFile=true node index.js

resize_taobao_image:
	isFromTB=true node index.js

create_meituan_xls:
	make -C meituan create_meituan_xls