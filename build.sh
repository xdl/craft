#!/bin/bash

# Runs craft.js on the test source

pushd ~/dev/craft && node craft.js test/test_src test/test_dst http://localhost && popd
