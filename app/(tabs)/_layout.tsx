import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Hexagon, ListTodo } from 'lucide-react-native';
import { View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopBar from '../../components/TopBar';
import { useLanguage } from '../../contexts/LanguageContext';

const isWeb = Platform.OS === 'web';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  return (
    <>
      <View style={{ 
        paddingTop: isWeb ? 0 : insets.top, 
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <TopBar />
      </View>
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: '#8B4513',
        tabBarStyle: {
          backgroundColor: '#FFF8DC',
          borderTopColor: '#FFD700',
          borderTopWidth: 2,
          height: isWeb ? 70 : 90,
          paddingBottom: isWeb ? 8 : 20,
          paddingTop: isWeb ? 8 : 5,
        },
        tabBarLabelStyle: {
          fontSize: isWeb ? 12 : 10,
          fontWeight: '600' as const,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t.hive,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: t.shop,
          tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="alveole"
        options={{
          title: t.alveole,
          tabBarIcon: ({ color, size }) => <Hexagon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="taches"
        options={{
          title: t.tasks,
          tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: t.menu,
          tabBarIcon: ({ color, size }) => (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: size, height: size, justifyContent: 'space-around', alignItems: 'center' }}>
              <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: color, borderRadius: size * 0.35 }} />
              <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: color, borderRadius: size * 0.35 }} />
              <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: color, borderRadius: size * 0.35 }} />
              <View style={{ width: size * 0.35, height: size * 0.35, backgroundColor: color, borderRadius: size * 0.35 }} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
        }}
      />
      </Tabs>
    </>
  );
}
