#!/bin/bash

# function recordInSegments(){
    videoPath=~/Downloads/$1
    mkdir -p $videoPath
    # 1:0 Speakers
    # 1:1 Airpods
    echo $PSS | sudo -S  ffmpeg -y -f avfoundation -i "1:0" -async 2 -vsync 2 -r 60 -aq 0  -f segment -segment_time $2 -reset_timestamps 1 $videoPath/output%03d.mp4
# }

# recordInSegments
