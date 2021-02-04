Prepare dependences after clone:

$ git submodule update --recursive --init
$ cd js/external/jquery/
$ npm install
$ npm install grunt-cli
$ ./node_modules/.bin/grunt --force

Run VTVLsim:

$ python -m http.server 8888
$ chromium http://127.0.0.1:8888

