Prepare dependences after clone:

$ git submodule init
$ git submodule update
$ cd js/external/jquery/
$ npm install
$ npm install grunt-cli
$ ./node_modules/.bin/grunt

Run VTVLsim:

$ python2 -m SimpleHTTPServer
$ chromium http://127.0.0.1:8000

