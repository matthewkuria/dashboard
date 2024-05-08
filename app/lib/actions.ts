'use server';

import { z } from 'zod';
// Connect the database
import { sql } from '@vercel/postgres';
// Revalidate the path once the  the database has been updated
import { revalidatePath } from 'next/cache';
// Redirect the user back to the earlier path
import { redirect } from 'next/navigation';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
 
export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  // Store money as cents to eliminate floating points
  const amountInCents = amount * 100;
//   Create a new date
const date = new Date().toISOString().split('T')[0];
// Make a  SQL command to insert data into the database
await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
//   Clear the cache and make a new request
revalidatePath('/dashboard/invoices');
//  redirect the user back to the /dashboard/invoices page
redirect('/dashboard/invoices');
}