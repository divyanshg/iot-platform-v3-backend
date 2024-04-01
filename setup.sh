#!/bin/bash

# Navigate to the directory where you want to clone the repository
cd ~

#Setting up CA
mkdir ca
cd ca

echo "Setting up CA Key"
openssl genpkey -algorithm RSA -out root-ca-key.pem -aes256 

echo "Setting up CA Certificate"
openssl req -x509 -new -key root-ca-key.pem -out root-ca-cert.pem

cd ..

# Clone the repository
echo "Cloning the repository"
git clone https://github.com/divyanshg/iot-platform-v3-backend.git
cd iot-platform-v3-backend

# Set environment variables
echo "Setting up environment variables"
export NODE_ENV=production
export PORT=3000


#installing yarn
echo "Installing dependencies"
npm install -g yarn

yarn install

#Generate prisma clients
echo "Generating prisma clients"
yarn generate-db

#Build the project
echo "Building the project"
yarn build

#setting up certificates
echo "Setting up broker certificates"
mkdir certs
cd certs

openssl req -newkey rsa:2048 -nodes -keyout broker-key.pem -out broker-csr.pem

echo "Signing the broker certificate with CA"
openssl x509 -req -in broker-csr.pem -CA ~/ca/root-ca-cert.pem -CAkey ~/ca/root-ca-key.pem -CAcreateserial -out broker-cert.crt -days 365

# Start the server
echo "Starting the server"
pm2 start dist/main.js --name iot-platform-v3-backend

echo "Backend production build setup completed!"
echo "Please setup the env file and restart the server with 'pm2 restart iot-platform-v3-backend' command."
