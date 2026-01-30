-- Add latitude and longitude to venues table for geolocation-based searches
ALTER TABLE "venues" ADD COLUMN "latitude" double precision;
ALTER TABLE "venues" ADD COLUMN "longitude" double precision;
