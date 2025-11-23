import { Stack } from 'expo-router';

export default function MenuLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="roulette" />
      <Stack.Screen name="retrait" />
      <Stack.Screen name="echange" />
      <Stack.Screen name="wallet" />
    </Stack>
  );
}
