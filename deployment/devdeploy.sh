# Install the services
cp ./devsimplicitygql1.service /etc/systemd/system/
cp ./devsimplicitygql2.service /etc/systemd/system/

# Start the services and enable starting after reboot
systemctl start devsimplicitygql1
systemctl enable devsimplicitygql1
systemctl start devsimplicitygql2
systemctl enable devsimplicitygql2

# Install the NGINX configuration file
cp ./devsimplicitygql.conf /etc/nginx/conf.d/
sudo systemctl restart nginx

