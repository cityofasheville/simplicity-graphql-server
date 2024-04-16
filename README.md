# SimpliCity II GraphQL Server

# THIS IS THE FINAL VERSION ON web-app-api-server
GraphQL Server for the new SimpliCity II system

## Installation

Clone the repository and run `npm install`

```
git clone git@github.com:cityofasheville/simplicity-graphql-server.git
cd simplicity-graphql-server
npm install
```

## Starting the server

```
npm start
```

The server will run on port 8080. You can change this by editing `server.js`.

View the graphql data at http://localhost:8080/graphql

## Uploading data

For the demo we need to upload a couple CSV files to the database, one for permits and one for review trips. Once the CSV files are prepared, edit the paths in create_permits_table.sql and create_trips_table.sql and run the following commands:

  psql -h {database-host} -d {database-name} -U {database-user} -W -f create_permits_table
  psql -h {database-host} -d {database-name} -U {database-user} -W -f create_trips_table

## Acknowledgements
Based on the Apollo [Hello World](https://github.com/apollostack/frontpage-server) example server.
