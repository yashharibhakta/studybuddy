import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LectureAnalysis, Flashcard, QuizQuestion } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Gemini 3 Pro Preview for superior reasoning and context adherence
const MODEL_NAME = 'gemini-3-pro-preview';

// Combined Analysis Schema
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Official academic title of the content." },
    summary: { type: Type.STRING, description: "Executive summary (approx 300 words). structured with 'Introduction', 'Core Concepts', and 'Conclusion'. Use Markdown formatting (bolding)." },
    keyPoints: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "5 Critical, exam-relevant facts or concepts extracted directly from the text." 
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          front: { type: Type.STRING, description: "Specific Term, Concept, or detailed Question found in the material." },
          back: { type: Type.STRING, description: "Precise, source-grounded definition or answer." }
        }
      },
      description: "5 High-yield Flashcards. Avoid generic fronts like 'What is this?'."
    },
    quizzes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: "Challenging exam-style question based EXCLUSIVELY on the text." },
          options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exactly 4 options: 1 correct, 3 plausible but wrong distractors." },
          correctAnswerIndex: { type: Type.INTEGER, description: "Index of correct option (0-3)." },
          explanation: { type: Type.STRING, description: "Detailed explanation quoting the text to prove why the answer is correct." }
        }
      },
      description: "3 Multiple Choice Questions to test deep understanding."
    }
  },
  required: ["title", "summary", "keyPoints", "flashcards", "quizzes"]
};

interface AnalysisInput {
  type: 'file' | 'text';
  data: string;
  mimeType?: string;
  title?: string;
}

// Helper to clean JSON string
const cleanJson = (text: string) => {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "");
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace === -1) return cleaned; 
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1 && lastBrace > firstBrace) {
      return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned.substring(firstBrace);
};

// Robust Stack-Based JSON Repair
const repairJson = (jsonStr: string): string => {
  let repaired = jsonStr.trim();
  if (repaired.endsWith("\\")) repaired = repaired.slice(0, -1);
  repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma

  // Basic stack to close braces
  const stack: string[] = [];
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '"' && !escape) inString = !inString;
      escape = (char === '\\' && !escape);
      if (inString) continue;
      
      if (char === '{' || char === '[') stack.push(char);
      else if (char === '}') { if (stack[stack.length - 1] === '{') stack.pop(); }
      else if (char === ']') { if (stack[stack.length - 1] === '[') stack.pop(); }
  }
  
  while (stack.length > 0) {
      const char = stack.pop();
      if (char === '{') repaired += '}';
      if (char === '[') repaired += ']';
  }
  return repaired;
};

// Fallback: Regex Extraction
const fallbackExtraction = (text: string): LectureAnalysis => {
  console.warn("Using Fallback Regex Extraction");
  
  const titleMatch = text.match(/"title"\s*:\s*"([^"]*?)"/);
  const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*?)"/);
  
  const keyPoints: string[] = [];
  const kpMatch = text.match(/"keyPoints"\s*:\s*\[([\s\S]*?)\]/);
  if (kpMatch) {
     const matches = kpMatch[1].matchAll(/"((?:[^"\\]|\\.)*?)"/g);
     for (const m of matches) keyPoints.push(m[1]);
  }

  // Flashcards extraction
  const flashcards: Flashcard[] = [];
  const fcMatches = text.matchAll(/"front"\s*:\s*"((?:[^"\\]|\\.)*?)"[\s\S]*?"back"\s*:\s*"((?:[^"\\]|\\.)*?)"/g);
  for (const m of fcMatches) {
    flashcards.push({ front: m[1], back: m[2] });
  }

  // Basic Quiz extraction (heuristic)
  const quizzes: QuizQuestion[] = [];
  const quizBlockRegex = /"question"\s*:\s*"([^"]+)"[\s\S]*?"options"\s*:\s*\[(.*?)\]/g;
  const quizMatches = text.matchAll(quizBlockRegex);
  
  for (const m of quizMatches) {
     const question = m[1];
     const optionsStr = m[2];
     const options = optionsStr.split(',').map(o => o.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"'));
     
     quizzes.push({
        question,
        options: options.slice(0, 4),
        correctAnswerIndex: 0, 
        explanation: "Explanation unavailable in fallback mode."
     });
  }

  return {
    title: titleMatch ? titleMatch[1] : "Untitled Analysis",
    summary: summaryMatch ? summaryMatch[1] : "Summary unavailable.",
    keyPoints: keyPoints.length > 0 ? keyPoints : ["Analysis completed partially."],
    flashcards: flashcards,
    quizzes: quizzes
  };
};

