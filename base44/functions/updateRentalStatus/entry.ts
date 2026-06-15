import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const rentals = await base44.asServiceRole.entities.Rental.list();
    const today = new Date();

    for (const rental of rentals) {
      const startDate = new Date(rental.rental_start_date);
      const endDate = new Date(rental.rental_end_date);

      let newStatus = rental.status;

      // Update status based on dates
      if (today >= endDate && rental.status !== 'expired' && rental.status !== 'cancelled') {
        newStatus = 'expired';
      } else if (today >= startDate && today < endDate && rental.status === 'upcoming') {
        newStatus = 'active';
      }

      if (newStatus !== rental.status) {
        await base44.asServiceRole.entities.Rental.update(rental.id, { status: newStatus });

        // Create notification for status change
        await base44.asServiceRole.entities.Notification.create({
          type: 'rental_expiring',
          title: `Rental Status Updated - ${rental.product_name}`,
          message: `Your rental status has been updated to: ${newStatus}`,
          recipient_email: rental.customer_email,
          is_admin: false,
          related_entity: 'Rental',
          related_entity_id: rental.id,
        });
      }
    }

    return Response.json({ success: true, updatedCount: rentals.length });
  } catch (error) {
    console.error('Error updating rental statuses:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});