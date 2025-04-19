import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies(); // 👈 await this
  const sessionSecret = cookieStore.get('appwrite-session')?.value;
  
  return NextResponse.json({ sessionSecret });
}
