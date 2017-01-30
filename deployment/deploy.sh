# Install the services
cp ./simplicitygql1.service /etc/systemd/system/

# Start the services and enable starting after reboot
systemctl start simplicitygql1
systemctl enable simplicitygql1

# Install the NGINX configuration file
cp ./simplicitygql.conf /etc/nginx/conf.d/
sudo systemctl restart nginx

