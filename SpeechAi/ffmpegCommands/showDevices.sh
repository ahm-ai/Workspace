#!/bin/bash

function showDevices(){
    echo "List of devices"  
    ffmpeg -hide_banner -f avfoundation -list_devices true -i ""
}

showDevices