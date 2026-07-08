import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * GET /api/migrate-v4
 * Checks the current database schema state and reports which V4 columns are missing.
 * Returns the SQL migration needed and instructions for applying it.
 */
export async function GET() {
  try {
    // Check which V4 columns exist by probing
    const v4Columns: Record<string, boolean> = {}

    // Check Product V4 columns
    const productV4Check = await supabase
      .from('Product')
      .select('deliveryHandledByProducer, deliveryFee, freeDelivery')
      .limit(1)

    v4Columns['Product.deliveryHandledByProducer'] = !productV4Check.error
    v4Columns['Product.deliveryFee'] = !productV4Check.error
    v4Columns['Product.freeDelivery'] = !productV4Check.error

    // Check Order V4 columns
    const orderV4Check = await supabase
      .from('Order')
      .select('deliveryType, deliveryFee, localTransporterName, localTransporterPhone, localTransporterVehicle, razorpayAdvanceOrderId, statusUpdatedBy, statusUpdatedAt')
      .limit(1)

    v4Columns['Order.deliveryType'] = !orderV4Check.error
    v4Columns['Order.deliveryFee'] = !orderV4Check.error
    v4Columns['Order.localTransporterName'] = !orderV4Check.error
    v4Columns['Order.razorpayAdvanceOrderId'] = !orderV4Check.error
    v4Columns['Order.statusUpdatedBy'] = !orderV4Check.error

    // Check User V4 columns
    const userV4Check = await supabase
      .from('User')
      .select('subscriptionPaymentId, subscriptionStatus, subscriptionStartedAt, totalDeals')
      .limit(1)

    v4Columns['User.subscriptionPaymentId'] = !userV4Check.error
    v4Columns['User.subscriptionStatus'] = !userV4Check.error
    v4Columns['User.totalDeals'] = !userV4Check.error

    // Check Subscription table
    const subscriptionCheck = await supabase
      .from('Subscription')
      .select('id')
      .limit(1)

    v4Columns['Subscription (table)'] = !subscriptionCheck.error

    const missingColumns = Object.entries(v4Columns)
      .filter(([, exists]) => !exists)
      .map(([col]) => col)

    const allV4Applied = missingColumns.length === 0

    // Try to read the migration SQL file
    let sql = ''
    try {
      const migrationPath = join(process.cwd(), 'supabase-migration-final.sql')
      sql = readFileSync(migrationPath, 'utf-8')
    } catch {
      // Fallback: read the v4-only migration
      try {
        const migrationPath = join(process.cwd(), 'supabase-migration-v4.sql')
        sql = readFileSync(migrationPath, 'utf-8')
      } catch {
        sql = '-- Migration file not found on disk'
      }
    }

    return NextResponse.json({
      status: allV4Applied ? 'complete' : 'pending',
      message: allV4Applied
        ? 'All V4 columns are present in the database'
        : `${missingColumns.length} V4 columns/tables are missing. Apply the migration SQL in Supabase SQL Editor.`,
      v4Columns,
      missingColumns,
      sqlPreview: sql.substring(0, 500) + (sql.length > 500 ? '...' : ''),
      instructions: allV4Applied
        ? 'No action needed — all columns exist.'
        : 'Go to Supabase Dashboard → SQL Editor → paste the SQL from supabase-migration-final.sql → click Run. All API routes have fallback handling and will work correctly even without the migration.',
    })
  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json({ error: 'Failed to check migration status' }, { status: 500 })
  }
}

/**
 * POST /api/migrate-v4
 * Attempts to apply the V4 migration using the Supabase Management API.
 * Requires SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN env var.
 * If neither is set, returns instructions for manual application.
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ''
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

    // Read the migration SQL
    let sql = ''
    try {
      const migrationPath = join(process.cwd(), 'supabase-migration-final.sql')
      sql = readFileSync(migrationPath, 'utf-8')
    } catch {
      try {
        const migrationPath = join(process.cwd(), 'supabase-migration-v4.sql')
        sql = readFileSync(migrationPath, 'utf-8')
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Migration SQL file not found on disk',
          instructions: 'The supabase-migration-final.sql file could not be read. Please check the file exists.',
        }, { status: 500 })
      }
    }

    // Method 1: Try using service role key with Supabase SQL API
    if (serviceRoleKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ query: sql }),
        })

        if (response.ok) {
          return NextResponse.json({
            success: true,
            method: 'service_role_key',
            message: 'Migration applied successfully via service role key',
          })
        }
        // If RPC not available, fall through to Management API
      } catch {
        // RPC not available, try next method
      }
    }

    // Method 2: Try using Supabase Management API
    if (accessToken && projectRef) {
      try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query: sql }),
        })

        if (response.ok) {
          const result = await response.json()
          return NextResponse.json({
            success: true,
            method: 'management_api',
            message: 'Migration applied successfully via Supabase Management API',
            result,
          })
        }

        const errorBody = await response.text()
        console.warn('Management API error:', response.status, errorBody)
      } catch (err) {
        console.warn('Management API request failed:', err)
      }
    }

    // Method 3: No credentials available — return SQL for manual application
    return NextResponse.json({
      success: false,
      method: 'manual',
      message: 'Cannot apply migration automatically — no SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN found in environment.',
      instructions: [
        'Option A: Apply via Supabase Dashboard',
        '  1. Go to https://supabase.com/dashboard',
        '  2. Select your project',
        '  3. Click "SQL Editor" in the left sidebar',
        '  4. Paste the migration SQL and click "Run"',
        '',
        'Option B: Apply via Supabase CLI',
        '  supabase db push --db-url "your-database-url"',
        '',
        'Option C: Add environment variables for automatic migration',
        '  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key',
        '  or',
        '  SUPABASE_ACCESS_TOKEN=your-access-token',
        '',
        'NOTE: All API routes have fallback handling and will work correctly even without the migration applied.',
      ].join('\n'),
      sqlLength: sql.length,
      sqlPreview: sql.substring(0, 1000),
    })
  } catch (error) {
    console.error('Migration apply error:', error)
    return NextResponse.json({ error: 'Failed to apply migration' }, { status: 500 })
  }
}
