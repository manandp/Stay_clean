import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from './alert';

export async function callNumber(digits: string): Promise<void> {
  try {
    await Linking.openURL(`tel:${digits}`);
  } catch {
    Alert.alert('Could not start a call', `Please dial ${digits} from your phone app.`);
  }
}

export async function textNumber(to: string, body?: string): Promise<void> {
  const url = body ? `sms:${to}?body=${encodeURIComponent(body)}` : `sms:${to}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open messages', `Please text ${to} from your messages app.`);
  }
}

export async function openWeb(url: string): Promise<void> {
  if (!url.startsWith('https://')) return;
  await WebBrowser.openBrowserAsync(url);
}
