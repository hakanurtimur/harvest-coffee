import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data: order } = await req.json();

    if (!order) {
      return Response.json({ error: 'No order data' }, { status: 400 });
    }

    const user = await base44.auth.me();
    
    // Create notification for customer
    await base44.asServiceRole.entities.Notification.create({
      type: 'order_created',
      title: `Order Confirmed - #${order.order_number}`,
      message: `Your order has been placed. Total: £${order.total_amount.toFixed(2)}`,
      recipient_email: user.email,
      is_admin: false,
      related_entity: 'Order',
      related_entity_id: order.id
    });

    // Get admin email from settings
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (adminUsers.length > 0) {
      const adminSettings = adminUsers[0].admin_settings || {};
      const adminEmail = adminSettings.admin_notification_email || adminUsers[0].email;

      // Create notification for admin
      await base44.asServiceRole.entities.Notification.create({
        type: 'new_order_admin',
        title: `New Order - #${order.order_number}`,
        message: `Order from ${user.email}. Total: £${order.total_amount.toFixed(2)}`,
        recipient_email: adminEmail,
        is_admin: true,
        related_entity: 'Order',
        related_entity_id: order.id
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in onOrderCreated:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});