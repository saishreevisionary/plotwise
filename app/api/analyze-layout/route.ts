import { NextRequest, NextResponse } from 'next/server';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, provider, width, height } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image parameter is required' }, { status: 400 });
    }

    const selectedProvider =
      provider ||
      process.env.AI_PROVIDER ||
      (process.env.GEMINI_API_KEY ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : 'contour');

    const apiKey =
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENAI_API_KEY;

    const result = await LayoutAnalyzerService.analyzeLayout(image, {
      provider: selectedProvider as any,
      apiKey,
      imageWidth: width || 1600,
      imageHeight: height || 1200,
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
