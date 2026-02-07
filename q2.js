// Filter anagrams using Map.

const filterAnagrams = (arr) => {

    const map = new Map();

    for (const word of arr) {
        // Create a key by sorting characters
        const key = word.split("").sort().join("");

        // Initialize if key does not exist
        if (!map.has(key)) {
            map.set(key, []);
        }

        // Push word into its anagram group
        map.get(key).push(word);
    }

    // Return grouped anagrams
    return [...map.values()];
};

// Example usage
const words = ["eat", "tea", "tan", "ate", "nat", "bat"];
console.log(filterAnagrams(words));
