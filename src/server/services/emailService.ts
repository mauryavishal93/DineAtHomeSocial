import { getEventPassById } from "./eventPassService";
import { EventPass } from "@/server/models/EventPass";
import { connectMongo } from "@/server/db/mongoose";

/**
 * Generate HTML email template for event pass
 */
export function generateEventPassEmailHTML(passData: {
  guestName: string;
  eventCode: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  hostName: string;
  venueAddress: string;
  hostEmail: string;
  hostMobile: string;
  passUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Event Pass - ${passData.eventName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 Your Event Pass is Ready!</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">DineAtHome Social</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${passData.guestName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! Your booking for <strong>${passData.eventName}</strong> is confirmed! 🎊
              </p>
              
              <!-- Event Code Box -->
              <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #ffffff; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Your Unique Event Code</p>
                <div style="background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 8px; padding: 20px; border: 2px solid rgba(255, 255, 255, 0.3); margin: 15px 0;">
                  <p style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 3px;">${passData.eventCode}</p>
                </div>
                <p style="margin: 10px 0 0; color: #ffffff; font-size: 13px; opacity: 0.9;">Show this code to your host at check-in</p>
              </div>
              
              <!-- Event Details -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px; font-weight: bold;">📅 Event Details</h2>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Event:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${passData.eventName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${passData.eventDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${passData.eventTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Host:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${passData.hostName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Venue:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${passData.venueAddress}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Host Contact -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h3 style="margin: 0 0 12px; color: #92400e; font-size: 16px; font-weight: bold;">📞 Host Contact</h3>
                <p style="margin: 5px 0; color: #78350f; font-size: 14px;">📧 ${passData.hostEmail}</p>
                ${passData.hostMobile ? `<p style="margin: 5px 0; color: #78350f; font-size: 14px;">📱 ${passData.hostMobile}</p>` : ''}
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${passData.passUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                  View & Download Your Pass
                </a>
              </div>
              
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                You can download your event pass as an image or PDF and save it to your phone. Make sure to bring it with you on the event day!
              </p>
              
              <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Important:</strong> This pass is valid only for the specified event date and time. Please arrive on time and show your event code to the host.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Thank you for choosing DineAtHome Social!
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send event pass email (placeholder - integrate with your email service)
 * For now, this just marks the email as sent in the database
 */
export async function sendEventPassEmail(passId: string, recipientEmail: string): Promise<boolean> {
  await connectMongo();
  
  try {
    const pass = await getEventPassById(passId);
    if (!pass) {
      console.error(`Pass not found: ${passId}`);
      return false;
    }

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    };

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
    };

    const venueAddress = pass.venue 
      ? `${pass.venue.address || ""}${pass.venue.locality ? `, ${pass.venue.locality}` : ""}${pass.venue.city ? `, ${pass.venue.city}` : ""}${pass.venue.state ? `, ${pass.venue.state}` : ""}${pass.venue.postalCode ? ` ${pass.venue.postalCode}` : ""}`.trim()
      : `${pass.host.address || ""}${pass.host.locality ? `, ${pass.host.locality}` : ""}${pass.host.city ? `, ${pass.host.city}` : ""}${pass.host.state ? `, ${pass.host.state}` : ""}${pass.host.postalCode ? ` ${pass.host.postalCode}` : ""}`.trim();

    // Get booking ID from pass
    const passDoc = await EventPass.findById(passId).select("bookingId").lean();
    const bookingId = passDoc ? String((passDoc as any).bookingId) : "";
    const passUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings/${bookingId}/passes`;

    const emailHTML = generateEventPassEmailHTML({
      guestName: pass.guestName,
      eventCode: pass.eventCode,
      eventName: pass.event.eventName,
      eventDate: formatDate(pass.event.startAt),
      eventTime: `${formatTime(pass.event.startAt)} - ${formatTime(pass.event.endAt)}`,
      hostName: pass.host.hostName,
      venueAddress: venueAddress || "Host's location",
      hostEmail: pass.host.email,
      hostMobile: pass.host.mobile,
      passUrl
    });

    // TODO: Integrate with your email service (SendGrid, Resend, Nodemailer, etc.)
    // For now, we'll just log and mark as sent
    console.log(`[EMAIL] Would send to ${recipientEmail}`);
    console.log(`[EMAIL] Subject: Your Event Pass - ${pass.event.eventName}`);
    console.log(`[EMAIL] HTML length: ${emailHTML.length} bytes`);
    
    // Mark email as sent in database
    await EventPass.findByIdAndUpdate(passId, {
      emailSent: true,
      emailSentAt: new Date()
    });

    // In production, integrate with your email service:
    // Example with SendGrid:
    // await sgMail.send({
    //   to: recipientEmail,
    //   from: 'noreply@dineathomesocial.com',
    //   subject: `Your Event Pass - ${pass.event.eventName}`,
    //   html: emailHTML
    // });

    return true;
  } catch (error) {
    console.error(`Failed to send email for pass ${passId}:`, error);
    return false;
  }
}

/**
 * Send event passes for all passes in a booking
 */
export async function sendEventPassesForBooking(bookingId: string, guestEmail: string): Promise<void> {
  await connectMongo();
  
  const passes = await EventPass.find({ bookingId, emailSent: false }).lean();
  
  for (const pass of passes) {
    const passDoc = pass as any;
    await sendEventPassEmail(String(passDoc._id), guestEmail);
  }
}
