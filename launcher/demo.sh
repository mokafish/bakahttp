export http_proxy=socks5://127.0.0.1:9050
export https_proxy=socks5://127.0.0.1:9050
export no_proxy=localhost,127.0.0.1

# bakanoko --no-sandbox --disable-gpu --disable-software-rasterizer --headless \
#   --user-data-dir=/tmp/bakacache \
#   --disk-cache-dir=/tmp/bakacache \
#   --disk-cache-size=1000000000 \
#   --proxy-server=socks5://localhost:9050 \
#   --proxy-bypass-list="localhost" \
#   "$@"

bakahttp -c 8 --proxy socks5://127.0.0.1:9050 
  




