import { getOpenAI, VISION_MODEL } from '@/lib/openai';

const MATRIX_EXTRACTION_PROMPT = `You are an expert at extracting structured club requirement data from matrix/table images.

Your task:
1. Identify ALL club names from column headers
2. Identify ALL category/requirement types from row labels
3. Extract the claim/requirement text for each (club, category) cell
4. Normalize claims into clear, canonical statements
5. Extract structured data (quantities, units, cadences) when possible

Output JSON format:
{
  "clubs": [
    { "name": "Project Lux" },
    { "name": "Medlife" },
    { "name": "AIM" }
  ],
  "claims_by_club": {
    "Project Lux": {
      "categories": [
        {
          "category_key": "attendance",
          "items": [
            {
              "raw_claim": "6/8 of the GMs",
              "normalized_claim": "Members must attend 6 out of 8 general meetings.",
              "structured": {
                "metric_type": "attendance",
                "requirement": {
                  "quantity": 6,
                  "out_of": 8,
                  "unit": "GMs",
                  "cadence": "per_quarter"
                }
              },
              "confidence": "high"
            }
          ]
        }
      ]
    }
  }
}

Rules:
- Extract ALL clubs shown in the image
- Use category keys: social, volunteer, fundraising, attendance, points, admin
- For N/A or empty cells, skip (don't create claims)
- Normalize text to be clear and professional
- Extract structured data when possible (quantities, cadences, units)
- If the claim mentions "done" or "completed", include that in structured data as completion status`;

export type MatrixExtractionOutput = {
  clubs: Array<{ name: string }>;
  claims_by_club: Record<string, {
    categories: Array<{
      category_key: string;
      items: Array<{
        raw_claim: string;
        normalized_claim: string;
        structured?: Record<string, unknown>;
        confidence: 'low' | 'medium' | 'high';
      }>;
    }>;
  }>;
};

export async function extractClaimsFromMatrix(
  imageUrl: string
): Promise<MatrixExtractionOutput> {
  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        { role: 'system', content: MATRIX_EXTRACTION_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all clubs and their requirements from this matrix table image.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in response');
    }

    const result = JSON.parse(content) as MatrixExtractionOutput;
    return result;
  } catch (error) {
    console.error('Error extracting claims from matrix:', error);
    throw error;
  }
}

