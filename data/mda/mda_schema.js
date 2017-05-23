const types = `
  type MDA_Address {
    # Objectid: Unique integer ID generated for ArcGIS. Don't trust this.
    objectid: Int
    # X: GPS X coordinate location of the address.
    x: Float
    # Y: GPS Y coordinate location of the address.
    y: Float
    # Address: TBD
    address: String!
    # Number: TBD
    number: Int
    # Apt: TBD
    apt: String
    # Prefix: TBD
    prefix: String
    # Street Name: TBD
    street_name: String
    # Street Type: TBD
    street_type: String
    # Postdirection: TBD
    postdirection: String
    # Civic Address Id: Primary address ID used by the City.
    civicaddress_id: ID!
    # Location Type: TBD
    location_type: Int
    # Change Date: TBD
    change_date: String
    # City: TBD
    city: String
    # Zipcode: TBD
    zipcode: Int
    # Maximo Type: TBD
    maximo_type: String
    # Maximo Seq Num: TBD
    maximo_seq_num: Int
    # Asset Code: TBD
    asset_code: String
    # Mrc: TBD
    mrc: String
    # Pinnum: TBD
    pinnum: ID!
    # Truckday: TBD
    truckday: String
    # Accelaid: TBD
    accelaid: String
    # Centerline ID: TBD
    centerline_id: Float
    # Location Id: TBD
    location_id: Float
    # Parent Location Id: TBD
    parent_location_id: Float
  }
  type MDA_Permits {
    # Objectid: TBD
    objectid: Int
    # Record Id: TBD
    record_id: ID!
    # Record Name: TBD
    record_name: String
    # Date Opened: TBD
    date_opened: String
    # Record Module: TBD
    record_module: String
    # Record Status: TBD
    record_status: String
    # Record Status Date: TBD
    record_status_date: String
    # Record Type: TBD
    record_type: String
    # Address: TBD
    address: String
    # Balance Due: TBD
    balance_due: Float
    # Date Assigned: TBD
    date_assigned: String
    # Date Closed: TBD
    date_closed: String
    # Date Completed: TBD
    date_completed: String
    # Date Statused: TBD
    date_statused: String
    # Description: TBD
    description: String
    # Job Value: TBD
    job_value: Float
    # Record Type Group: TBD
    record_type_group: String
    # Record Type Category: TBD
    record_type_category: String
    # Record Type Type: TBD
    record_type_type: String
    # Record Type Subtype: TBD
    record_type_subtype: String
    # Short Notes: TBD
    short_notes: String
    # Status: TBD
    status: String
    # Apn: TBD
    apn: String
    # Parcel Number: TBD
    parcel_number: String
    # License Number: TBD
    license_number: String
    # Business Name: TBD
    business_name: String
    # Record Comments: TBD
    record_comments: String
  }
  type MDA_Property {
    # Objectid: TBD
    objectid: Int
    # Pinnum: TBD
    pinnum: String
    # Pin: TBD
    pin: ID!
    # Pinext: TBD
    pinext: String
    # Owner: TBD
    owner: String
    # Nmptype: TBD
    nmptype: String
    # Taxyear: TBD
    taxyear: String
    # Condounit: TBD
    condounit: String
    # Condobuilding: TBD
    condobuilding: String
    # Deedbook: TBD
    deedbook: String
    # Deedpage: TBD
    deedpage: String
    # Platbook: TBD
    platbook: String
    # Platpage: TBD
    platpage: String
    # Subname: TBD
    subname: String
    # Sublot: TBD
    sublot: String
    # Subblock: TBD
    subblock: String
    # Subsect: TBD
    subsect: String
    # Updatedate: TBD
    updatedate: String
    # Housenumber: TBD
    housenumber: String
    # Numbersuffix: TBD
    numbersuffix: String
    # Direction: TBD
    direction: String
    # Streetname: TBD
    streetname: String
    # Streettype: TBD
    streettype: String
    # Township: TBD
    township: String
    # Acreage: TBD
    acreage: Float
    # Accountnumber: TBD
    accountnumber: String
    # Deeddate: TBD
    deeddate: String
    # Stamps: TBD
    stamps: Float
    # Instrument: TBD
    instrument: String
    # Reason: TBD
    reason: String
    # County: TBD
    county: String
    # City: TBD
    city: String
    # Firedistrict: TBD
    firedistrict: String
    # Schooldistrict: TBD
    schooldistrict: String
    # Careof: TBD
    careof: String
    # Address: TBD
    address: String
    # Cityname: TBD
    cityname: String
    # State: TBD
    state: String
    # Zipcode: TBD
    zipcode: String
    # Class: TBD
    class: String
    # Improved: TBD
    improved: String
    # Exempt: TBD
    exempt: String
    # Priced: TBD
    priced: String
    # Totalmarketvalue: TBD
    totalmarketvalue: Float
    # Appraisedvalue: TBD
    appraisedvalue: Float
    # Taxvalue: TBD
    taxvalue: Float
    # Landuse: TBD
    landuse: String
    # Neighborhoodcode: TBD
    neighborhoodcode: String
    # Landvalue: TBD
    landvalue: Float
    # Buildingvalue: TBD
    buildingvalue: Float
    # Improvementvalue: TBD
    improvementvalue: Float
    # Appraisalarea: TBD
    appraisalarea: String
    # State Route: TBD
    state_route: String
    # State Route Suffix: TBD
    state_route_suffix: String
    # Propcard: TBD
    propcard: String
    # Oldpinnum: TBD
    oldpinnum: String
    # Citystatezip: TBD
    citystatezip: String
    # Deedurl: TBD
    deedurl: String
    # Platurl: TBD
    platurl: String
  }

  extend type Query {
    # Address master table maintained by _Buncombe County_ and _City of Asheville_
    mda_address( id: ID!, name: String ): MDA_Address
    # Property table maintained by _Buncombe County_ and _City of Asheville_
    mda_permits( id: ID!, name: String ): MDA_Permits
    # Property table maintained by _Buncombe County_ and _City of Asheville_
    mda_property( id: ID!, name: String ): MDA_Property    
  }
`;
module.exports = types;
