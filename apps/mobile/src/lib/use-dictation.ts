import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

/**
 * Speech-to-text that stays on the phone when the device supports it. No
 * audio is saved or uploaded; only the transcript reaches the text box.
 */
export function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const base = useRef('');

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    onText(`${base.current}${base.current && transcript ? ' ' : ''}${transcript}`);
  });
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      Alert.alert('Voice input stopped', 'You can keep typing instead.');
    }
  });

  const start = useCallback(async (currentText: string) => {
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      Alert.alert('Voice input is not available', 'You can type your entry instead.');
      return;
    }
    const onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
    if (!onDevice) {
      Alert.alert(
        'Voice input on this phone',
        "This phone can't turn speech into text by itself, so your phone's speech service would process the audio. You can type instead if you prefer.",
      );
    }
    const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!perm.granted) return;
    base.current = currentText.trim();
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: onDevice,
      addsPunctuation: true,
    });
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
    setListening(false);
  }, []);

  return { listening, start, stop };
}
