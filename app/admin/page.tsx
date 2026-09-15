import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authorized } from '@/lib/http';
import Admin from './admin-client';
export const dynamic='force-dynamic';
export default async function Page(){if(!authorized((await cookies()).toString(),'admin'))redirect('/login?admin=1');return <Admin/>}
