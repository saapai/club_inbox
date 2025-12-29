import { getOpenAI, EXTRACTION_MODEL } from '@/lib/openai';
import { ExtractionOutput } from '@/lib/types';

const EXTRACTION_PROMPT = `You are an expert at extracting structured club requirement claims from text.

Your task:
1. Read the provided text about club requirements
2. Extract individual claims/requirements
3. Categorize them by type: social, volunteer, fundraising, attendance, points, admin, or unknown
4. Normalize the text into clear, canonical statements
5. Be conservative - prefer "unknown" to guessing

Output JSON format:
{
  "club_name_guess": "string",
  "categories": [
    {
      "category_key": "attendance",
      "items": [
        {
          "raw_claim": "original text from source",
          "normalized_claim": "clear, canonical statement",
          "structured": {
            "metric_type": "attendance",
            "requirement": {
              "quantity": 6,
              "out_of": 8,
              "unit": "GMs",
              "cadence": "per_quarter"
            }
          },
          "confidence": "medium",
          "evidence_refs": ["evidence_chunk_id"]
        }
      ]
    }
  ],
  "unassigned_items": []
}

Rules:
- Never invent numbers or details not in the source
- If unclear which category, put in unassigned_items
- Use conservative confidence levels
- Normalize text to be clear and professional
- Extract structured data when possible (quantities, cadences, etc.)`;

export async function extractClaimsFromPaste(
  text: string,
  evidenceChunkId: string,
  clubName: string = 'Unknown Club'
): Promise<ExtractionOutput> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: EXTRACTION_MODEL,
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Club: ${clubName}\n\nText to extract from:\n\n${text}\n\nEvidence chunk ID: ${evidenceChunkId}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const result = JSON.parse(content) as ExtractionOutput;

    // Add evidence refs to all items
    result.categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (!item.evidence_refs || item.evidence_refs.length === 0) {
          item.evidence_refs = [evidenceChunkId];
        }
      });
    });

    result.unassigned_items.forEach((item) => {
      if (!item.evidence_refs || item.evidence_refs.length === 0) {
        item.evidence_refs = [evidenceChunkId];
      }
    });

    return result;
  } catch (error) {
    console.error('Error extracting claims:', error);
    throw error;
  }
}

