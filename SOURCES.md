# Source System Research

## SAP (ERP)

### Real-World Context
SAP is the most common ERP system in large enterprises. ESG-relevant data typically comes from:
- **MM (Materials Management)** — procurement records, material movements (MIGO transactions)
- **FI (Financial Accounting)** — cost center postings, payment documents
- **PM (Plant Maintenance)** — energy consumption records

### Column Names
SAP uses German abbreviations for field names (the system was built in Germany):
- `BUKRS` = Buchungskreis (Company Code)
- `WERKS` = Werk (Plant)
- `MATNR` = Materialnummer (Material Number)
- `MENGE` = Menge (Quantity)
- `MEINS` = Mengeneinheit (Unit of Measure)
- `BUDAT` = Buchungsdatum (Posting Date)
- `DMBTR` = Betrag in Hauswährung (Amount in Local Currency)

### Common Data Quality Issues
- **Date formats:** SAP exports dates as YYYYMMDD (internal), DD.MM.YYYY (German locale), or YYYY-MM-DD (ISO). The format depends on the user's SAP GUI settings and export method.
- **Number formats:** German locale uses comma as decimal separator (1.234,56). SAP exports may preserve this.
- **Unit inconsistency:** Same material might appear with L (liters), GAL (gallons), or KG depending on the purchasing plant.
- **Missing plant codes:** Intercompany transfers or cost center postings may omit WERKS.

### References
- SAP Help Portal: [Material Document Fields](https://help.sap.com/docs/SAP_ERP)
- SAP Community: Common CSV export issues

---

## Utility Electricity Data

### Real-World Context
Electricity data typically comes from:
- **Utility portal CSV exports** (Con Edison, PG&E, EDF, etc.)
- **Green button data** (standardized format, rarely used)
- **Manual data entry** from paper bills

### Column Variations
Different utilities use different column names:
- Usage: `kwh`, `kWh`, `usage`, `consumption`
- Dates: `billing_start`, `start_date`, `service_from`
- Cost: `cost`, `amount`, `total`, `charges`
- Meter: `meter_id`, `meter_number`, `service_point`

### Common Data Quality Issues
- **Non-aligned billing periods:** Bills may cover 28–35 days, not calendar months. This creates challenges when normalizing to monthly reporting.
- **Duplicate bills:** Utility portals sometimes include estimated bills that get replaced by actual reads. Both may appear in exports.
- **Missing meter IDs:** Consolidated accounts or master-billed properties may not include individual meter numbers.
- **Unit variation:** Most utilities report in kWh, but some industrial customers receive bills in MWh. Solar credits may appear as negative values.
- **Estimated vs. actual reads:** Some bills are based on estimates and later corrected. Both versions may appear.

### References
- EPA Energy Star: [Portfolio Manager Data Specifications](https://www.energystar.gov/buildings/benchmark)
- Green Button Alliance: [Green Button Data Format](https://www.greenbuttondata.org/)

---

## Corporate Travel Data

### Real-World Context
Travel data typically comes from:
- **Concur/SAP Concur** — the dominant corporate travel management system
- **Navan (formerly TripActions)** — newer alternative
- **Corporate credit card exports** — supplementary data

### Common Fields
Travel management systems export different fields depending on the trip type:
- **Flights:** traveler, origin, destination, cabin class, airline, booking date, trip date, distance
- **Hotels:** traveler, city, nights, hotel name, rate
- **Ground transport:** traveler, mode (taxi/uber/rental), distance, city

### Common Data Quality Issues
- **Missing distances:** Most travel systems don't export flight distance — it has to be calculated from airport codes.
- **Invalid airport codes:** Travelers sometimes manually enter cities instead of IATA codes, or systems use internal location codes.
- **Missing airport codes:** Ground transport and hotel stays don't have airport codes but may have city names.
- **Duplicate trips:** Booking modifications create multiple records for the same trip. Cancellations may not be removed.
- **Mixed categories:** A single expense report may contain flights, hotels, and meals in different rows with different column structures.

### Emission Estimation
- **Flight emissions** are typically estimated using distance × cabin class factor. Business class is ~2.9x economy due to more floor space per passenger.
- **Hotel emissions** use night-count × city-specific emission factor. Major cities typically have higher factors due to energy-intensive hotels.
- **Ground transport** uses distance × mode-specific factor. Taxis are typically 150-250 gCO2/km.

### Airport Distance Estimation
When flight distance is not available, it's estimated using great-circle distance between airport coordinates. This is approximately 95-98% accurate for direct flights. Connecting flights are harder — the distance is underestimated because the connection adds distance.

### References
- GHG Protocol: [Scope 3 Category 6 — Business Travel](https://ghgprotocol.org/scope-3-technical-calculation-guidance)
- DEFRA: [Business Travel Emission Factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2023)
- ICAO: [Carbon Emissions Calculator](https://www.icao.int/environmental-protection/Carbonoffset/Pages/default.aspx)
- Great Circle Mapper: [Airport Distance Calculator](http://www.gcmap.com/)

---

## ESG Reporting Standards

### Scope Classification
The GHG Protocol defines three scopes:
- **Scope 1:** Direct emissions from owned/controlled sources (fuel combustion in company vehicles/plants)
- **Scope 2:** Indirect emissions from purchased electricity, steam, heating, cooling
- **Scope 3:** All other indirect emissions in the value chain (business travel, purchased goods, employee commuting)

### Mapping Used in This Platform
| Source      | Category            | Scope   | Rationale                              |
|-------------|---------------------|---------|----------------------------------------|
| SAP         | Fuel                | Scope 1 | Direct combustion at company facilities |
| SAP         | Procurement         | Scope 3 | Purchased goods and services           |
| Utility     | Electricity         | Scope 2 | Purchased electricity                  |
| Travel      | Flight              | Scope 3 | Category 6 — Business travel           |
| Travel      | Hotel               | Scope 3 | Category 6 — Business travel           |
| Travel      | Ground Transport    | Scope 3 | Category 6 — Business travel           |

### References
- GHG Protocol: [Corporate Standard](https://ghgprotocol.org/corporate-standard)
- GHG Protocol: [Scope 3 Standard](https://ghgprotocol.org/standards/scope-3-standard)
