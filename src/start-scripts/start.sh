#!/usr/bin/env bash
#stop script on error
set -e

CWD=`pwd`

#install Device SDK for Node.js if not already installed
if [ ! -d ./mqtt-clients ]; then
    printf "\nInstalling Device SDK...\n"
    git clone https://github.com/divyanshg/mqtt-clients.git --recursive
    cd mqtt-clients/node
    npm install

    cd $CWD
fi

#set environment variables
export DIV_CLIENT_ID="65fc78e2d89991a580b78c35"
export DIV_PASSWORD="somekeynew"

#run the Device SDK sample
printf "\nRunning Device SDK sample...\n"
node mqtt-clients/node/index.js