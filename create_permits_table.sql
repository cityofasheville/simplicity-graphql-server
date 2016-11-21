DROP TABLE IF EXISTS permits;
CREATE TABLE permits
(
  id serial NOT NULL,
  permit_id varchar(10),
  type varchar(64),
  subtype varchar(64),
  category varchar(64),
  app_date timestamp,
  app_status varchar(40),
  app_status_date timestamp,
  trips smallint,
  violation boolean,
  violation_count smallint,
  violation_days smallint,
  sla smallint,
  building smallint,
  fire smallint,
  zoning smallint,
  addressing smallint,
  CONSTRAINT permit_pkey PRIMARY KEY (id)
);
CREATE INDEX ON permits (lower(permit_id));
CREATE INDEX ON permits (app_date);
\COPY permits(permit_id, type, subtype, category, app_date, app_status, app_status_date, trips, violation, violation_count, violation_days, sla, building, fire, zoning, addressing) FROM '/Users/ericjackson/Google Drive/Projects/Permitting/DSD_Dashboard_Data/t_permits.csv' DELIMITER E',' CSV HEADER;
