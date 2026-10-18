import { showDialog } from '@/components/web-dialog';

/** React Native Web's Alert does nothing, so the browser demo draws its own dialog. */
export const Alert = {
  alert: showDialog,
};
