jest.mock('expo-localization', () => ({ getLocales: () => [{ regionCode: 'US', languageTag: 'en-US' }] }));
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
// Icon fonts are native assets; render icons as nothing in tests.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const Icon = () => null;
  Icon.glyphMap = {};
  return { __esModule: true, default: Icon };
});
