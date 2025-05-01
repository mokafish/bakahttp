# export http_proxy=socks5://127.0.0.1:9050
# export https_proxy=socks5://127.0.0.1:9050

bakahttp -c 8 -d 2-3 \
    -H x-app-key:abcdef1234567890a -H x-app-name:apple \
    -C cookies.txt \
    'http://localhost:850/search/?id={}&cat={}' 5-10 aaa,bbb,ccc

  
  




