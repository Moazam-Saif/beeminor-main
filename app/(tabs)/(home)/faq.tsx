import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const faqData = [
  {
    question: "Comment gagner plus de miel ?",
    answer: "Achetez plus d'abeilles dans l'onglet Ruche pour augmenter votre production de miel par heure."
  },
  {
    question: "À quoi servent les fleurs ?",
    answer: "Les fleurs sont la monnaie premium du jeu. Vous pouvez les échanger contre des cryptomonnaies ou les utiliser dans la boutique."
  },
  {
    question: "Comment inviter des amis ?",
    answer: "Rendez-vous dans l'onglet Tâches pour obtenir votre lien d'invitation et suivre vos filleuls."
  },
  {
    question: "Qu'est-ce que la roulette ?",
    answer: "La roulette vous permet de gagner des récompenses aléatoires en utilisant des tickets que vous pouvez obtenir en accomplissant des missions."
  },
  {
    question: "Comment retirer mes gains ?",
    answer: "Allez dans l'onglet Menu > Retrait pour convertir vos BVR en SOL sur le réseau Solana."
  },
  {
    question: "Quel est le minimum pour un retrait ?",
    answer: "Le montant minimum de retrait varie selon la cryptomonnaie. Vérifiez dans la section Retrait."
  },
  {
    question: "Comment fonctionne le système de parrainage ?",
    answer: "Vous gagnez 10% du premier dépôt de votre filleul et 6% à vie sur tous ses dépôts futurs."
  },
  {
    question: "Où puis-je voir mes transactions ?",
    answer: "Consultez l'historique de vos transactions dans Menu > Historique de transactions."
  }
];

export default function FAQScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "FAQ",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#4a7c26',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
        }} 
      />
      <LinearGradient
        colors={['#2d5016', '#3d6b1f', '#4a7c26']}
        style={styles.gradient}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>❓ Questions Fréquentes</Text>
            <Text style={styles.headerSubtitle}>Trouvez des réponses à vos questions</Text>
          </View>

          {faqData.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.answer}>{item.answer}</Text>
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Vous avez d&apos;autres questions ? Contactez-nous via l&apos;onglet Aide.
            </Text>
          </View>

          <View style={styles.developerInfo}>
            <Text style={styles.developerText}>
              Application développée par le Fondateur Rémy MARTIN
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  faqItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#2d5016',
    marginBottom: 12,
  },
  answer: {
    fontSize: 15,
    color: '#4a7c26',
    lineHeight: 22,
  },
  footer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 20,
  },
  developerInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  developerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
});
