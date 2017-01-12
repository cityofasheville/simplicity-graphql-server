const types = `
  type MDA_Address {
    # Objectid: Unique integer ID generated for ArcGIS. Don't trust this.
    objectid: Int
    # Civic Address Id: Primary address ID used by the City.
    civicaddress_id: ID!
    # Address X: GPS X coordinate location of the address.
    address_x: Float
    # Address Y: GPS Y coordinate location of the address.
    address_y: Float
    # Full Address: TBD
    address_full: String!
    # Address Number: TBD
    address_number: Int
    # Address Apt: TBD
    address_apt: String
    # Address Street Prefix: TBD
    address_street_prefix: String
    # Address Street Name: TBD
    address_street_name: String
    # Address Street Type: TBD
    address_street_type: String
    # Address Street Postdirection: TBD
    address_street_postdirection: String
    # Address City: TBD
    address_city: String
    # Address Commcode: TBD
    address_commcode: String
    # Address Zipcode: TBD
    address_zipcode: Int
    # Location Type: TBD
    location_type: Int
    # Address Change Date: TBD
    address_change_date: String
    # Maximo Type: TBD
    maximo_type: String
    # Maximo Seq Num: TBD
    maximo_seq_num: Int
    # Asset Code: TBD
    asset_code: String
    # Mrc: TBD
    mrc: String
    # Water District: TBD
    water_district: String
    # Trash Pickup Day: TBD
    trash_pickup_day: String
    # Jurisdiction Type: TBD
    jurisdiction_type: String
    # Accelaid: TBD
    accelaid: String
    # Centerline ID: TBD
    centerline_id: Int
    # Location Id: TBD
    location_id: Int
    # Parent Location Id: TBD
    parent_location_id: Int
    # Property Pinnum: TBD
    property_pinnum: String
    # Pin: TBD
    property_pin: ID!
    # Property Pinext: TBD
    property_pinext: String
    # Property Nmptype: TBD
    property_nmptype: String
    # Property Oldpinnum: TBD
    property_oldpinnum: String
    # Property Update Date: TBD
    property_update_date: String
    # Property Update Reason: TBD
    property_update_reason: String
    # Property Deeddate: TBD
    property_deeddate: String
    # Property Taxyear: TBD
    property_taxyear: String
    # Property Deedurl: TBD
    property_deedurl: String
    # Property Platurl: TBD
    property_platurl: String
    # Property Propcardurl: TBD
    property_propcardurl: String
    # Property Acreage: TBD
    property_acreage: Float
    # Property Class: TBD
    property_class: String
    # Property Improved: TBD
    property_improved: String
    # Property Exempt: TBD
    property_exempt: String
    # Property Priced: TBD
    property_priced: String
    # Property Totalmarketvalue: TBD
    property_totalmarketvalue: Float
    # Property Appraisedvalue: TBD
    property_appraisedvalue: Float
    # Property Taxvalue: TBD
    property_taxvalue: Float
    # Property Landuse: TBD
    property_landuse: String
    # Property Neighborhoodcode: TBD
    property_neighborhoodcode: String
    # Property Landvalue: TBD
    property_landvalue: Float
    # Property Buildingvalue: TBD
    property_buildingvalue: Float
    # Property Improvementvalue: TBD
    property_improvementvalue: Float
    # Property Appraisalarea: TBD
    property_appraisalarea: String
    # Property Condounit: TBD
    property_condounit: String
    # Property Condobuilding: TBD
    property_condobuilding: String
    # Property Subname: TBD
    property_subname: String
    # Property Sublot: TBD
    property_sublot: String
    # Property Subblock: TBD
    property_subblock: String
    # Property Subsect: TBD
    property_subsect: String
    # Property Township: TBD
    property_township: String
    # Property Stamps: TBD
    property_stamps: Float
    # Property Instrument: TBD
    property_instrument: String
    # Property Firedistrict: TBD
    property_firedistrict: String
    # Property Schooldistrict: TBD
    property_schooldistrict: String
    # Owner: TBD
    owner_name: String
    # Owner House Number: TBD
    owner_house_number: String
    # Owner Number Suffix: TBD
    owner_number_suffix: String
    # Owner Direction: TBD
    owner_direction: String
    # Owner Street Name: TBD
    owner_street_name: String
    # Owner Street Type: TBD
    owner_street_type: String
    # Owner Careof: TBD
    owner_careof: String
    # Owner Address: TBD
    owner_address: String
    # Owner Cityname: TBD
    owner_cityname: String
    # Owner State: TBD
    owner_state: String
    # Owner Zipcode: TBD
    owner_zipcode: String
    # Owner Account Number: TBD
    owner_account_number: String
    # Shape: TBD
    shape: String
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
`;
export default types;
