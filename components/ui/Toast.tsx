import { create } from 'zustand';
import { Snackbar } from 'react-native-paper';
import { Colors } from '@/constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible:  boolean;
  message:  string;
  type:     ToastType;
  show:     (msg: string, type?: ToastType) => void;
  hide:     () => void;
}

export const useToast = create<ToastState>((set) => ({
  visible:  false,
  message:  '',
  type:     'info',
  show:     (message, type = 'info') => set({ visible: true, message, type }),
  hide:     () => set({ visible: false }),
}));

const typeColors: Record<ToastType, string> = {
  success: Colors.teal,
  error:   Colors.error,
  info:    Colors.ink,
};

export function ToastProvider() {
  const { visible, message, type, hide } = useToast();

  return (
    <Snackbar
      visible={visible}
      onDismiss={hide}
      duration={2800}
      style={{ backgroundColor: typeColors[type], borderRadius: 12, marginBottom: 20 }}
      action={{ label: '✕', onPress: hide, textColor: Colors.white }}
    >
      {message}
    </Snackbar>
  );
}