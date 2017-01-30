# Deploying the Simplicity GraphQL Server

These instructions are to run the SimpliCity GraphQL server behind an NGINX proxy server. For the time
being we're running two node services, but it's possible to run more.

To deploy, simply run 
````
  cd deployment
  sudo ./deploy.sh
````

To update from Github and redeploy, run:

````
  git pull
  sudo systemctl restart simplicitygql1
  sudo systemctl restart simplicitygql2
````

To see the status of the node services, run ````sudo systemctl status simplicitygql1```` 
or ````sudo journalctl -u simplicitygql1````.

