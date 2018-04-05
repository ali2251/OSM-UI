#!/bin/bash

# 
#   Copyright 2017 RIFT.IO Inc
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#

abort()
{
    echo >&2 '
***************
*** ABORTED ***
***************
'
    echo "An error occurred. Exiting..." >&2
    exit 1
}

trap 'abort' 0

set -e

# Add your script below....
# If an error occurs, the abort() function will be called.
#----------------------------------------------------------
CMAKE_BUILD=true

# change to the directory of this script
cd $PLUGIN_DIR
cd ..

echo 'Building plugin '$PLUGIN_NAME
echo 'Fetching third-party node_modules for '$PLUGIN_NAME
npm install
echo 'Fetching third-party node_modules for '$PLUGIN_NAME'...done'
echo 'Packaging '$PLUGIN_NAME' using webpack'
ui_plugin_cmake_build=$CMAKE_BUILD ./node_modules/.bin/webpack --optimize-minimize --progress --config webpack.production.config.js --bail
echo 'Packaging '$PLUGIN_NAME' using webpack... done'
echo 'Packaging debug version of '$PLUGIN_NAME' using webpack'
ui_plugin_cmake_build=$CMAKE_BUILD ./node_modules/.bin/webpack --progress --config webpack.production.config.js --production-debug --bail
echo 'Packaging '$PLUGIN_NAME' using webpack... done'
echo 'Building plugin '$PLUGIN_NAME'... done'
# Done!
trap : 0

echo >&2 '
************
*** DONE *** 
************
'