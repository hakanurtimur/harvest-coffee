import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data: order } = await req.json();

    if (!order) {
      return Response.json({ error: 'No order data' }, { status: 400 });
    }

    const currentUser = await base44.auth.me();
    const customer = await resolveOrderCustomer(base44, order, currentUser);
    const customerEmail = customer?.email || currentUser.email;
    const customerName = getCustomerDisplayName(customer || currentUser);
    const totalAmount = formatCurrency(order.total_amount);
    
    await createNotificationIfMissing(base44, {
      type: 'order_created',
      title: `Order Confirmed - #${order.order_number}`,
      message: `Your order has been placed. Total: ${totalAmount}`,
      recipient_email: customerEmail,
      is_admin: false,
      related_entity: 'Order',
      related_entity_id: order.id
    });

    // Get admin email from settings
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    if (adminUsers.length > 0) {
      const adminSettings = adminUsers[0].admin_settings || {};
      const adminEmail = adminSettings.admin_notification_email || adminUsers[0].email;

      await createNotificationIfMissing(base44, {
        type: 'new_order_admin',
        title: `New Order - #${order.order_number}`,
        message: `${customerName} placed order #${order.order_number}. Total: ${totalAmount}`,
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

async function resolveOrderCustomer(base44, order, fallbackUser) {
  if (order.created_by_id) {
    try {
      return await base44.asServiceRole.entities.User.get(order.created_by_id);
    } catch (error) {
      console.error('Could not resolve order customer by created_by_id:', error.message);
    }
  }

  return fallbackUser;
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

  return base44.asServiceRole.entities.Notification.create({
    ...notification,
    read: false
  });
}

function getCustomerDisplayName(user) {
  return user?.company_name || user?.full_name || user?.email || 'A customer';
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `£${amount.toFixed(2)}`;
}
