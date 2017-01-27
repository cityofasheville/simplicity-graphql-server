const endpoints = `
  # Address master table maintained by _Buncombe County_ and _City of Asheville_
  mda_address( id: ID!, name: String ): MDA_Address
  # Property table maintained by _Buncombe County_ and _City of Asheville_
  mda_permits( id: ID!, name: String ): MDA_Permits
  # Property table maintained by _Buncombe County_ and _City of Asheville_
  mda_property( id: ID!, name: String ): MDA_Property
`;
module.exports = endpoints;
