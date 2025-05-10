/**
 * Utility functions for sending emails
 */

/**
 * Send an email using the SendGrid API
 * 
 * @param {string} email - Recipient email address
 * @param {string} templateId - SendGrid template ID
 * @param {Object} templateData - Data to populate the template
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendEmail = async (email, templateId, templateData) => {
  try {
    const response = await fetch("/api/sendEmail", {
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
    return data;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Send a notification email about a new post
 * 
 * @param {string} recipientEmail - Email address to send notification to
 * @param {string} postDescription - Description of the post
 * @param {number} litterWeight - Weight of litter collected
 * @param {Date} timePosted - When the post was created
 * @param {string} location - Location of the post
 * @param {string} userEmail - Email of user who created the post
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendNewPostNotificationEmail = async (
  recipientEmail,
  postDescription,
  litterWeight,
  timePosted,
  location,
  userEmail
) => {
  const templateId = "d-b649ac68d4ab4214969dc87c6e6e7814";
  const templateData = {
    postDescription,
    litterWeight,
    timePosted: timePosted instanceof Date ? timePosted.toDateString() : timePosted,
    location,
    userWhoAdded: userEmail,
  };
  
  return sendEmail(recipientEmail, templateId, templateData);
};


/**
 * Send a notification email about a new user enrollment
 *
 * @param {string} recipientEmail - Email address to send notification to
 * @param {string} userEmail - Email of user who enrolled
 * @returns {Promise} - Promise that resolves with the API response
 */
export const sendNewUserEnrollmentEmail = async (
    recipientEmail,
    userEmail
) => {
  const templateId = "d-2e5eae9b819246a9947dda25f4f18f30";
  const templateData = {
    userWhoAdded: userEmail,
  };

  return sendEmail(recipientEmail, templateId, templateData);
};