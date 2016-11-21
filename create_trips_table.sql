DROP TABLE IF EXISTS permit_trips;
CREATE TABLE permit_trips
(
  id serial NOT NULL,
  permit_id varchar(10),
  type varchar(64),
  subtype varchar(64),
  category varchar(64),
  app_date timestamp,
  app_status varchar(40),
  app_status_date timestamp,
  trip smallint,
  start_date timestamp,
  end_date timestamp,
  due_date timestamp,
  violation_days smallint,
  sla smallint,
  division varchar(40),
  CONSTRAINT permit_trips_pkey PRIMARY KEY (id)
);
CREATE INDEX ON permit_trips (lower(permit_id));
CREATE INDEX ON permit_trips (app_date);
\COPY permit_trips(permit_id, type, subtype, category, app_date, app_status, app_status_date, trip, start_date, end_date, due_date, violation_days, sla, division) FROM '/Users/ericjackson/Google Drive/Projects/Permitting/DSD_Dashboard_Data/t_trips.csv' DELIMITER E',' CSV HEADER;
