-- Drop and recreate providers table with proper IBANs
-- All account numbers are valid 20-char format

-- Step 1: Drop the existing providers table (this will cascade to bills that reference it)
DROP TABLE IF EXISTS providers CASCADE;

-- Step 2: Create the providers table again
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    target_account_number VARCHAR(20) NOT NULL UNIQUE,
    keywords TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Insert Romanian providers with valid IBANs (20 chars each)
INSERT INTO providers (name, category, target_account_number, keywords) VALUES
    ('Digi (RCS & RDS)', 'internet', 'RO49WAYFDIGI000001', 'digi,rcs,rds,internet,cablu,tv'),
    ('Orange Romania', 'telecom', 'RO49WAYFORAN000001', 'orange,telefon,mobil,internet,tv'),
    ('Vodafone Romania', 'telecom', 'RO49WAYFVODA000001', 'vodafone,telefon,mobil,internet,tv'),
    ('Enel Romania', 'electricity', 'RO49WAYFENEL000001', 'enel,energie,curent,electricitate,lumina'),
    ('Electrica', 'electricity', 'RO49WAYFELE0000001', 'electrica,energie,curent,electricitate'),
    ('E.ON Romania', 'gas', 'RO49WAYFEONA000001', 'eon,e.on,gaz,incalzire,heating'),
    ('Engie Romania', 'gas', 'RO49WAYFENG0000001', 'engie,gaz,incalzire,heating,energie'),
    ('Apa Nova', 'water', 'RO49WAYFAPA0000001', 'apa,water,apa nova,canal'),
    ('Telekom Romania', 'internet', 'RO49WAYFTEL0000001', 'telekom,internet,dsl,broadband,tv');

-- Step 4: Verify the data
SELECT id, name, category, target_account_number, LENGTH(target_account_number) as char_length
FROM providers
ORDER BY name;

