-- Drop existing bills table if it exists
DROP TABLE IF EXISTS bills CASCADE;

-- Recreate bills table with proper structure
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    bill_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'RON',
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    account_number VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_bills_user_id ON bills(user_id);
CREATE INDEX idx_bills_provider_id ON bills(provider_id);
CREATE INDEX idx_bills_status ON bills(status);

-- Insert mock bills for Dan Popescu (4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a)
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Digi Internet + TV Premium',
    59.99,
    'RON',
    '2026-03-26'::date,
    'PENDING',
    'CUST-DIG-DAN001',
    'Premium package with HD channels',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Digi%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'E.ON Gas Heating',
    110.00,
    'RON',
    '2026-03-29'::date,
    'PENDING',
    'CUST-EON-DAN001',
    'Gas heating and cooking - March',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%E.ON%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Electrica Electricity Supply',
    145.50,
    'RON',
    '2026-04-02'::date,
    'PENDING',
    'CUST-ELC-DAN001',
    'Residential electricity - March',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Electrica%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Orange Mobile & Broadband',
    74.99,
    'RON',
    '2026-03-12'::date,
    'OVERDUE',
    'CUST-ORG-DAN001',
    'Mobile plan + home broadband',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Orange%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Vodafone Internet + TV',
    65.00,
    'RON',
    '2026-03-28'::date,
    'PENDING',
    'CUST-VOD-DAN001',
    'Broadband + TV package',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Vodafone%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Engie Gas Supply',
    75.00,
    'RON',
    '2026-03-31'::date,
    'PENDING',
    'CUST-ENG-DAN001',
    'Commercial gas supply',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Engie%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Enel Electricity',
    156.75,
    'RON',
    '2026-04-01'::date,
    'PENDING',
    'CUST-ENL-DAN001',
    'Electricity consumption - March',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Enel%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Apa Nova Water Supply',
    32.45,
    'RON',
    '2026-02-28'::date,
    'PAID',
    'CUST-APA-DAN001',
    'Water consumption - February',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Apa%'
LIMIT 1;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT
    gen_random_uuid(),
    '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid,
    id,
    'Telekom Internet',
    49.99,
    'RON',
    '2026-03-22'::date,
    'PENDING',
    'CUST-TEL-DAN001',
    'Fiber optic internet - Premium',
    NOW(),
    NOW()
FROM providers
WHERE name LIKE '%Telekom%'
LIMIT 1;

-- Verify the bills were created
SELECT COUNT(*) as total_bills FROM bills WHERE user_id = '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid;

-- Show all bills for Dan Popescu
SELECT
    b.id,
    b.bill_name,
    b.amount,
    b.currency,
    b.due_date,
    b.status,
    b.description,
    p.name as provider_name
FROM bills b
JOIN providers p ON b.provider_id = p.id
WHERE b.user_id = '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a'::uuid
ORDER BY b.due_date DESC;

