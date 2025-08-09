/**
 * Utility functions for sending emails via MailerSend
 */

/**
 * Send an email using the MailerSend API
 * 
 * @param {string} email - Recipient email address
 * @param {string} templateId - MailerSend template ID
 * @param {Object} templateData - Data to populate the template
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendMailerSendEmail = async (email, templateId, templateData) => {
  try {
    const response = await fetch("/api/sendMailerSendEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        templateId,
        templateData,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    return data;
  } catch (error) {
    console.error("Error sending MailerSend email:", error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Send RSVP confirmation email to participant
 * NOTE: Currently not used - RSVP emails still use original system
 * This function is available for future migration if needed
 *
 * @param {string} participantEmail - Email address of the person who RSVP'd
 * @param {Object} eventData - Event information
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendRSVPConfirmationEmail = async (participantEmail, eventData) => {
  const templateId = "pxkjn41xv7pgz781"; // Your MailerSend template ID

  const templateData = {
    eventDate: eventData.eventDate,
    eventStartTime: eventData.eventStartTime,
    eventEndTime: eventData.eventEndTime,
    eventLocation: eventData.eventLocation
  };

  return sendMailerSendEmail(participantEmail, templateId, templateData);
};

/**
 * Send event creation confirmation email to organizer
 * 
 * @param {string} organizerEmail - Email address of the event organizer
 * @param {Object} eventData - Event information
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendEventCreationConfirmationEmail = async (organizerEmail, eventData) => {
  const templateId = "pxkjn41xv7pgz781"; // Same template for now
  
  const templateData = {
    eventDate: eventData.eventDate,
    eventStartTime: eventData.eventStartTime,
    eventEndTime: eventData.eventEndTime,
    eventLocation: eventData.eventLocation
  };
  
  return sendMailerSendEmail(organizerEmail, templateId, templateData);
};
