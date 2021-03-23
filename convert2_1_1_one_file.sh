# /bin/zsh

# 得出 width heigh
echo "FILE_PATH is: ${FILE_PATH}"
echo "NEW_SQUARE_FILE_NAME is: ${NEW_SQUARE_FILE_NAME}"

size=`identify -format '%w %h' $FILE_PATH`

# if [[  ]]; then

# fi

# 用 python 脚本找出更长的一边 这边写死了 1000 以防图片太小过不了美团的审核
bigger_side=$(python3 -c "import pprint; print(max([int(x) for x in '$size'.split(' ')]))")
bigger_side=1000

echo "bigger_side is: ${bigger_side}"
# 将图片周围留白
convert ${FILE_PATH} -resize ${bigger_side}x${bigger_side} -gravity center -background white -extent ${bigger_side}x${bigger_side} ${NEW_SQUARE_FILE_NAME}

