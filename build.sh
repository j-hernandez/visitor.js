#!/bin/bash
IN=`cat visitor.js`
OUT=visitor.min.js

cat > $OUT <<"EOF"
/**
 * Visitor.js 0.1
 * (c) 2012 Jonas Hermsmeier
 * For details, see: https://github.com/jhermsmeier/visitor.js
 * Licensed under the MIT license.
 */
EOF

curl -s \
  -d compilation_level=SIMPLE_OPTIMIZATIONS \
  -d output_format=text \
  -d output_info=compiled_code \
  --data-urlencode "js_code=${IN}" \
  http://closure-compiler.appspot.com/compile \
  >> $OUT