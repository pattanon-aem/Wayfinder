import { NextResponse } from 'next/server';

const LTA_API_KEY = process.env.LTA_API_KEY;
const LTA_BASE_URL = 'https://datamall2.mytransport.sg/ltaodataservice';

export async function GET() {
  try {
    const response = await fetch(
      `${LTA_BASE_URL}/Taxi-Availability`,
      {
        headers: {
          AccountKey: LTA_API_KEY || '',
          accept: 'application/json',
        },
        cache: 'no-store', // Always fetch fresh taxi data
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch taxi availability');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching taxi availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxi availability' },
      { status: 500 }
    );
  }
}
