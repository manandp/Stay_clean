import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('calls onPress and exposes an accessible label', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continue" disabled onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
