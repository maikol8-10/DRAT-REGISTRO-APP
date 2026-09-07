import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SICAFColors as colors } from '@/constants/theme';

const processNames: Record<string, string> = {
  nfc: 'Escanear TAG NFC',
  ocr: 'Reconocer una placa',
  visitante: 'Registrar visitante',
  emergencia: 'Lista de emergencia',
};

export default function RegistrationScreen() {
  const { tipo } = useLocalSearchParams<{ tipo: string }>();
  const title = processNames[tipo] ?? 'Proceso SICAF';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Volver a la pantalla principal"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Text style={styles.backText}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.brand}>SICAF · DRAT</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>S</Text>
        </View>
        <Text style={styles.eyebrow}>PROCESO SELECCIONADO</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          La navegación base está funcionando. Este proceso se implementará en el entregable que le corresponde.
        </Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Base móvil preparada</Text>
          <Text style={styles.noticeText}>
            Esta pantalla provisional permite validar el flujo de navegación sin adelantar las integraciones de NFC, OCR o datos reales.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: { paddingVertical: 10, paddingRight: 16 },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  brand: { marginLeft: 'auto', color: colors.navy, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.65 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 64 },
  icon: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: colors.success,
  },
  iconText: { color: colors.card, fontSize: 38, fontWeight: '900', fontStyle: 'italic' },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', marginTop: 8 },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 14 },
  notice: {
    padding: 18,
    marginTop: 28,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    backgroundColor: colors.successLight,
  },
  noticeTitle: { color: '#087344', fontSize: 14, fontWeight: '800' },
  noticeText: { color: '#3F6554', fontSize: 13, lineHeight: 20, marginTop: 5 },
});
