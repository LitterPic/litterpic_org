const parseUrls = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    let html = text.replace(urlPattern, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    // Replace newlines with <br /> to preserve formatting
    return html.replace(/\n/g, '<br />');
};

export default parseUrls;