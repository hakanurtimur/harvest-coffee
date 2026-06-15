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
    
    // Status labels in Turkish
    const statusLabels = {
      preparing: 'Hazırlanıyor',
      in_transit: 'Kargo/Kuryede',
      delivered: 'Teslim Edildi'
    };
    
    const newStatus = data.status;
    const customerEmail = data.created_by;
    const orderNumber = data.order_number;
    
    try {
      // Send email to customer
      await base44.integrations.Core.SendEmail({
        to: customerEmail,
        subject: `Sipariş Durumu Güncellendi - #${orderNumber}`,
        body: `Merhaba,\n\nSipariş numaranız #${orderNumber} durumu güncellendi.\n\nYeni Durum: ${statusLabels[newStatus]}\n\nSiparişinizin detaylarını hesabınızdan görüntüleyebilirsiniz.\n\nTeşekkürler,\nHarvest Coffee`
      });
    } catch (emailError) {
      console.error('Email send failed (expected in test mode):', emailError.message);
    }
    
    // Create in-app notification
    await base44.entities.Notification.create({
      type: 'order_status',
      title: 'Sipariş Durumu Güncellendi',
      message: `Siparişiniz #${orderNumber} - ${statusLabels[newStatus]}`,
      recipient_email: customerEmail,
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