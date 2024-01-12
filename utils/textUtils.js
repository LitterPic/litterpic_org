export const capitalizeFirstWordOfSentences = (str) => {
    // Check if the input looks like an email
    if (/\S+@\S+\.\S+/.test(str)) {
        // If it looks like an email, return the original string
        return str;
    }

    // Capitalize the first letter of each new sentence
    let result = str.replace(/([.!?])\s*([a-z])/g, (match, p1, p2) => `${p1} ${p2.toUpperCase()}`);

    // Capitalize the first letter of the entire text
    if (result.length > 0) {
        result = result.charAt(0).toUpperCase() + result.slice(1);
    }

    return result;
};




