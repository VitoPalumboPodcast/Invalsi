import { GoogleGenAI, Type } from "@google/genai";
import { Subject, GradeLevel, Question, QuestionType } from "../types";
import { getStaticQuestions } from "./questionBank";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Updated model to a recommended model for complex text tasks as per Gemini API guidelines.
const modelId = "gemini-3-pro-preview"; 

// Shared schema for both generation functions
const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        text: { type: Type.STRING, description: "Il testo della domanda. Usa apici unicode per le potenze (es. cm²)." },
        contextText: { type: Type.STRING, description: "Testo di lettura o contesto (es. brano, problema geometrico descritto)", nullable: true },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING, description: "Opzione di risposta. Usa apici unicode per le potenze." },
          minItems: 4,
          maxItems: 4
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "Indice base 0 della risposta corretta (0-3)" },
        explanation: { type: Type.STRING, description: "Spiegazione didattica della soluzione" },
        topic: { type: Type.STRING, description: "Ambito (es. Spazio e figure, Riflessione sulla lingua, Reading B1)" }
      },
      required: ["id", "text", "options", "correctAnswerIndex", "explanation", "topic"],
      propertyOrdering: ["id", "topic", "contextText", "text", "options", "correctAnswerIndex", "explanation"]
    }
  };


export const generateQuestionsFromText = async (
  customText: string,
  subject: Subject,
  grade: GradeLevel,
  count: number
): Promise<Question[]> => {
  const prompt = `
    Agisci come un esperto redattore di prove INVALSI CBT per la scuola italiana.
    Il tuo compito è generare un set di domande a scelta multipla (4 opzioni) basate ESCLUSIVAMENTE sul testo fornito dall'utente.
    
    Materia di riferimento (per lo stile e la difficoltà): ${subject}
    Livello scolastico: ${grade}
    Numero di domande da generare: ${count}

    TESTO FORNITO DALL'UTENTE:
    ---
    ${customText}
    ---

    Regole FONDAMENTALI:
    1.  Tutte le domande, le opzioni e le risposte corrette devono derivare DIRETTAMENTE e UNICAMENTE dal contenuto del testo fornito. Non usare conoscenze esterne.
    2.  Crea domande che verifichino la comprensione, l'analisi e l'inferenza del testo.
    3.  Formula opzioni plausibili ma errate (distrattori).
    4.  Fornisci una spiegazione ('explanation') concisa ma chiara, citando parti del testo a supporto della risposta corretta.
    5.  Assegna un 'topic' appropriato (es. "Comprensione del testo", "Analisi lessicale", "Inferenza logica").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.4,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as Question[];
      return data.map((q, idx) => ({
        ...q,
        type: QuestionType.MULTIPLE_CHOICE,
        contextText: customText, // Aggiungi il testo originale come contesto
        id: `custom-${idx}-${Date.now()}`
      }));
    }
    return [];
  } catch (error) {
    console.error("Errore nella generazione delle domande dal testo:", error);
    throw error;
  }
};


export const generateInvalsiTest = async (
  subject: Subject,
  grade: GradeLevel,
  count: number
): Promise<Question[]> => {
  
  // 1. Try to fetch static questions first
  const staticQuestions = getStaticQuestions(subject, grade);
  
  // If we have enough static questions to fulfill the request completely
  if (staticQuestions.length >= count) {
    // Return the first 'count' questions to preserve sequence/grouping of related questions
    return staticQuestions.slice(0, count);
  }

  // If we need more questions than available in static bank
  const questionsNeeded = count - staticQuestions.length;

  const prompt = `
    Agisci come un esperto redattore di prove INVALSI CBT (Computer Based Training) per la scuola italiana.
    Genera una prova simulata di ${subject} per studenti di ${grade}.
    
    Riferimento stilistico: Ispirati alle prove ufficiali rilasciate da CINECA/INVALSI (es. annate 2018-2019-2021).
    Per la "Seconda Superiore (Grado 10)", le domande devono essere rigorose e conformi ai quadri di riferimento.

    Genera esattamente ${questionsNeeded} domande.
    
    Regole specifiche:
    1. Le domande devono essere a scelta multipla (4 opzioni: A, B, C, D).
    2. Se la materia è Italiano o Inglese (Reading), raggruppa le domande attorno a 1 o 2 testi di riferimento (campo 'contextText'). Il testo deve essere di complessità adeguata al grado.
    3. Per Matematica Grado 10: includi Algebra, Geometria, Relazioni e Funzioni, Dati e Previsioni. Le domande non devono richiedere calcolatrice complessa.
    4. Per Inglese Grado 10: livello B1/B2 (QCER).
    5. Fornisci una spiegazione ('explanation') dettagliata che aiuti lo studente a capire l'errore, utile per la modalità "Allenamento".
    
    IMPORTANTE - FORMATTAZIONE MATEMATICA E TESTUALE:
    - Per le potenze, NON usare MAI il simbolo '^' (es. 2^3 è VIETATO).
    - Usa ESCLUSIVAMENTE i caratteri Unicode per gli apici (es. 2³, x², 10⁻¹, cm³, yᵃ).
    - Scrivi le formule in modo che siano leggibili e professionali (es. "3x² + 2y" invece di "3x^2 + 2y").
  `;

  try {
    let aiQuestions: Question[] = [];

    if (questionsNeeded > 0) {
        const response = await ai.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.3, 
        },
        });

        if (response.text) {
          const data = JSON.parse(response.text) as Question[];
          aiQuestions = data.map((q, idx) => ({
              ...q,
              type: QuestionType.MULTIPLE_CHOICE, // Default for AI generated questions for now
              id: q.id || `q-${idx}-${Date.now()}`
          }));
        }
    }

    // Combine static and AI questions
    // We append AI questions after static ones to maintain the static order (often topic grouped)
    return [...staticQuestions, ...aiQuestions];

  } catch (error) {
    console.error("Errore nella generazione del test:", error);
    // If API fails but we have static questions, return at least those
    if (staticQuestions.length > 0) {
        return staticQuestions;
    }
    throw error;
  }
};