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
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
  .number()
  .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'],{
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});
export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
 

export async function createInvoice(prevState: State, formData: FormData) {
     // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

   // If form validation fails, return errors early. Otherwise, continue.
   if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  
 // Prepare data for insertion into the database
 const { customerId, amount, status } = validatedFields.data;
 // Store money as cents to eliminate floating points
 const amountInCents = amount * 100;
 const date = new Date().toISOString().split('T')[0];
// Make a  SQL command to insert data into the database
try{
  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
}catch(error){
  return{
    message: 'Database Error: Failed to Create Invoice.'
  };
}
//   Clear the cache and make a new request
revalidatePath('/dashboard/invoices');
//  redirect the user back to the /dashboard/invoices page
redirect('/dashboard/invoices');
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
// the function to update the invoice records
try{
  await sql`
  UPDATE invoices
  SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
  WHERE id = ${id}
`;
}catch(error){
  message: 'Database Error: Failed to Update Invoice.'

};
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
//Delete with id
export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');
  try{
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  }catch(error){
   return{
    message:'The database failed to delete the invoice.'
   };
  }
}