export const analyzeLectureContent = async (input: AnalysisInput): Promise<LectureAnalysis> => {
  const MAX_RETRIES = 2;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let contents;
      let tools: any[] = [];
      
      const config: any = {
        maxOutputTokens: 20000, 
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0.1, // Reduced temperature for stricter adherence to facts
        systemInstruction: `
          You are a strict, fact-based academic tutor and exam preparation expert.
          
          CORE DIRECTIVE:
          Generate a study guide based **EXCLUSIVELY** on the provided content. 
          Do not hallucinate facts. Do not bring in external information unless it is a standard dictionary definition required to understand the text.
          
          IF CONTENT IS EMPTY/IRRELEVANT:
          Return a JSON with "title": "Analysis Failed" and a summary explaining the issue.

          OUTPUT REQUIREMENTS:
          1. **Summary**: Structure with "Introduction", "Core Concepts", and "Conclusion". Focus on cause-and-effect.
          2. **Key Points**: Extract exactly 5 most exam-relevant facts (dates, formulas, key arguments).
          3. **Flashcards**: Create 5 cards. Front: Term/Question. Back: Specific definition/Answer from text.
          4. **Quiz**: Create 3 multiple choice questions.
             - Questions must be answerable purely from the text.
             - Distractors (wrong answers) must be plausible but definitively wrong based on the text.
             - Explanation must reference the text logic.

          FORMAT:
          Return raw JSON only, matching the specified schema.
        `
      };

      if (input.type === 'file' && input.mimeType) {
        // FILE MODE
        contents = {
          parts: [
            { inlineData: { mimeType: input.mimeType, data: input.data } },
            { text: "Analyze this file. Identify the main thesis, key arguments, and supporting evidence. Generate the study guide JSON." }
          ]
        };
        config.responseMimeType = "application/json";
        config.responseSchema = analysisSchema;
      } else {
        // URL/TEXT MODE
        tools = [{ googleSearch: {} }];
        contents = {
          parts: [{ text: `
            Target: ${input.title || 'Unknown Source'}
            Source Input: ${input.data}

            INSTRUCTIONS:
            1. If the input is a URL (e.g., YouTube), use Google Search to find the *transcript*, *captions*, or a *detailed academic summary* of this specific content. 
            2. Do not generalize based on the title. If you cannot find the specific content details, state that analysis failed.
            3. Generate the study guide JSON based *only* on the verified details found.
          ` }]
        };
        config.tools = tools;
        // We rely on the system instruction and prompt to enforce JSON structure for tools mode 
        // to avoid potential conflicts with Search tool in some model versions.
      }

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: contents,
        config: config
      });

      if (!response.text) throw new Error("Empty AI response");

      const cleanedText = cleanJson(response.text);
      let data: LectureAnalysis;

      try {
        data = JSON.parse(cleanedText) as LectureAnalysis;
      } catch (parseError) {
        console.warn(`JSON Parse failed (Attempt ${attempt}), trying repair...`);
        try {
          data = JSON.parse(repairJson(cleanedText)) as LectureAnalysis;
        } catch (repairError) {
           data = fallbackExtraction(response.text);
        }
      }

      if (data.title && (data.title.includes("Error") || data.title.includes("Analysis Failed"))) {
          throw new Error(data.summary || "Content analysis failed.");
      }

      // Validate & Sanitize Arrays
      if (!data.quizzes || !Array.isArray(data.quizzes)) data.quizzes = [];
      if (!data.flashcards || !Array.isArray(data.flashcards)) data.flashcards = [];
      
      data.quizzes = data.quizzes.map(q => ({
          question: q.question || "Untitled Question",
          options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ["True", "False"],
          correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
          explanation: q.explanation || "No explanation provided."
      })).filter(q => q.options.length > 0);

      return data;

    } catch (error: any) {
      console.error(`Attempt ${attempt} error:`, error);
      if (attempt === MAX_RETRIES) throw new Error(error.message || "Failed to analyze content");
    }
  }
  throw new Error("Analysis failed");
};

export const createChatSession = (context: string) => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      temperature: 0.3,
      systemInstruction: `
        You are a helpful AI Tutor.
        
        STRICT GROUNDING RULE:
        Answer ONLY using the information provided in the CONTEXT below.
        If the answer is not in the context, state: "I cannot find that information in the lecture material."
        
        CONTEXT:
        ${context.substring(0, 45000)}
      `
    }
  });
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
     const cleanText = text.replace(/[*#_`]/g, '');
     
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};
