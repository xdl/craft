#!/bin/bash

# Runs craft.js on the test source

pushd ~/dev/craft && sudo node craft.js ~/dev/craft/test/test_src ~/dev/craft/test/test_dst http://localhost && popd
