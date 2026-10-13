import { Redirect, router, type Href } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/auth/SessionContext';
import { SICAFColors as colors } from '@/constants/theme';
import { searchCatalogs, type CatalogResult } from '@/services/api';

export default function CatalogsScreen() {
  const { session } = useSession();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!session) return <Redirect href={'/login' as Href} />;

  async function submit() {
    if (!session) return;
    if (!search.trim()) { setError('Escriba un nombre, identificación o placa.'); return; }
    setLoading(true); setError('');
    try { setResults(await searchCatalogs(session.token, search)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No fue posible consultar los catálogos'); }
    finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable><Text style={styles.headerTitle}>Consulta operativa</Text><Text style={styles.role}>SOLO LECTURA · {session.user.role}</Text></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Funcionarios y vehículos</Text><Text style={styles.description}>Busque por nombre, identificación o placa. Solo se muestran registros activos autorizados para la operación.</Text>
        <View style={styles.searchRow}><TextInput autoCapitalize="characters" placeholder="Nombre, identificación o placa" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} onSubmitEditing={() => void submit()} style={styles.input} /><Pressable onPress={() => void submit()} style={styles.searchButton}><Text style={styles.searchButtonText}>Buscar</Text></Pressable></View>
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
        {!loading && results.length === 0 && !error ? <Text style={styles.empty}>Realice una búsqueda para consultar los registros autorizados.</Text> : null}
        <View style={styles.list}>{results.map((item) => <View key={`${item.kind}-${item.id}`} style={styles.result}><View style={[styles.badge, item.kind === 'FUNCIONARIO' ? styles.personBadge : item.kind === 'PARTICULAR' ? styles.privateBadge : null]}><Text style={styles.badgeText}>{item.kind}</Text></View><Text style={styles.resultIdentifier}>{item.identifier}</Text><Text style={styles.resultTitle}>{item.title}</Text><Text style={styles.resultDetail}>{item.detail}</Text></View>)}</View>
        <View style={styles.notice}><Text style={styles.noticeTitle}>Consulta de solo lectura</Text><Text style={styles.noticeText}>El perfil guarda no puede crear, editar, activar ni desactivar registros administrativos desde la aplicación móvil.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 18, paddingVertical: 14, backgroundColor: colors.navy }, back: { color: '#D9E8ED', fontSize: 13, fontWeight: '700' },
  headerTitle: { marginTop: 11, color: '#fff', fontSize: 22, fontWeight: '800' }, role: { marginTop: 5, color: colors.headerMuted, fontSize: 10, fontWeight: '800', letterSpacing: .8 },
  content: { padding: 18, paddingBottom: 40 }, title: { color: colors.text, fontSize: 25, fontWeight: '800' }, description: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 19 },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 20 }, input: { flex: 1, minWidth: 0, height: 48, paddingHorizontal: 13, borderWidth: 1, borderColor: colors.border, borderRadius: 11, color: colors.text, backgroundColor: '#fff' },
  searchButton: { justifyContent: 'center', paddingHorizontal: 16, borderRadius: 11, backgroundColor: colors.primary }, searchButtonText: { color: '#fff', fontWeight: '800' },
  error: { marginTop: 14, padding: 11, borderRadius: 9, color: '#9A2E2E', backgroundColor: '#FBEAEA' }, loading: { marginTop: 30 }, empty: { marginTop: 30, color: colors.muted, textAlign: 'center', lineHeight: 20 }, list: { gap: 11, marginTop: 18 },
  result: { padding: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.card }, badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, backgroundColor: '#E8F1F8' }, personBadge: { backgroundColor: colors.successLight }, privateBadge: { backgroundColor: '#FFF3D5' }, badgeText: { color: colors.text, fontSize: 9, fontWeight: '900' },
  resultIdentifier: { marginTop: 11, color: colors.primary, fontSize: 17, fontWeight: '900' }, resultTitle: { marginTop: 4, color: colors.text, fontSize: 15, fontWeight: '700' }, resultDetail: { marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 17 },
  notice: { padding: 15, marginTop: 22, borderLeftWidth: 4, borderLeftColor: colors.success, borderRadius: 12, backgroundColor: colors.successLight }, noticeTitle: { color: '#087344', fontSize: 13, fontWeight: '800' }, noticeText: { marginTop: 4, color: '#3F6554', fontSize: 12, lineHeight: 18 },
});
