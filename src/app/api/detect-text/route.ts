import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ hasText: false }, { status: 200 });
  }

  try {
    const { image, mediaType } = await req.json();

    if (!image || !mediaType) {
      return NextResponse.json({ hasText: false }, { status: 200 });
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
        max_tokens: 256,
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
                text: `Look at this image quickly. Does it contain readable text that appears to be an AI prompt, caption, social media post text, or description of how an image/video was generated?

Return ONLY valid JSON (no markdown, no explanation):
{"hasText": true/false, "textPreview": "first 80 chars of the text you see, or empty string if no text"}

Rules:
- hasText should be true ONLY if there's meaningful text visible (not just watermarks, logos, or single words)
- Focus on text that looks like prompts, captions, or descriptions
- textPreview should be a brief snippet of what you see`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ hasText: false }, { status: 200 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    return NextResponse.json({
      hasText: !!result.hasText,
      textPreview: result.textPreview || "",
    });
  } catch {
    return NextResponse.json({ hasText: false }, { status: 200 });
  }
}
