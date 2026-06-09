# Low-Level Design (LLD) - Carbon Footprint Tracker & Sub-Application Accounts (Supabase)

## 1. PIN Generation and Verification Flow via Supabase Edge Functions
To ensure security, PIN verification codes are generated inside a Deno/TypeScript Supabase Edge Function:
- **Generation**: A secure, randomly generated code is stored in the database cache with a 5-minute TTL.
- **Verification**: The user sends their verification request directly to the Edge Function, which matches the code, invalidates the entry to prevent replay attacks, and authorizes sub-app session status.

```typescript
// Sample Supabase Edge Function for verification code cache (TypeScript / Deno)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { userId, pid, pinCode } = await req.json()
  
  // Initialize Supabase Client with Service Role Key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Verify pin code in temp cache table
  const { data, error } = await supabase
    .from('pin_verification_cache')
    .select('*')
    .eq('user_id', userId)
    .eq('pid', pid)
    .eq('verification_code_hash', pinCode)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Invalid or expired PIN" }), { status: 401 })
  }

  // Clear verification code after single use (to prevent replay attacks)
  await supabase.from('pin_verification_cache').delete().eq('id', data.id)

  return new Response(JSON.stringify({ status: "authorized" }), { status: 200 })
})
```

## 2. API Endpoints Specification

### Authentication & Sub-Apps
- `POST /api/v1/auth/signup` - Register via Supabase Auth.
- `POST /api/v1/subapps/purchase` - Record sub-app purchase.
- `POST /api/v1/subapps/verify` - Call Supabase Edge Function to verify PIN and authorize sub-app.

### Carbon Tracker
- `GET /api/v1/carbon/logs` - Fetch carbon logs filtered by user.
- `POST /api/v1/carbon/logs` - Add a new carbon activity log.
- `GET /api/v1/carbon/insights` - Retrieve customized insights based on usage history.

## 3. Accessibility & UI Requirements
- All interactive elements must have unique, descriptive IDs for automation.
- High-contrast color combinations matching WCAG AAA standards.
- Focus-visible rings for keyboard-only web browsing.

