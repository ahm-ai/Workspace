#!/bin/bash


echo "\033[0;32m Splitting a long video \033[0m"

timeStamp=$(date +"%Y-%m-%d_%H-%M")

videoPath=~/Downloads/$timeStamp
mkdir -p $videoPath
ffmpeg -i $1 -c copy -f segment -segment_time 5 -reset_timestamps 1 $videoPath/output%03d.mp4


cd $videoPath

#   List all videos from $videoPath
for file in $videoPath/*.mp4; do
    echo $file
    echo $PSS | sudo -S whisper $file --fp16 False  --model base --language English --beam_size 1
done


captionFileName="caption"

touch $videoPath/$captionFileName.txt
chmod 777 $videoPath/$captionFileName.txt

# List all .txt files and join them into one file
for file in $videoPath/*.txt; do
    echo $file
    cat $file >> $videoPath/$captionFileName.txt
done

touch $videoPath/$captionFileName.srt
chmod 777 $videoPath/$captionFileName.srt

for file in $videoPath/*.srt; do
    echo $file
    cat $file >> $videoPath/$captionFileName.srt
done


echo "\033[0;32m ========= Complete ========= \033[0m"
