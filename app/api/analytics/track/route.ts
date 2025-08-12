import { NextRequest, NextResponse } from 'next/server'
import { analytics } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, eventCategory, properties } = body

    if (!eventType || !eventCategory) {
      return NextResponse.json(
        { error: 'Event type and category are required' },
        { status: 400 }
      )
    }

    // Track the event
    await analytics.trackEvent(eventType, eventCategory, properties)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
