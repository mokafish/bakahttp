# export http_proxy=socks5://127.0.0.1:9050
# export https_proxy=socks5://127.0.0.1:9050

bakahttp -c 8 --proxy socks5://127.0.0.1:9050 \
    http://httpbin.org/delay/{} 5-10
  




