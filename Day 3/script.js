let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let note of notes) {
        if (note.text.length > longest.text.length) {
            longest = note;
        }
    }

    return longest;
}
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category]) {
            counts[note.category]++;
        } else {
            counts[note.category] = 1;
        }
    }

    return counts;
}
function getSummary() {
    const counts = countByCategory();
    const total = notes.length;
    const word = total === 1 ? "note" : "notes";

    return `${total} ${word}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}
function isDuplicate(text) {
    return notes.some(note =>
        note.text.trim().toLowerCase() === text.trim().toLowerCase()
    );
}
function addNote(text, category) {
    text = text.trim();

    if (text.length < 1 || text.length > 200) {
        console.log("Note must be between 1 and 200 characters.");
        return false;
    }

    if (isDuplicate(text)) {
        console.log("Note already exists.");
        return false;
    }

    if (!["personal", "work", "study"].includes(category)) {
        console.log("Invalid category.");
        return false;
    }

    const newNote = {
        id: notes.length + 1,
        text: text,
        category: category
    };

    notes.push(newNote);
    return true;
} 
// Test searchNotes
console.log(searchNotes("day 3")); // Expected: [{ id: 2, text: "Finish the Day 3 assignment", category: "study" }]
console.log(searchNotes("pizza")); // Expected: []

// Test longestNote
console.log(longestNote()); // Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

notes = [];
console.log(longestNote()); // Expected: null

notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// Test countByCategory
console.log(countByCategory()); // Expected: { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory()); // Expected: {}

notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// Test getSummary
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."

notes = [
  { id: 1, text: "Call mum", category: "personal" }
];
console.log(getSummary()); // Expected: "1 note: 1 personal, 0 work, 0 study."

notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];

// Test isDuplicate
console.log(isDuplicate("  CALL MUM  ")); // Expected: true
console.log(isDuplicate("Buy a new phone")); // Expected: false

// Test addNote
console.log(addNote("Read a new book", "personal")); // Expected: true
console.log(addNote("  READ A NEW BOOK  ", "personal")); // Expected: false
console.log(addNote("", "work")); // Expected: false
console.log(addNote("Prepare presentation", "other")); // Expected: false

// Restore the original starting data
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];