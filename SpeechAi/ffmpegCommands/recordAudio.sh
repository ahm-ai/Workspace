#!/bin/bash

function recordAudio(){
    if [ -z "$1" ]
    then
        echo "RECORDING"
        ffmpeg -y -f avfoundation -i ":0" -t 60 output2.mp3 
    else
        echo "START RECORDING IN $1 SECONDS"
        ffmpeg -f avfoundation -i ":0" -f segment -segment_time 5 -reset_timestamps 1 output%03d.mp3
    fi
}
