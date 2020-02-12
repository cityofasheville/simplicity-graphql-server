FROM node:10


# Create app directory
WORKDIR /opt

ARG dbhost
ARG dbuser
ARG dbpassword
ARG database
ARG debugging
ARG firebase_service_account
ARG firebase_db_url
ARG port

ENV dbhost=$dbport
ENV dbuser=$dbuser
ENV dbpassword=$dbpassword
ENV database=$database
ENV debugging=$debugging
ENV firebase_service_account=$firebase_service_account
ENV firebase_db_url=$irebase_db_url

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE $port

ENTRYPOINT [ "npm", "start" ]

