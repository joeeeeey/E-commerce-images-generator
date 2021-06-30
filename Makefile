# API_KEYS
# d8EixPRE1hhobPptBHKse3aZ WwXJNXnEFmotVYjGPntqc2r1 QLAP2FtKMnMu43XBAFeyb4o7

start:
	API_KEY=WwXJNXnEFmotVYjGPntqc2r1 node index.js
	# API_KEY=QLAP2FtKMnMu43XBAFeyb4o7 node index.js

# TODO remove this, because it will auto resize
resize_no_bg_image:
	isNoBgFile=true node index.js

# TODO remove this, because it will auto check taobao or other
resize_taobao_image:
	isFromTB=true node index.js

create_meituan_xls:
	make -C meituan create_meituan_xls

create_eleme_xls:
	make -C eleme create_ele_xls

merge_new_json_products:
	node mergeNewProduct.js

find_supply_by_website:
	node find_supply/index.js