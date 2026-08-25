import { NextRequest, NextResponse } from 'next/server';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, provider, preset, width, height, apiKey: clientApiKey } = body;

    if (!image && !preset) {
      return NextResponse.json({ error: 'Image parameter or preset is required' }, { status: 400 });
    }

    const targetWidth = Number(width) || 1200;
    const targetHeight = Number(height) || 1600;

    const selectedProvider =
      preset ||
      provider ||
      process.env.AI_PROVIDER ||
      (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'contour');

    const apiKey =
      clientApiKey ||
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENAI_API_KEY;

    const result = await LayoutAnalyzerService.analyzeLayout(image || '', {
      provider: selectedProvider as any,
      apiKey,
      imageWidth: targetWidth,
      imageHeight: targetHeight,
    });

    return NextResponse.json({ success: true, provider: selectedProvider, data: result });
  } catch (error: any) {
    console.error('Error analyzing layout blueprint:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze layout image' },
      { status: 500 }
    );
  }
}
