-- Create system user for ICS imports
INSERT INTO users (id, email, username, first_name, last_name, role)
VALUES (
  'system_ics_importer',
  'system@socialcal.internal',
  'ics_importer_system',
  'ICS',
  'Importer',
  'admin'
)
ON CONFLICT (id) DO NOTHING;
