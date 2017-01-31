# Install the services
cp ./simplicitygql1.service /etc/systemd/system/
cp ./simplicitygql2.service /etc/systemd/system/

# Start the services and enable starting after reboot
systemctl start simplicitygql1
systemctl enable simplicitygql1
systemctl start simplicitygql2
systemctl enable simplicitygql2

# Install the NGINX configuration file
cp ./simplicitygql.conf /etc/nginx/conf.d/
sudo systemctl restart nginx

