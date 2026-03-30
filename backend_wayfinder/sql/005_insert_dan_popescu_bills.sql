-- Insert Dan Popescu's bills (all statuses and provider types)
-- Dan Popescu UUID: 4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a

-- PENDING bills
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Internet + TV Premium Digi', 59.99, 'RON', '2026-03-26'::date, 'PENDING', 'CUST-DIG-DAN001', 'Pachet premium cu canale HD', NOW(), NOW() FROM providers WHERE name LIKE '%Digi%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Încălzire Gaz E.ON', 110.00, 'RON', '2026-03-29'::date, 'PENDING', 'CUST-EON-DAN001', 'Gaz și încălzire - martie', NOW(), NOW() FROM providers WHERE name LIKE '%E.ON%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Alimentare Electrică Electrica', 145.50, 'RON', '2026-04-02'::date, 'PENDING', 'CUST-ELC-DAN001', 'Consum rezidențial - martie', NOW(), NOW() FROM providers WHERE name LIKE '%Electrica%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Internet + TV Vodafone', 65.00, 'RON', '2026-03-28'::date, 'PENDING', 'CUST-VOD-DAN001', 'Pachet internet + TV', NOW(), NOW() FROM providers WHERE name LIKE '%Vodafone%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Alimentare Gaz Engie', 75.00, 'RON', '2026-03-31'::date, 'PENDING', 'CUST-ENG-DAN001', 'Alimentare comercială gaz', NOW(), NOW() FROM providers WHERE name LIKE '%Engie%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Internet Fibră Telekom', 49.99, 'RON', '2026-03-22'::date, 'PENDING', 'CUST-TEL-DAN001', 'Internet fibră optică - Premium', NOW(), NOW() FROM providers WHERE name LIKE '%Telekom%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Alimentare Apă Apa Nova', 32.45, 'RON', '2026-03-25'::date, 'PENDING', 'CUST-APA-DAN001', 'Consum apă - martie', NOW(), NOW() FROM providers WHERE name LIKE '%Apa%' ON CONFLICT DO NOTHING;

-- OVERDUE bills (past due date)
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Mobil + Internet Orange', 74.99, 'RON', '2026-03-12'::date, 'OVERDUE', 'CUST-ORG-DAN001', 'Plan mobil + internet acasă', NOW(), NOW() FROM providers WHERE name LIKE '%Orange%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Electricitate Enel (Februarie)', 156.75, 'RON', '2026-03-10'::date, 'OVERDUE', 'CUST-ENL-DAN002', 'Consum electricitate - februarie (DATORAT)', NOW(), NOW() FROM providers WHERE name LIKE '%Enel%' ON CONFLICT DO NOTHING;

-- PAID bills (already paid)
INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Digi Luna Precedentă', 45.99, 'RON', '2026-02-25'::date, 'PAID', 'CUST-DIG-DAN002', 'Pachet premium cu canale HD - PLĂTIT', NOW(), NOW() FROM providers WHERE name LIKE '%Digi%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'Vodafone Luna Precedentă', 65.00, 'RON', '2026-02-28'::date, 'PAID', 'CUST-VOD-DAN002', 'Pachet internet + TV - PLĂTIT', NOW(), NOW() FROM providers WHERE name LIKE '%Vodafone%' ON CONFLICT DO NOTHING;

INSERT INTO bills (id, user_id, provider_id, bill_name, amount, currency, due_date, status, account_number, description, created_at, updated_at)
SELECT gen_random_uuid(), '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a', id, 'E.ON Luna Precedentă', 110.00, 'RON', '2026-02-28'::date, 'PAID', 'CUST-EON-DAN002', 'Gaz și încălzire - februarie - PLĂTIT', NOW(), NOW() FROM providers WHERE name LIKE '%E.ON%' ON CONFLICT DO NOTHING;

-- Summary
SELECT 'Facturile lui Dan Popescu au fost introduse!' as status;
SELECT COUNT(*) as total_facturi FROM bills WHERE user_id = '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a';
SELECT status, COUNT(*) as numar FROM bills WHERE user_id = '4d94a5e0-bc0a-49ef-97e1-1b41e05abc9a' GROUP BY status;

