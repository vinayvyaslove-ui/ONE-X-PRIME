import * as speech from '@google-cloud/speech';
import * as translate from '@google-cloud/translate';
import * as textToSpeech from '@google-cloud/text-to-speech';

export class VoiceEngine {
  private speechClient: speech.SpeechClient;
  private translateClient: translate.Translate;
  private ttsClient: textToSpeech.TextToSpeechClient;
  
  private languages = {
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    'bn': 'Bengali',
    'gu': 'Gujarati',
    'mr': 'Marathi',
    'kn': 'Kannada',
    'ml': 'Malayalam',
    'pa': 'Punjabi',
    'or': 'Odia'
  };

  constructor() {
    this.speechClient = new speech.SpeechClient();
    this.translateClient = new translate.Translate();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
  }

  async processVoice(audioBuffer: Buffer, languageCode: string = 'hi-IN') {
    try {
      // Speech to Text
      const [transcription] = await this.speechClient.recognize({
        audio: { content: audioBuffer.toString('base64') },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
        },
      });

      const text = transcription.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n') || '';

      return {
        text,
        language: languageCode.split('-')[0],
        confidence: transcription.results?.[0]?.alternatives?.[0]?.confidence || 0
      };
    } catch (error) {
      throw new Error(`Voice processing failed: ${error.message}`);
    }
  }

  async translateText(text: string, targetLanguage: string) {
    const [translation] = await this.translateClient.translate(text, targetLanguage);
    return translation;
  }

  async textToSpeech(text: string, languageCode: string = 'hi-IN', voiceGender: 'male' | 'female' = 'female') {
    const voiceConfig = {
      'hi-IN': voiceGender === 'male' ? 'hi-IN-Standard-A' : 'hi-IN-Standard-C',
      'ta-IN': voiceGender === 'male' ? 'ta-IN-Standard-A' : 'ta-IN-Standard-C',
      'te-IN': voiceGender === 'male' ? 'te-IN-Standard-A' : 'te-IN-Standard-C',
      'bn-IN': voiceGender === 'male' ? 'bn-IN-Standard-A' : 'bn-IN-Standard-C',
      'gu-IN': voiceGender === 'male' ? 'gu-IN-Standard-A' : 'gu-IN-Standard-C'
    };

    const request = {
      input: { text },
      voice: {
        languageCode: languageCode,
        name: voiceConfig[languageCode] || 'hi-IN-Standard-C',
        ssmlGender: voiceGender === 'male' ? 'MALE' : 'FEMALE'
      },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    const [response] = await this.ttsClient.synthesizeSpeech(request);
    return response.audioContent;
  }
}