/**
 * Utility functions for sending inappropriate post reports via MailerLite
 */

/**
 * Submit an inappropriate post report to MailerLite
 * 
 * @param {Object} reportData - Report information
 * @param {string} reportData.postID - ID of the reported post
 * @param {string} reportData.postDate - Date the post was created
 * @param {string} reportData.postDescription - Description of the post
 * @param {string} reportData.userConcern - Reporter's concern
 * @param {string} reportData.reporter - Email of person reporting
 * @param {string} reportData.userWhoPosted - Email of post author
 * @returns {Promise} - Promise that resolves with the API response
 */
export const submitInappropriatePostReport = async (reportData) => {
  try {
    const response = await fetch("/api/sendMailerLiteReport", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportData,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit report');
    }
    
    return data;
  } catch (error) {
    console.error("Error submitting inappropriate post report:", error);
    throw error; // Re-throw to allow caller to handle the error
  }
};

/**
 * Format report data for MailerLite submission
 * 
 * @param {Object} postDoc - Post document from Firestore
 * @param {Object} userDoc - User document from Firestore  
 * @param {string} postId - Post ID
 * @param {string} userConcern - Reporter's concern
 * @param {string} reporterEmail - Reporter's email
 * @returns {Object} - Formatted report data
 */
export const formatReportData = (postDoc, userDoc, postId, userConcern, reporterEmail) => {
  const timestamp = postDoc.timePosted;
  const date = new Date(timestamp.seconds * 1000);
  const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;

  return {
    postID: postId,
    postDate: formattedDate,
    postDescription: postDoc.postDescription || 'No description',
    userConcern: userConcern || 'No specific concern provided',
    reporter: reporterEmail || 'anonymous user',
    userWhoPosted: userDoc.email || 'Unknown user',
  };
};
