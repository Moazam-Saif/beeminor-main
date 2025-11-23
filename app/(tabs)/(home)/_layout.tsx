import { Stack } from 'expo-router';

export default function HomeLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="faq" options={{ headerShown: true, title: 'FAQ', headerStyle: { backgroundColor: '#4a7c26' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="aide" options={{ headerShown: true, title: 'Aide', headerStyle: { backgroundColor: '#4a7c26' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="compte" options={{ headerShown: true, title: 'Détail du compte', headerStyle: { backgroundColor: '#4a7c26' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="historique" options={{ headerShown: true, title: 'Historique', headerStyle: { backgroundColor: '#4a7c26' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: true, title: 'Classement', headerStyle: { backgroundColor: '#FFD700' }, headerTintColor: '#8B4513' }} />
      <Stack.Screen name="menu" />
    </Stack>
  );
}


