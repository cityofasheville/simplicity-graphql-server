## OLD: street
https://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/bc_street_intersection/GeocodeServer/findAddressCandidates?Single+Line+Input=Court+Pl&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddUnit%2C+City%2C+ZIP
## OLD: address, etc
https://arcgis.ashevillenc.gov/arcgis/rest/services/Geolocators/BC_address_unit/GeocodeServer/findAddressCandidates?Single+Line+Input=60+Court+Pl&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddUnit%2C+City%2C+ZIP


### PROBLEM: New version doesn't have a street variant, if you try a query with no street number it returns a street with no zip
## NEW VER:
https://gis.ashevillenc.gov/server/rest/services/Geocoders/simplicity/GeocodeServer/findAddressCandidates?SingleLine=Court+Pl&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddr%2C+City%2C+Postal

## ## Old geocoder => table fields
AddNum => locNumber
StPreType + StName => locName
StType => locType
StPreDir => locPrefix
SubAddUnit => locUnit
ZIP => locZipcode
City => locCity

## old/new outfields
&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddUnit%2C+City%2C+ZIP
&outFields=AddNum%2C+StPreType%2C+StPreDir%2C+StName%2C+StType%2C+SubAddr%2C+City%2C+Postal

## New Geocoder fields
SubAddUnit - SubAddr
ZIP Postal
Single+Line+Input - SingleLine


    "AddNum": "161",
    "StPreType": "",
    "StPreDir": "",
    "StName": "CHARLOTTE",
    "StType": "ST",
    "City": "",
    "ZIP": "28801"

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
  