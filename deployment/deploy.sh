# Add the services
cp ./simplicitygql1.service /etc/systemd/system/
cp ./simplicitygql1.service /etc/systemd/system/

# Start the services and enable starting after reboot
systemctl start simplicitygql1
systemctl start simplicitygql2
systemctl enable simplicitygql1
systemctl enable simplicitygql2


