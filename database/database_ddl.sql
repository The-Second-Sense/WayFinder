-- 1) DROP existing tables if present (safe because tables are empty).
DROP TABLE IF EXISTS public.ai_interaction_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.beneficiaries CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2) Recreate users table linked to auth.users(id)
CREATE TABLE public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  full_name varchar(100) NOT NULL,
  phone_number varchar(20),
  is_voice_auth_enabled boolean DEFAULT FALSE,
  voice_profile_id varchar(255),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  PRIMARY KEY (id)
);

-- 3) Accounts table referencing users.id (uuid)
CREATE TABLE public.accounts (
  account_id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_number varchar(20) UNIQUE NOT NULL,
  account_type varchar(20) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  balance numeric(15,2) DEFAULT 0.00,
  is_active boolean DEFAULT TRUE,
  created_at timestamptz DEFAULT now()
);

-- 4) Beneficiaries table referencing users.id (uuid)
CREATE TABLE public.beneficiaries (
  beneficiary_id serial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nickname varchar(50) NOT NULL,
  official_name varchar(100),
  target_account_number varchar(20) NOT NULL,
  target_bank_code varchar(20),
  UNIQUE(user_id, nickname)
);

-- 5) Transactions (no change for account_id foreign key)
CREATE TABLE public.transactions (
  transaction_id serial PRIMARY KEY,
  source_account_id int REFERENCES public.accounts(account_id),
  destination_account_number varchar(20),
  amount numeric(15,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  description varchar(255),
  status varchar(20) DEFAULT 'PENDING',
  initiated_by varchar(20) DEFAULT 'APP_UI',
  created_at timestamptz DEFAULT now()
);

-- 6) AI interaction logs referencing users.id (uuid)
CREATE TABLE public.ai_interaction_logs (
  log_id serial PRIMARY KEY,
  user_id uuid REFERENCES public.users(id),
  voice_command_transcript text,
  intent_detected varchar(50),
  confidence_score numeric(5,2),
  action_taken varchar(50),
  linked_transaction_id int REFERENCES public.transactions(transaction_id),
  created_at timestamptz DEFAULT now()
);

-- 7) Trigger function to create public.users row when auth.users row inserted
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a corresponding row into public.users if one doesn't exist.
  INSERT INTO public.users (id, email, full_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Secure the trigger function: allow supabase auth admin to run, but not public roles
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.handle_new_auth_user() FROM authenticated, anon, public;

-- 8) Enable RLS and create policies using auth.uid() (UUID)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;

-- USERS: authenticated user may SELECT/INSERT/UPDATE/DELETE own row
CREATE POLICY "users: select own" ON public.users FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND id::text = (SELECT auth.uid())::text);

CREATE POLICY "users: insert self" ON public.users FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND id::text = (SELECT auth.uid())::text);

CREATE POLICY "users: update own" ON public.users FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND id::text = (SELECT auth.uid())::text)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND id::text = (SELECT auth.uid())::text);

CREATE POLICY "users: delete own" ON public.users FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND id::text = (SELECT auth.uid())::text);

-- ACCOUNTS: owner may operate on their accounts
CREATE POLICY "accounts: select own" ON public.accounts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "accounts: insert own" ON public.accounts FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "accounts: update own" ON public.accounts FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "accounts: delete own" ON public.accounts FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

-- BENEFICIARIES: owner only
CREATE POLICY "beneficiaries: select own" ON public.beneficiaries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "beneficiaries: insert own" ON public.beneficiaries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "beneficiaries: update own" ON public.beneficiaries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "beneficiaries: delete own" ON public.beneficiaries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

-- TRANSACTIONS: user can see transactions where they are sender (via accounts.user_id)
-- or receiver (destination_account_number matches one of their accounts).
CREATE POLICY "transactions: select if user involved (source or destination)" ON public.transactions FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.accounts a WHERE a.account_id = transactions.source_account_id
          AND a.user_id::text = (SELECT auth.uid())::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.accounts a2 WHERE a2.account_number = transactions.destination_account_number
          AND a2.user_id::text = (SELECT auth.uid())::text
      )
    )
  );

CREATE POLICY "transactions: insert if source account belongs to user" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.accounts a WHERE a.account_id = source_account_id
        AND a.user_id::text = (SELECT auth.uid())::text
    )
  );

CREATE POLICY "transactions: update if user involved (source or destination)" ON public.transactions FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.accounts a WHERE a.account_id = transactions.source_account_id
          AND a.user_id::text = (SELECT auth.uid())::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.accounts a2 WHERE a2.account_number = transactions.destination_account_number
          AND a2.user_id::text = (SELECT auth.uid())::text
      )
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.accounts a WHERE a.account_id = source_account_id
          AND a.user_id::text = (SELECT auth.uid())::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.accounts a2 WHERE a2.account_number = destination_account_number
          AND a2.user_id::text = (SELECT auth.uid())::text
      )
    )
  );

CREATE POLICY "transactions: delete if user involved (source or destination)" ON public.transactions FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.accounts a WHERE a.account_id = transactions.source_account_id
          AND a.user_id::text = (SELECT auth.uid())::text
      )
      OR
      EXISTS (
        SELECT 1 FROM public.accounts a2 WHERE a2.account_number = transactions.destination_account_number
          AND a2.user_id::text = (SELECT auth.uid())::text
      )
    )
  );

-- AI_INTERACTION_LOGS: owner only
CREATE POLICY "ai_logs: select own" ON public.ai_interaction_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "ai_logs: insert own" ON public.ai_interaction_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "ai_logs: update own" ON public.ai_interaction_logs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

CREATE POLICY "ai_logs: delete own" ON public.ai_interaction_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id::text = (SELECT auth.uid())::text);

-- 9) Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id_uuid ON public.accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON public.accounts (account_number);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id_uuid ON public.beneficiaries (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source_account_id ON public.transactions (source_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_destination_account_number ON public.transactions (destination_account_number);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id_uuid ON public.ai_interaction_logs (user_id);