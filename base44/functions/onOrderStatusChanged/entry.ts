import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse the event payload
    const { event, data, old_data } = await req.json();
    
    // Check if status actually changed
    if (!old_data || data.status === old_data.status) {
      return Response.json({ message: 'Status unchanged, skipping notification' });
    }
    
    const statusLabels = {
      preparing: 'Preparing',
      in_transit: 'In transit',
      delivered: 'Delivered'
    };
    
    const newStatus = data.status;
    const customer = await resolveOrderCustomer(base44, data);
    const customerEmail = customer?.email || '';
    const orderNumber = data.order_number;

    if (!customerEmail) {
      return Response.json({
        message: 'Order customer email could not be resolved, skipping notification',
        order_id: data.id
      });
    }
    
    try {
      await base44.integrations.Core.SendEmail({
        to: customerEmail,
        subject: `Order status updated - #${orderNumber}`,
        body: `Hello,\n\nYour order #${orderNumber} status has been updated.\n\nNew status: ${statusLabels[newStatus] || newStatus}\n\nYou can view order details from your account.\n\nThank you,\nHarvest Coffee`
      });
    } catch (emailError) {
      console.error('Email send failed (expected in test mode):', emailError.message);
    }
    
    await createNotificationIfMissing(base44, {
      type: 'order_status',
      title: 'Order status updated',
      message: `Order #${orderNumber} is now ${statusLabels[newStatus] || newStatus}.`,
      recipient_email: customerEmail,
      is_admin: false,
      related_entity: 'Order',
      related_entity_id: data.id,
      read: false
    });
    
    return Response.json({ 
      message: 'Notification sent successfully',
      order_id: data.id,
      new_status: newStatus
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function resolveOrderCustomer(base44, order) {
  if (order.customer_email) {
    return { email: order.customer_email };
  }

  if (order.created_by_id) {
    try {
      return await base44.asServiceRole.entities.User.get(order.created_by_id);
    } catch (error) {
      console.error('Could not resolve order customer by created_by_id:', error.message);
    }
  }

  if (typeof order.created_by === 'string' && order.created_by.includes('@')) {
    return { email: order.created_by };
  }

  return null;
}

async function createNotificationIfMissing(base44, notification) {
  const existing = await base44.asServiceRole.entities.Notification.filter({
    type: notification.type,
    recipient_email: notification.recipient_email,
    related_entity: notification.related_entity,
    related_entity_id: notification.related_entity_id,
    message: notification.message
  });

  if (existing.length > 0) {
    return existing[0];
  }

  return base44.asServiceRole.entities.Notification.create(notification);
}
