#!/bin/bash

export KYOTO_SHARED_LIBRARY=$(dirname `locate -l 1 libkyotocabinet.a` 2> /dev/null)
export KYOTO_INCLUDE_DIR=$(dirname `locate -l 1 kchashdb.h` 2> /dev/null)
export BOOST_INCLUDE_DIR=$(dirname `locate -l 1 /libboost_iostreams.a` 2> /dev/null)

echo $KYOTO_SHARED_LIBRARY
echo $BOOST_INCLUDE_DIR
echo $KYOTO_INCLUDE_DIR
