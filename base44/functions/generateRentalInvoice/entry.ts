import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { rentalId } = await req.json();

    if (!rentalId) {
      return Response.json({ error: 'Rental ID required' }, { status: 400 });
    }

    const rentals = await base44.asServiceRole.entities.Rental.filter({ id: rentalId });
    if (rentals.length === 0) {
      return Response.json({ error: 'Rental not found' }, { status: 404 });
    }

    const rental = rentals[0];
    
    // Calculate rental duration in days
    const startDate = new Date(rental.rental_start_date);
    const endDate = new Date(rental.rental_end_date);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Get product for pricing
    const products = await base44.asServiceRole.entities.Product.filter({ id: rental.product_id });
    const product = products[0];
    const dailyRate = product ? product.price / 30 : 0; // Assume monthly rate, convert to daily
    const totalAmount = dailyRate * days;

    // Generate invoice data
    const invoiceData = {
      invoiceNumber: `INV-${rental.id.substring(0, 8).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0],
      customer: {
        name: rental.customer_name,
        email: rental.customer_email,
      },
      rental: {
        product: rental.product_name,
        startDate: rental.rental_start_date,
        endDate: rental.rental_end_date,
        days: days,
        dailyRate: dailyRate.toFixed(2),
      },
      totalAmount: totalAmount.toFixed(2),
    };

    return Response.json(invoiceData);
  } catch (error) {
    console.error('Error generating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});