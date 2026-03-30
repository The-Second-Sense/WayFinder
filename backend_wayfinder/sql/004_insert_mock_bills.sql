-- Mock data for testing the bill payment system
-- This script adds test users with realistic bills

-- Insert test users - using correct schema from your database
-- Note: password_hash is handled by auth provider, we only set other fields


-- ...existing code - Insert bills for all test users...
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', id, 'Digi Internet Monthly', 45.99, 'RON', '2026-03-25'::date, 'PENDING', 'CUST-DIG-001234', 'March 2026 billing period', NOW(), NOW() FROM providers WHERE name LIKE '%Digi%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', id, 'Enel Electricity', 156.75, 'RON', '2026-04-01'::date, 'PENDING', 'CUST-ENL-005678', 'Electricity consumption - March', NOW(), NOW() FROM providers WHERE name LIKE '%Enel%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', id, 'Engie Gas', 89.50, 'RON', '2026-04-05'::date, 'PENDING', 'CUST-ENG-009999', 'Natural gas supply - March', NOW(), NOW() FROM providers WHERE name LIKE '%Engie%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', id, 'Orange Mobile Plan', 29.99, 'RON', '2026-03-10'::date, 'OVERDUE', 'CUST-ORG-001111', 'Mobile phone plan - 2 numbers', NOW(), NOW() FROM providers WHERE name LIKE '%Orange%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', id, 'Vodafone Internet + TV', 65.00, 'RON', '2026-03-28'::date, 'PENDING', 'CUST-VOD-002222', 'Broadband + TV package', NOW(), NOW() FROM providers WHERE name LIKE '%Vodafone%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', id, 'Apa Nova Water Supply', 32.45, 'RON', '2026-02-28'::date, 'PAID', 'CUST-APA-003333', 'Water consumption - February', NOW(), NOW() FROM providers WHERE name LIKE '%Apa%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440003', id, 'Telekom Internet', 49.99, 'RON', '2026-03-22'::date, 'PENDING', 'CUST-TEL-004444', 'Fiber optic internet - Premium', NOW(), NOW() FROM providers WHERE name LIKE '%Telekom%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440003', id, 'Electrica Power Supply', 120.00, 'RON', '2026-03-30'::date, 'PENDING', 'CUST-ELC-005555', 'High voltage consumption', NOW(), NOW() FROM providers WHERE name LIKE '%Electrica%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', id, 'E.ON Gas Supply', 95.00, 'RON', '2026-03-05'::date, 'OVERDUE', 'CUST-EON-006666', 'Gas heating - February', NOW(), NOW() FROM providers WHERE name LIKE '%E.ON%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440015', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Digi Internet + TV Premium', 59.99, 'RON', '2026-03-26'::date, 'PENDING', 'CUST-DIG-DAN001', 'Premium package with HD channels', NOW(), NOW() FROM providers WHERE name LIKE '%Digi%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440016', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'E.ON Gas Heating', 110.00, 'RON', '2026-03-29'::date, 'PENDING', 'CUST-EON-DAN001', 'Gas heating and cooking - March', NOW(), NOW() FROM providers WHERE name LIKE '%E.ON%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440017', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Electrica Electricity Supply', 145.50, 'RON', '2026-04-02'::date, 'PENDING', 'CUST-ELC-DAN001', 'Residential electricity - March', NOW(), NOW() FROM providers WHERE name LIKE '%Electrica%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440018', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Orange Mobile & Broadband', 74.99, 'RON', '2026-03-12'::date, 'OVERDUE', 'CUST-ORG-DAN001', 'Mobile plan + home broadband', NOW(), NOW() FROM providers WHERE name LIKE '%Orange%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440019', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Vodafone Internet + TV', 65.00, 'RON', '2026-03-28'::date, 'PENDING', 'CUST-VOD-DAN001', 'Broadband + TV package', NOW(), NOW() FROM providers WHERE name LIKE '%Vodafone%' ON CONFLICT DO NOTHING;
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT '750e8400-e29b-41d4-a716-446655440020', '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Engie Gas Supply', 75.00, 'RON', '2026-03-31'::date, 'PENDING', 'CUST-ENG-DAN001', 'Commercial gas supply', NOW(), NOW() FROM providers WHERE name LIKE '%Engie%' ON CONFLICT DO NOTHING;

SELECT 'Mock data setup complete!' as status;
