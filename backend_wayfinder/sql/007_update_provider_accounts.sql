-- First, check what's currently in the database
SELECT id, name, target_account_number, LENGTH(target_account_number) as account_length
FROM providers
ORDER BY name;

-- Update providers table with UNIQUE account numbers
-- Use different formats to ensure no duplicates
UPDATE providers SET target_account_number = 'RO49WAY0000DIGI01' WHERE name LIKE '%Digi%';
UPDATE providers SET target_account_number = 'RO49WAY0000ORAN01' WHERE name LIKE '%Orange%';
UPDATE providers SET target_account_number = 'RO49WAY0000VODA01' WHERE name LIKE '%Vodafone%';
UPDATE providers SET target_account_number = 'RO49WAY0000ENEL01' WHERE name LIKE '%Enel%';
UPDATE providers SET target_account_number = 'RO49WAY0000ELEC01' WHERE name LIKE '%Electrica%';
UPDATE providers SET target_account_number = 'RO49WAY0000EON001' WHERE name LIKE '%E.ON%';
UPDATE providers SET target_account_number = 'RO49WAY0000ENGI01' WHERE name LIKE '%Engie%';
UPDATE providers SET target_account_number = 'RO49WAY0000APAN01' WHERE name LIKE '%Apa%';
UPDATE providers SET target_account_number = 'RO49WAY0000TELE01' WHERE name LIKE '%Telekom%';

-- Verify the updates (all should be under 20 chars and unique)
SELECT id, name, target_account_number, LENGTH(target_account_number) as account_length
FROM providers
ORDER BY name;


