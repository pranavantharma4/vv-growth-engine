import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LandingClient from './LandingClient'

// Always render fresh so the Founders seat counter reflects live claimed seats.
export const dynamic = 'force-dynamic'

export default async function Root() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')

  // Live Founders Program seat count — public read policy allows anon access.
  // Falls back to the program defaults if the row can't be read.
  let seatsTotal = 4
  let seatsClaimed = 0
  try {
    const { data } = await supabase
      .from('founders_program')
      .select('seats_total, seats_claimed')
      .eq('id', 1)
      .maybeSingle()
    if (data) {
      seatsTotal = data.seats_total ?? seatsTotal
      seatsClaimed = data.seats_claimed ?? seatsClaimed
    }
  } catch {
    // keep defaults
  }
  const seatsLeft = Math.max(0, seatsTotal - seatsClaimed)

  return <LandingClient seatsLeft={seatsLeft} seatsTotal={seatsTotal} />
}