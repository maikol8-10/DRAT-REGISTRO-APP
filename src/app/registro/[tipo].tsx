import { Redirect, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SICAFColors as colors } from '@/constants/theme';
import { useSession } from '@/auth/SessionContext';
import { confirmManualMovement, confirmNfcMovement, getPresenceCount, resolveManualMovement, resolveNfcMovement, searchActiveEmployees, type Employee, type ManualMovementResolution, type NfcMovementResolution } from '@/services/api';

const processNames: Record<string, string> = {
  nfc: 'Escanear TAG NFC',
  ocr: 'Reconocer una placa',
  visitante: 'Registrar visitante',
  emergencia: 'Lista de emergencia',
};

export default function RegistrationScreen() {
  const { tipo } = useLocalSearchParams<{ tipo: string }>();
  if (tipo === 'nfc') return <NfcSimulationScreen />;
  if (tipo === 'peatonal') return <ManualEmployeeMovementScreen />;
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

function ManualEmployeeMovementScreen() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [resolution, setResolution] = useState<ManualMovementResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!session) return <Redirect href={'/login' as Href} />;

  async function findEmployees() {
    if (!session || !search.trim()) { setError('Escriba el nombre o la identificación.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try { setEmployees(await searchActiveEmployees(session.token, search)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible buscar funcionarios'); }
    finally { setLoading(false); }
  }

  async function selectEmployee(employee: Employee) {
    if (!session) return;
    setLoading(true); setError('');
    try { setResolution(await resolveManualMovement(session.token, employee.id)); setEmployees([]); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible validar al funcionario'); }
    finally { setLoading(false); }
  }

  async function confirm() {
    if (!session || !resolution) return;
    setLoading(true); setError('');
    try {
      await confirmManualMovement(session.token, resolution.employee.id, resolution.proposedMovement);
      const count = await getPresenceCount(session.token);
      setSuccess(`${resolution.proposedMovement === 'INGRESO' ? 'Ingreso' : 'Salida'} registrado. Aforo actual: ${count} ${count === 1 ? 'persona' : 'personas'}.`);
      setResolution(null); setSearch('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible registrar el movimiento'); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Volver</Text></Pressable><Text style={styles.brand}>SICAF · DRAT</Text></View>
    <ScrollView contentContainerStyle={styles.nfcContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>CONTROL DE AFORO</Text><Text style={styles.title}>Funcionario a pie</Text><Text style={styles.description}>Identifique al funcionario mediante una búsqueda autorizada por nombre o identificación.</Text>
      {!resolution && <><Text style={styles.fieldLabel}>Buscar funcionario</Text><TextInput placeholder="Nombre o identificación" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={styles.input} onSubmitEditing={() => void findEmployees()} /><Pressable disabled={loading} onPress={() => void findEmployees()} style={styles.primaryButton}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Buscar</Text>}</Pressable>
      <View style={styles.employeeResults}>{employees.map((employee) => <Pressable key={employee.id} onPress={() => void selectEmployee(employee)} style={styles.employeeResult}><Text style={styles.employeeResultName}>{employee.name}</Text><Text style={styles.employeeDetail}>{employee.identification} · {employee.department}</Text><Text style={styles.selectText}>Seleccionar ›</Text></Pressable>)}</View></>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{success ? <Text style={styles.success}>{success}</Text> : null}
      {resolution && <View style={styles.confirmCard}><Text style={styles.confirmLabel}>FUNCIONARIO SELECCIONADO</Text><Text style={styles.employeeName}>{resolution.employee.name}</Text><Text style={styles.employeeDetail}>{resolution.employee.identification} · {resolution.employee.department}</Text><View style={[styles.movementBadge, resolution.proposedMovement === 'SALIDA' && styles.exitBadge]}><Text style={styles.movementText}>Movimiento propuesto: {resolution.proposedMovement}</Text></View><Text style={styles.confirmQuestion}>¿Confirma el movimiento peatonal?</Text><Pressable disabled={loading} onPress={() => void confirm()} style={styles.primaryButton}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirmar {resolution.proposedMovement.toLowerCase()}</Text>}</Pressable><Pressable onPress={() => { setResolution(null); setSearch(''); }} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar operación</Text></Pressable></View>}
      <View style={styles.notice}><Text style={styles.noticeTitle}>Registro autorizado</Text><Text style={styles.noticeText}>Solo se muestran funcionarios activos. El movimiento conserva persona, tipo, fecha, hora y usuario operador.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

function NfcSimulationScreen() {
  const { session } = useSession();
  const [code, setCode] = useState('');
  const [resolution, setResolution] = useState<NfcMovementResolution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!session) return <Redirect href={'/login' as Href} />;

  async function simulate() {
    if (!session || !code.trim()) { setError('Ingrese el código de un TAG NFC.'); return; }
    setLoading(true); setError(''); setSuccess(''); setResolution(null);
    try { setResolution(await resolveNfcMovement(session.token, code)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible validar el TAG'); }
    finally { setLoading(false); }
  }

  async function confirm() {
    if (!session || !resolution) return;
    setLoading(true); setError('');
    try {
      await confirmNfcMovement(session.token, resolution.tag.code, resolution.proposedMovement);
      setSuccess(`${resolution.proposedMovement === 'INGRESO' ? 'Ingreso' : 'Salida'} registrado correctamente para ${resolution.employee.name}.`);
      setResolution(null); setCode('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible registrar el movimiento'); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Volver</Text></Pressable><Text style={styles.brand}>SICAF · DRAT</Text></View>
    <ScrollView contentContainerStyle={styles.nfcContent} keyboardShouldPersistTaps="handled">
      <View style={styles.testBadge}><Text style={styles.testBadgeText}>MODO DE PRUEBA NFC · SIN LECTURA FÍSICA</Text></View>
      <Text style={styles.eyebrow}>MOVIMIENTO DE FUNCIONARIO</Text><Text style={styles.title}>Simular lectura de TAG</Text>
      <Text style={styles.description}>Digite el código registrado en Administración. El sistema identificará al funcionario y propondrá el siguiente movimiento válido.</Text>
      <Text style={styles.fieldLabel}>Código NFC simulado</Text><TextInput autoCapitalize="characters" placeholder="Ejemplo: TAG-ANDRES-01" placeholderTextColor={colors.muted} value={code} onChangeText={setCode} editable={!resolution} style={styles.input} onSubmitEditing={() => void simulate()} />
      {!resolution && <Pressable disabled={loading} onPress={() => void simulate()} style={styles.primaryButton}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Simular lectura NFC</Text>}</Pressable>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{success ? <Text style={styles.success}>{success}</Text> : null}
      {resolution && <View style={styles.confirmCard}><Text style={styles.confirmLabel}>FUNCIONARIO IDENTIFICADO</Text><Text style={styles.employeeName}>{resolution.employee.name}</Text><Text style={styles.employeeDetail}>{resolution.employee.identification} · {resolution.employee.department}</Text><View style={[styles.movementBadge, resolution.proposedMovement === 'SALIDA' && styles.exitBadge]}><Text style={styles.movementText}>Movimiento propuesto: {resolution.proposedMovement}</Text></View><Text style={styles.confirmQuestion}>¿Desea registrar este movimiento?</Text><Pressable disabled={loading} onPress={() => void confirm()} style={styles.primaryButton}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirmar {resolution.proposedMovement.toLowerCase()}</Text>}</Pressable><Pressable disabled={loading} onPress={() => { setResolution(null); setCode(''); setError(''); }} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar operación</Text></Pressable></View>}
      <View style={styles.notice}><Text style={styles.noticeTitle}>Validaciones activas</Text><Text style={styles.noticeText}>Un TAG desconocido, inactivo, duplicado o asociado con un funcionario inactivo no crea movimientos automáticamente.</Text></View>
    </ScrollView>
  </SafeAreaView>;
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
  nfcContent: { padding: 22, paddingBottom: 45 },
  testBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, marginBottom: 24, borderRadius: 999, backgroundColor: '#FFF3D5' },
  testBadgeText: { color: '#7D4C00', fontSize: 9, fontWeight: '900', letterSpacing: .5 },
  fieldLabel: { marginTop: 24, marginBottom: 7, color: colors.text, fontSize: 12, fontWeight: '800' },
  input: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 11, color: colors.text, backgroundColor: '#fff' },
  primaryButton: { minHeight: 49, alignItems: 'center', justifyContent: 'center', marginTop: 13, paddingHorizontal: 16, borderRadius: 11, backgroundColor: colors.primary },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  error: { marginTop: 14, padding: 12, borderRadius: 10, color: '#9A2E2E', backgroundColor: '#FBEAEA' },
  success: { marginTop: 14, padding: 12, borderRadius: 10, color: '#087344', backgroundColor: colors.successLight },
  confirmCard: { padding: 18, marginTop: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#fff' },
  confirmLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, employeeName: { marginTop: 8, color: colors.text, fontSize: 22, fontWeight: '800' }, employeeDetail: { marginTop: 5, color: colors.muted, fontSize: 13 },
  movementBadge: { alignSelf: 'flex-start', marginTop: 16, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.successLight }, exitBadge: { backgroundColor: '#E8F1F8' }, movementText: { color: colors.text, fontSize: 11, fontWeight: '900' }, confirmQuestion: { marginTop: 20, color: colors.text, fontSize: 15, fontWeight: '700' },
  cancelButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 11 }, cancelText: { color: colors.primary, fontWeight: '800' },
  employeeResults: { gap: 9, marginTop: 14 }, employeeResult: { padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: '#fff' }, employeeResultName: { color: colors.text, fontSize: 15, fontWeight: '800' }, selectText: { marginTop: 9, color: colors.primary, fontSize: 12, fontWeight: '800' },
});
