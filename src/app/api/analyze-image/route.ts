import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Image analysis is not configured yet. Add ANTHROPIC_API_KEY to your environment variables.",
      },
      { status: 503 }
    );
  }

  try {
    const { image, mediaType } = await req.json();

    if (!image || !mediaType) {
      return NextResponse.json(
        { error: "Missing image data or media type" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: image,
                },
              },
              {
                type: "text",
                text: `Analyze this image. It may be a screenshot of a social media post about AI-generated content, or it may be an AI-generated image itself.

Extract and return as JSON (and ONLY valid JSON, no markdown, no code blocks, no explanation):
{
  "prompt_text": "the actual prompt text visible in the image, or a detailed description of what you see if no prompt text is visible",
  "model_name": "the AI model mentioned (e.g. Midjourney, Flux, Kling, Runway, Nano Banana Pro, ChatGPT, Claude, Sora, etc.) or null if not identifiable",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_title": "a short descriptive title for this prompt (max 60 chars)",
  "description": "brief description of the AI-generated result or content shown"
}

Important:
- If you see prompt text in the image (e.g. in a tweet, post caption, or overlaid text), extract it exactly as written
- If no prompt text is visible, describe what's in the image as if writing a prompt that would generate it
- For model_name, look for mentions like "made with Midjourney", model watermarks, or UI elements that indicate the tool
- Tags should be 2-4 relevant keywords (e.g. "cinematic", "portrait", "landscape", "vfx")
- Return ONLY valid JSON`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Anthropic API error:", errorData);
      return NextResponse.json(
        { error: "Failed to analyze image. Check your API key." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    // Parse the JSON response — handle possible markdown wrapping
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
