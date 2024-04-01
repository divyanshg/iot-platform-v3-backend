#!/bin/bash

cd ~
echo ""
echo "Updating the system"
sudo apt-get update
sudo apt upgrade -y

echo ""
echo "Installing nodejs"
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

echo ""
echo "Checking nodejs and npm version"
node -v
npm -v

echo ""
echo "Installing yarn, pm2, git, alwaysai"
sudo npm install --global yarn pm2 alwaysai

echo ""
echo "Checking aai version"
aai -v

echo ""
echo "Installing Docker"
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do sudo apt-get remove $pkg; done

sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ""
echo "Validating Docker installation"
sudo docker run hello-world

echo ""
echo "Setting docker to run without sudo"
sudo groupadd docker
sudo usermod -aG docker $USER

newgrp docker

echo ""
echo "Validating Docker installation without sudo"
docker run hello-world

echo ""
echo "Configuring docker to start on boot"
sudo systemctl enable docker.service
sudo systemctl enable containerd.service


echo ""
echo "Cloning the project repository"
git clone https://github.com/divyanshg/iot-claim-device.git
cd iot-claim-device

echo ""
echo "Configuring AlwaysAI"
aai app configure --project 4be57279-51eb-4724-8eaa-7eeacf93c574
aai app install

echo ""
echo "Setting up the environment variables"
echo ""
echo "Enter the value for BROKER_HOST:"
read BROKER_HOST

# Export the variable with the user-provided value
export BROKER_HOST="$BROKER_HOST"
echo "BROKER_HOST set to: $BROKER_HOST"

echo ""
echo "Setting up launch script"

cd ~
launch_content = "#!/bin/bash\n\ncd ~/iot-claim-device\n\nsource venv/bin/activate\n\nsleep 5\n\npython3 launch.py\n"
filename="launch.sh"

echo -e $launch_content > $filename
chmod +x $filename
echo "Launch script created at ~/launch.sh"

echo ""
echo "Starting the launch script"
./launch.sh

echo ""
echo "Setup completed!"