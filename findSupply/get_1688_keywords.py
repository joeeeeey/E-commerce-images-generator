# import urllib
# import chardet
import urllib.parse
import os


def main():
    keyword = os.environ.get('keyword')

    if not keyword:
        return

    encoded_key_word=keyword.encode('gbk')

    query={
        'keywords': encoded_key_word,
    }

    # url = 'https://s.1688.com/selloffer/offer_search.htm?'+urllib.parse.urlencode(query)

    # https://s.1688.com/company/company_search.htm?keywords=%C3%A8%C9%B0&memberTags=205185&sortType=bookedCount

    print(urllib.parse.urlencode(query))
    return urllib.parse.urlencode(query)

if __name__ == '__main__':
    main()