// app/test/page.tsx
import { supabase } from '@/lib/supabase';

export default async function TestPage() {
  // Try a simple query. Replace 'your_table' if you have one.
  const { data, error } = await supabase.from('your_table').select('*').limit(1);

  return (
    <div>
      <h1>Connection Test</h1>
      <p>Data: {JSON.stringify(data)}</p>
      <p>Error: {error?.message}</p>
    </div>
  );
}
