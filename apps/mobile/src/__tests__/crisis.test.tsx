import { fireEvent, render, screen } from '@testing-library/react-native';
import Crisis from '@/app/crisis';
import { callNumber, textNumber } from '@/lib/links';

jest.mock('@/lib/links', () => ({ callNumber: jest.fn(), textNumber: jest.fn(), openWeb: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

describe('Crisis screen', () => {
  it('offers 988 call and text without any network', async () => {
    await render(<Crisis />);
    await fireEvent.press(screen.getByRole('button', { name: 'Call 988' }));
    expect(callNumber).toHaveBeenCalledWith('988');
    await fireEvent.press(screen.getAllByRole('button', { name: 'Text 988' })[0]!);
    expect(textNumber).toHaveBeenCalledWith('988', undefined);
  });

  it('pre-fills HOME for the Crisis Text Line', async () => {
    await render(<Crisis />);
    await fireEvent.press(screen.getByRole('button', { name: 'Text 741741' }));
    expect(textNumber).toHaveBeenCalledWith('741741', 'HOME');
  });

  it('lists emergency services', async () => {
    await render(<Crisis />);
    expect(screen.getByRole('button', { name: 'Call 911' })).toBeTruthy();
  });
});
