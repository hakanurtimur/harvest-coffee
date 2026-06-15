import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, title, message, recipientEmail, isAdmin, relatedEntity, relatedEntityId } = await req.json();

    // Create notification record
    const notification = await base44.asServiceRole.entities.Notification.create({
      type,
      title,
      message,
      recipient_email: recipientEmail,
      is_admin: isAdmin || false,
      related_entity: relatedEntity,
      related_entity_id: relatedEntityId
    });

    return Response.json({ success: true, notificationId: notification.id });
  } catch (error) {
    console.error('Error creating notification:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});