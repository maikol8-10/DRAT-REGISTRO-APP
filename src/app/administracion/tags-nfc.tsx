import { Redirect, router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/SessionContext';
import { SICAFColors as colors } from '@/constants/theme';
import { createNfcTag, getEmployees, getNfcTags, type Employee, type NfcTagRecord } from '@/services/api';
import { readPhysicalNfcUid } from '@/services/nfc';

export default function NfcTagAdministrationScreen() {
  const { session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tags, setTags] = useState<NfcTagRecord[]>([]);
  const [uid, setUid] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!session || session.user.role !== 'ADMINISTRADOR') return;
    Promise.all([getEmployees(session.token), getNfcTags(session.token)])
      .then(([employeeData, tagData]) => { setEmployees(employeeData); setTags(tagData); })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'No fue posible cargar la información'))
      .finally(() => setLoading(false));
  }, [session]);

  const availableEmployees = useMemo(() => {
    const assignedIds = new Set(tags.map((tag) => tag.employeeId));
    return employees.filter((employee) => employee.active && !assignedIds.has(employee.id));
  }, [employees, tags]);

  if (!session) return <Redirect href={'/login' as Href} />;
  if (session.user.role !== 'ADMINISTRADOR') return <Redirect href={'/' as Href} />;
  const token = session.token;

  async function scan() {
    setScanning(true); setError(''); setMessage(''); setUid('');
    try { setUid(await readPhysicalNfcUid()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible leer la etiqueta NFC'); }
    finally { setScanning(false); }
  }

  async function assign() {
    if (!uid || !selectedEmployeeId) { setError('Lea una etiqueta y seleccione un funcionario.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const created = await createNfcTag(token, { code: uid, employeeId: selectedEmployeeId });
      setTags((current) => [created, ...current]);
      setUid(''); setSelectedEmployeeId('');
      setMessage(`TAG asignado correctamente a ${created.employee.name}.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible asignar el TAG'); }
    finally { setLoading(false); }
  }

  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Volver</Text></Pressable><Text style={styles.brand}>ADMINISTRACIÓN</Text></View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GESTIÓN DE IDENTIFICACIÓN</Text>
      <Text style={styles.title}>Asignar TAG NFC</Text>
      <Text style={styles.description}>Lea el gafete con este teléfono y asígnelo a un funcionario activo que todavía no tenga TAG.</Text>

      <View style={styles.scanCard}>
        <Text style={styles.label}>Etiqueta leída</Text>
        <Text style={styles.uid}>{uid || 'Aún no se ha leído una etiqueta'}</Text>
        <Pressable disabled={scanning || loading} onPress={() => void scan()} style={styles.primaryButton}>
          {scanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{uid ? 'Leer otra etiqueta' : 'Leer TAG con NFC'}</Text>}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Funcionario sin TAG asignado</Text>
      {loading && !employees.length ? <ActivityIndicator color={colors.primary} /> : availableEmployees.length === 0 ? <Text style={styles.empty}>No hay funcionarios activos disponibles para asignación.</Text> :
        <View style={styles.list}>{availableEmployees.map((employee) => <Pressable key={employee.id} onPress={() => setSelectedEmployeeId(employee.id)} style={[styles.employeeCard, selectedEmployeeId === employee.id && styles.employeeSelected]}>
          <View style={[styles.radio, selectedEmployeeId === employee.id && styles.radioSelected]} />
          <View style={styles.employeeText}><Text style={styles.employeeName}>{employee.name}</Text><Text style={styles.employeeDetail}>{employee.identification} · {employee.department}</Text></View>
        </Pressable>)}</View>}

      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <Pressable disabled={!uid || !selectedEmployeeId || loading} onPress={() => void assign()} style={[styles.primaryButton, (!uid || !selectedEmployeeId || loading) && styles.disabled]}>
        {loading && employees.length ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Confirmar asignación</Text>}
      </Pressable>

      <View style={styles.notice}><Text style={styles.noticeTitle}>Acceso exclusivo</Text><Text style={styles.noticeText}>Solo una cuenta con rol Administrador puede crear asociaciones. El personal de seguridad únicamente puede leer TAG registrados para operar movimientos.</Text></View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: '#fff' }, backButton: { paddingVertical: 10, paddingRight: 16 }, backText: { color: colors.primary, fontSize: 16, fontWeight: '700' }, brand: { marginLeft: 'auto', color: colors.navy, fontSize: 13, fontWeight: '900' }, content: { padding: 22, paddingBottom: 48 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 29, fontWeight: '800', marginTop: 7 }, description: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10 }, scanCard: { padding: 18, marginTop: 22, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#fff' }, label: { color: colors.muted, fontSize: 11, fontWeight: '800' }, uid: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 8 }, primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 14, paddingHorizontal: 16, borderRadius: 11, backgroundColor: colors.primary }, primaryText: { color: '#fff', fontWeight: '800' }, disabled: { opacity: .45 }, sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 26, marginBottom: 11 }, list: { gap: 9 }, employeeCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: '#fff' }, employeeSelected: { borderColor: colors.primary, backgroundColor: '#E8F1F8' }, radio: { width: 18, height: 18, marginRight: 12, borderWidth: 2, borderColor: colors.muted, borderRadius: 9 }, radioSelected: { borderWidth: 5, borderColor: colors.primary }, employeeText: { flex: 1 }, employeeName: { color: colors.text, fontSize: 14, fontWeight: '800' }, employeeDetail: { color: colors.muted, fontSize: 12, marginTop: 4 }, empty: { padding: 16, color: colors.muted, borderRadius: 12, backgroundColor: '#fff' }, error: { marginTop: 14, padding: 12, borderRadius: 10, color: '#9A2E2E', backgroundColor: '#FBEAEA' }, success: { marginTop: 14, padding: 12, borderRadius: 10, color: '#087344', backgroundColor: colors.successLight }, notice: { padding: 16, marginTop: 24, borderRadius: 14, borderLeftWidth: 4, borderLeftColor: colors.success, backgroundColor: colors.successLight }, noticeTitle: { color: '#087344', fontSize: 13, fontWeight: '800' }, noticeText: { color: '#3F6554', fontSize: 12, lineHeight: 18, marginTop: 4 },
});
