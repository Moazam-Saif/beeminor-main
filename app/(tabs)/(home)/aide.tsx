import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdmin } from '../../../contexts/AdminContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function AideScreen() {
  const admin = useAdmin();
  const auth = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSendEmail = async () => {
    if (!subject.trim() || !message.trim()) {
      if (Platform.OS === 'web') {
        alert('Veuillez remplir tous les champs');
      } else {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      }
      return;
    }

    const userEmail = auth.currentUser?.email || 'Utilisateur anonyme';
    const userId = auth.currentUser?.id;
    const result = await admin.addSupportMessage(subject, message, userEmail, userId);

    if (result.success) {
      setSubject('');
      setMessage('');
      if (Platform.OS === 'web') {
        alert('Votre message a été envoyé avec succès. Notre équipe vous répondra dans les plus brefs délais.');
      } else {
        Alert.alert(
          'Message envoyé',
          'Votre message a été envoyé avec succès. Notre équipe vous répondra dans les plus brefs délais.'
        );
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      } else {
        Alert.alert('Erreur', 'Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Aide",
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
            <Text style={styles.headerTitle}>💬 Contactez-nous</Text>
            <Text style={styles.headerSubtitle}>Notre équipe est là pour vous aider</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>📧 Support Email</Text>
            <Text style={styles.infoText}>{admin.supportEmail}</Text>
            <Text style={styles.infoSubtext}>Réponse sous 24-48h</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Envoyez-nous un message</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sujet</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Problème de retrait"
                placeholderTextColor="#999"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez votre problème ou question..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendEmail}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>✉️ Envoyer le message</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Conseils avant de nous contacter</Text>
            <Text style={styles.tipItem}>• Vérifiez d&apos;abord la FAQ</Text>
            <Text style={styles.tipItem}>• Incluez des captures d&apos;écran si possible</Text>
            <Text style={styles.tipItem}>• Fournissez votre ID utilisateur</Text>
            <Text style={styles.tipItem}>• Décrivez le problème en détail</Text>
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
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#2d5016',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#4a7c26',
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#2d5016',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#2d5016',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4a7c26',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#2d5016',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  sendButton: {
    backgroundColor: '#4a7c26',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 8,
    lineHeight: 22,
  },
});
