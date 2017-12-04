CREATE INDEX search
    ON amd.coa_bc_address_master USING btree
    (address_number ASC NULLS LAST, address_street_name ASC NULLS LAST, address_street_type ASC NULLS LAST, address_street_prefix ASC NULLS LAST, address_zipcode ASC NULLS LAST, address_commcode ASC NULLS LAST, address_unit ASC NULLS LAST)
    TABLESPACE pg_default;
    