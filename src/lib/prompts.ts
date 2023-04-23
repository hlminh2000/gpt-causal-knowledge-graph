export const contextPrompt = (storyText: string) => `
You are an assistant tasked with answering questions about the following text:
\`\`\`
${storyText}
\`\`\`
`;

export const initialQuestionPrompt = (questionText: string) => `
In less than 20 words, answer this question: ${questionText}
`;

export const causePrompt = (eventText: string) => `
In the story, the following event happened:
\`\`\`
${eventText}
\`\`\`
Explain the event that caused this to happen. If there was no immediate cause, describe what happened before this event instead.
Answer as concisely as possible in less than 20 words.
`;
