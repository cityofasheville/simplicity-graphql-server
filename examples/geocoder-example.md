
## NEW GEOCODER:
### New version doesn't have a street variant, if you try a query with no street number it returns a street with no zip
https://gis.ashevillenc.gov/server/rest/services/Geocoders/simplicity/GeocodeServer/findAddressCandidates?SingleLine=S+Charlotte+St&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddr%2C+City%2C+Postal

## ## New geocoder => table fields
AddNum => locNumber
StPreType + StName => locName
StType => locType
StPreDir => locPrefix
SubAddr => locUnit
Postal => locZipcode
City => locCity

## After geocoder, we look up the results here (api/search/contexts/searchAddress.js)
select * from simplicity.get_search_addresses(
    locNumber,
    locName,
    locType,
    locPrefix,
    locUnit,
    locZipcode,
    locCity
)    
  
