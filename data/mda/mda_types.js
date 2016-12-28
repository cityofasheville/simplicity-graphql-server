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
  }`;
export default types;
