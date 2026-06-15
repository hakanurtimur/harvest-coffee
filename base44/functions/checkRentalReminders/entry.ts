import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all rentals
    const rentals = await base44.asServiceRole.entities.Rental.list();
    
    // Get admin settings
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminSettings = adminUsers[0]?.admin_settings || {};
    const adminEmail = adminSettings.admin_notification_email;
    const reminderDays = adminSettings.rental_reminder_days || 3;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const rental of rentals) {
      // Only process active rentals that haven't sent reminder yet
      if (rental.status !== 'active' && rental.status !== 'upcoming') continue;
      if (rental.reminder_sent) continue;

      const endDate = new Date(rental.rental_end_date);
      endDate.setHours(0, 0, 0, 0);

      const daysUntilExpiration = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

      // Send reminder if within reminder window
      if (daysUntilExpiration <= reminderDays && daysUntilExpiration > 0) {
        // Email to customer
        try {
          await base44.integrations.Core.SendEmail({
            to: rental.customer_email,
            subject: `Rental Expiring Soon - ${rental.product_name}`,
            body: `Hello ${rental.customer_name},\n\nThis is a reminder that your rental for ${rental.product_name} will expire on ${rental.rental_end_date}.\n\nPlease renew or return your rental before the expiration date.\n\nBest regards,\nHarvest Coffee`
          });
        } catch (emailError) {
          console.error('Error sending customer email:', emailError);
        }

        // Email to admin if configured
        if (adminEmail) {
          try {
            await base44.integrations.Core.SendEmail({
              to: adminEmail,
              subject: `Rental Reminder - ${rental.product_name} expires ${rental.rental_end_date}`,
              body: `Rental Alert:\n\nProduct: ${rental.product_name}\nCustomer: ${rental.customer_name} (${rental.customer_email})\nExpiration Date: ${rental.rental_end_date}\nDays Until Expiration: ${daysUntilExpiration}\n\nPlease follow up with the customer regarding renewal or return.`
            });
          } catch (emailError) {
            console.error('Error sending admin email:', emailError);
          }
        }

        // Mark reminder as sent
        try {
          await base44.asServiceRole.entities.Rental.update(rental.id, {
            reminder_sent: true
          });
        } catch (updateError) {
          console.error('Error updating rental:', updateError);
        }
      }

      // Mark as expired if past expiration date
      if (daysUntilExpiration <= 0 && rental.status !== 'expired') {
        try {
          await base44.asServiceRole.entities.Rental.update(rental.id, {
            status: 'expired'
          });
        } catch (updateError) {
          console.error('Error updating rental status:', updateError);
        }
      }
    }

    return Response.json({ success: true, processed: rentals.length });
  } catch (error) {
    console.error('Error in checkRentalReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});