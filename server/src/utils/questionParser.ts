export interface ParsedQuestion {
  question: string;
  type: 'multiple-choice';
  options: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
}

/**
 * Parse text file content into multiple-choice questions
 * Expected format:
 * Câu 1: Question text here
 * A. Option A
 * B. Option B
 * C. Option C
 * D. Option D
 * Đáp án: A
 * 
 * Câu 2: ...
 */
export const parseTextFile = (content: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentQuestion: Partial<ParsedQuestion> | null = null;
  let currentOptions: string[] = [];
  let currentOptionLabel = '';
  let inQuestion = false;
  let inOptions = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect question start (Câu X: or Question X: or just Câu X)
    const questionMatch = line.match(/^(Câu|Question)\s*(\d+)[:\.]?\s*(.+)$/i);
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentOptions.length >= 2 && currentQuestion.correctAnswer) {
        questions.push({
          question: currentQuestion.question || '',
          type: 'multiple-choice',
          options: currentOptions,
          correctAnswer: currentQuestion.correctAnswer,
          points: currentQuestion.points || 1,
          explanation: currentQuestion.explanation,
        });
      }
      
      // Start new question
      currentQuestion = {
        question: questionMatch[3],
        type: 'multiple-choice',
        points: 1,
      };
      currentOptions = [];
      currentOptionLabel = '';
      inQuestion = true;
      inOptions = false;
      continue;
    }

    // Detect answer line (Đáp án: or Answer:)
    const answerMatch = line.match(/^(Đáp án|Answer|Đáp|Key)[:\.]?\s*([A-D])/i);
    if (answerMatch && currentQuestion) {
      const answerIndex = answerMatch[2].charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (answerIndex >= 0 && answerIndex < currentOptions.length) {
        currentQuestion.correctAnswer = answerIndex.toString();
        inOptions = false;
        continue;
      }
    }

    // Detect option (A., B., C., D.)
    const optionMatch = line.match(/^([A-D])[\.\)]\s*(.+)$/i);
    if (optionMatch) {
      if (!currentQuestion) {
        // If no question header found, create one
        currentQuestion = {
          question: '',
          type: 'multiple-choice',
          points: 1,
        };
      }
      const optionIndex = optionMatch[1].charCodeAt(0) - 65;
      currentOptions[optionIndex] = optionMatch[2];
      inOptions = true;
      continue;
    }

    // If we're in a question and line doesn't match patterns, append to question or current option
    if (currentQuestion) {
      if (inOptions && currentOptions.length > 0) {
        // Append to last option
        const lastIndex = currentOptions.length - 1;
        if (currentOptions[lastIndex]) {
          currentOptions[lastIndex] += ' ' + line;
        }
      } else if (inQuestion && currentQuestion.question) {
        // Append to question text
        currentQuestion.question += ' ' + line;
      }
    }
  }

  // Save last question
  if (currentQuestion && currentOptions.length >= 2 && currentQuestion.correctAnswer) {
    questions.push({
      question: currentQuestion.question || '',
      type: 'multiple-choice',
      options: currentOptions,
      correctAnswer: currentQuestion.correctAnswer,
      points: currentQuestion.points || 1,
      explanation: currentQuestion.explanation,
    });
  }

  return questions;
};

/**
 * Alternative format parser - more flexible
 * Format: Question text\nA. Option\nB. Option\nC. Option\nD. Option\nAnswer: A
 */
export const parseFlexibleFormat = (content: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  
  // Split by double newlines or question markers
  const blocks = content.split(/\n\s*\n|(?=Câu\s*\d+|Question\s*\d+)/i).filter(block => block.trim().length > 0);
  
  for (const block of blocks) {
    const lines = block.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 5) continue; // Need at least question + 4 options + answer
    
    const question: Partial<ParsedQuestion> = {
      type: 'multiple-choice',
      points: 1,
    };
    const options: string[] = [];
    let correctAnswer = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Question line (first line or line with "Câu X:")
      if (i === 0 || line.match(/^(Câu|Question)\s*\d+/i)) {
        question.question = line.replace(/^(Câu|Question)\s*\d+[:\.]?\s*/i, '');
        continue;
      }
      
      // Option line
      const optionMatch = line.match(/^([A-D])[\.\)]\s*(.+)$/i);
      if (optionMatch) {
        const index = optionMatch[1].charCodeAt(0) - 65;
        options[index] = optionMatch[2];
        continue;
      }
      
      // Answer line
      const answerMatch = line.match(/^(Đáp án|Answer|Đáp|Key)[:\.]?\s*([A-D])/i);
      if (answerMatch) {
        const answerIndex = answerMatch[2].charCodeAt(0) - 65;
        if (answerIndex >= 0 && answerIndex < options.length) {
          correctAnswer = answerIndex.toString();
        }
        continue;
      }
      
      // If no match and we have a question, append to question
      if (question.question && !options.length) {
        question.question += ' ' + line;
      }
    }
    
    if (question.question && options.length >= 2 && correctAnswer) {
      questions.push({
        question: question.question,
        type: 'multiple-choice',
        options: options.filter(opt => opt), // Remove empty options
        correctAnswer,
        points: question.points || 1,
      });
    }
  }
  
  return questions;
};

/**
 * Main parser function - tries multiple formats
 */
export const parseQuestions = (content: string, fileType: string = 'txt'): ParsedQuestion[] => {
  try {
    // Try flexible format first
    const flexibleResults = parseFlexibleFormat(content);
    if (flexibleResults.length > 0) {
      return flexibleResults;
    }
    
    // Fallback to strict format
    return parseTextFile(content);
  } catch (error) {
    console.error('Error parsing questions:', error);
    return [];
  }
};






