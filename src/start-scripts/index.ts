export function nodeScript(client_id, password) {
  return `#!/usr/bin/env bash
  #stop script on error
  set -e
  
  CWD="$(pwd)"
  
  #install Device SDK for Node.js if not already installed
  if [ ! -d ./mqtt-clients ]; then
      printf "\nInstalling Device SDK...\n"
      git clone https://github.com/divyanshg/mqtt-clients.git --recursive
      cd mqtt-clients/node
      npm install
  
      cd $CWD
  fi
  
  #set environment variables
  export DIV_CLIENT_ID="${client_id}"
  export DIV_PASSWORD="${password}"
  
  #run the Device SDK sample
  printf "\nRunning Device SDK sample...\n"
  node mqtt-clients/node/index.js`;
}
