import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Image, Linking, Modal, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
// SafeAreaView manual con paddingTop fijo para control total
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const API_URL = 'https://rinconcito-reserva.onrender.com';
const ADMIN_PASS = 'anaga2024';

type Tab = 'reservar' | 'consultar' | 'admin';
type AdminView = 'list' | 'calendar';
type Estado = 'pendiente' | 'confirmada' | 'cancelada';

interface Cliente { nombre: string; telefono: string; }
interface Reserva { codigo: string; fecha: string; hora: string; comensales: number; cliente: Cliente; estado: Estado; }

const PREFIJOS = [
  { code: '+93', flag: '🇦🇫', country: 'Afganistan' },
  { code: '+355', flag: '🇦🇱', country: 'Albania' },
  { code: '+49', flag: '🇩🇪', country: 'Alemania' },
  { code: '+376', flag: '🇦🇩', country: 'Andorra' },
  { code: '+244', flag: '🇦🇴', country: 'Angola' },
  { code: '+1268', flag: '🇦🇬', country: 'Antigua y Barbuda' },
  { code: '+966', flag: '🇸🇦', country: 'Arabia Saudita' },
  { code: '+213', flag: '🇩🇿', country: 'Argelia' },
  { code: '+54', flag: '🇦🇷', country: 'Argentina' },
  { code: '+374', flag: '🇦🇲', country: 'Armenia' },
  { code: '+61', flag: '🇦🇺', country: 'Australia' },
  { code: '+43', flag: '🇦🇹', country: 'Austria' },
  { code: '+994', flag: '🇦🇿', country: 'Azerbaiyan' },
  { code: '+1242', flag: '🇧🇸', country: 'Bahamas' },
  { code: '+973', flag: '🇧🇭', country: 'Barein' },
  { code: '+880', flag: '🇧🇩', country: 'Bangladesh' },
  { code: '+1246', flag: '🇧🇧', country: 'Barbados' },
  { code: '+32', flag: '🇧🇪', country: 'Belgica' },
  { code: '+501', flag: '🇧🇿', country: 'Belice' },
  { code: '+229', flag: '🇧🇯', country: 'Benin' },
  { code: '+375', flag: '🇧🇾', country: 'Bielorrusia' },
  { code: '+591', flag: '🇧🇴', country: 'Bolivia' },
  { code: '+387', flag: '🇧🇦', country: 'Bosnia' },
  { code: '+267', flag: '🇧🇼', country: 'Botsuana' },
  { code: '+55', flag: '🇧🇷', country: 'Brasil' },
  { code: '+673', flag: '🇧🇳', country: 'Brunei' },
  { code: '+359', flag: '🇧🇬', country: 'Bulgaria' },
  { code: '+226', flag: '🇧🇫', country: 'Burkina Faso' },
  { code: '+257', flag: '🇧🇮', country: 'Burundi' },
  { code: '+975', flag: '🇧🇹', country: 'Butan' },
  { code: '+238', flag: '🇨🇻', country: 'Cabo Verde' },
  { code: '+855', flag: '🇰🇭', country: 'Camboya' },
  { code: '+237', flag: '🇨🇲', country: 'Camerun' },
  { code: '+1', flag: '🇨🇦', country: 'Canada' },
  { code: '+236', flag: '🇨🇫', country: 'Centroafricana' },
  { code: '+235', flag: '🇹🇩', country: 'Chad' },
  { code: '+56', flag: '🇨🇱', country: 'Chile' },
  { code: '+86', flag: '🇨🇳', country: 'China' },
  { code: '+357', flag: '🇨🇾', country: 'Chipre' },
  { code: '+57', flag: '🇨🇴', country: 'Colombia' },
  { code: '+269', flag: '🇰🇲', country: 'Comoras' },
  { code: '+242', flag: '🇨🇬', country: 'Congo' },
  { code: '+243', flag: '🇨🇩', country: 'Congo RDC' },
  { code: '+82', flag: '🇰🇷', country: 'Corea del Sur' },
  { code: '+850', flag: '🇰🇵', country: 'Corea del Norte' },
  { code: '+506', flag: '🇨🇷', country: 'Costa Rica' },
  { code: '+225', flag: '🇨🇮', country: 'Costa de Marfil' },
  { code: '+385', flag: '🇭🇷', country: 'Croacia' },
  { code: '+53', flag: '🇨🇺', country: 'Cuba' },
  { code: '+45', flag: '🇩🇰', country: 'Dinamarca' },
  { code: '+253', flag: '🇩🇯', country: 'Yibuti' },
  { code: '+1767', flag: '🇩🇲', country: 'Dominica' },
  { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
  { code: '+20', flag: '🇪🇬', country: 'Egipto' },
  { code: '+503', flag: '🇸🇻', country: 'El Salvador' },
  { code: '+971', flag: '🇦🇪', country: 'Emiratos Arabes' },
  { code: '+291', flag: '🇪🇷', country: 'Eritrea' },
  { code: '+421', flag: '🇸🇰', country: 'Eslovaquia' },
  { code: '+386', flag: '🇸🇮', country: 'Eslovenia' },
  { code: '+34', flag: '🇪🇸', country: 'Espana' },
  { code: '+1', flag: '🇺🇸', country: 'EE.UU.' },
  { code: '+372', flag: '🇪🇪', country: 'Estonia' },
  { code: '+268', flag: '🇸🇿', country: 'Esuatini' },
  { code: '+251', flag: '🇪🇹', country: 'Etiopia' },
  { code: '+679', flag: '🇫🇯', country: 'Fiyi' },
  { code: '+63', flag: '🇵🇭', country: 'Filipinas' },
  { code: '+358', flag: '🇫🇮', country: 'Finlandia' },
  { code: '+33', flag: '🇫🇷', country: 'Francia' },
  { code: '+241', flag: '🇬🇦', country: 'Gabon' },
  { code: '+220', flag: '🇬🇲', country: 'Gambia' },
  { code: '+995', flag: '🇬🇪', country: 'Georgia' },
  { code: '+233', flag: '🇬🇭', country: 'Ghana' },
  { code: '+30', flag: '🇬🇷', country: 'Grecia' },
  { code: '+1473', flag: '🇬🇩', country: 'Granada' },
  { code: '+502', flag: '🇬🇹', country: 'Guatemala' },
  { code: '+224', flag: '🇬🇳', country: 'Guinea' },
  { code: '+240', flag: '🇬🇶', country: 'Guinea Ecuatorial' },
  { code: '+245', flag: '🇬🇼', country: 'Guinea-Bisau' },
  { code: '+592', flag: '🇬🇾', country: 'Guyana' },
  { code: '+509', flag: '🇭🇹', country: 'Haiti' },
  { code: '+504', flag: '🇭🇳', country: 'Honduras' },
  { code: '+36', flag: '🇭🇺', country: 'Hungria' },
  { code: '+91', flag: '🇮🇳', country: 'India' },
  { code: '+62', flag: '🇮🇩', country: 'Indonesia' },
  { code: '+964', flag: '🇮🇶', country: 'Irak' },
  { code: '+98', flag: '🇮🇷', country: 'Iran' },
  { code: '+353', flag: '🇮🇪', country: 'Irlanda' },
  { code: '+354', flag: '🇮🇸', country: 'Islandia' },
  { code: '+972', flag: '🇮🇱', country: 'Israel' },
  { code: '+39', flag: '🇮🇹', country: 'Italia' },
  { code: '+1876', flag: '🇯🇲', country: 'Jamaica' },
  { code: '+81', flag: '🇯🇵', country: 'Japon' },
  { code: '+962', flag: '🇯🇴', country: 'Jordania' },
  { code: '+7', flag: '🇰🇿', country: 'Kazajistan' },
  { code: '+254', flag: '🇰🇪', country: 'Kenia' },
  { code: '+996', flag: '🇰🇬', country: 'Kirguistan' },
  { code: '+686', flag: '🇰🇮', country: 'Kiribati' },
  { code: '+965', flag: '🇰🇼', country: 'Kuwait' },
  { code: '+856', flag: '🇱🇦', country: 'Laos' },
  { code: '+266', flag: '🇱🇸', country: 'Lesoto' },
  { code: '+371', flag: '🇱🇻', country: 'Letonia' },
  { code: '+961', flag: '🇱🇧', country: 'Libano' },
  { code: '+231', flag: '🇱🇷', country: 'Liberia' },
  { code: '+218', flag: '🇱🇾', country: 'Libia' },
  { code: '+423', flag: '🇱🇮', country: 'Liechtenstein' },
  { code: '+370', flag: '🇱🇹', country: 'Lituania' },
  { code: '+352', flag: '🇱🇺', country: 'Luxemburgo' },
  { code: '+389', flag: '🇲🇰', country: 'Macedonia N.' },
  { code: '+261', flag: '🇲🇬', country: 'Madagascar' },
  { code: '+60', flag: '🇲🇾', country: 'Malasia' },
  { code: '+265', flag: '🇲🇼', country: 'Malaui' },
  { code: '+960', flag: '🇲🇻', country: 'Maldivas' },
  { code: '+223', flag: '🇲🇱', country: 'Mali' },
  { code: '+356', flag: '🇲🇹', country: 'Malta' },
  { code: '+212', flag: '🇲🇦', country: 'Marruecos' },
  { code: '+230', flag: '🇲🇺', country: 'Mauricio' },
  { code: '+222', flag: '🇲🇷', country: 'Mauritania' },
  { code: '+52', flag: '🇲🇽', country: 'Mexico' },
  { code: '+691', flag: '🇫🇲', country: 'Micronesia' },
  { code: '+373', flag: '🇲🇩', country: 'Moldavia' },
  { code: '+377', flag: '🇲🇨', country: 'Monaco' },
  { code: '+976', flag: '🇲🇳', country: 'Mongolia' },
  { code: '+382', flag: '🇲🇪', country: 'Montenegro' },
  { code: '+258', flag: '🇲🇿', country: 'Mozambique' },
  { code: '+95', flag: '🇲🇲', country: 'Myanmar' },
  { code: '+264', flag: '🇳🇦', country: 'Namibia' },
  { code: '+674', flag: '🇳🇷', country: 'Nauru' },
  { code: '+977', flag: '🇳🇵', country: 'Nepal' },
  { code: '+505', flag: '🇳🇮', country: 'Nicaragua' },
  { code: '+227', flag: '🇳🇪', country: 'Niger' },
  { code: '+234', flag: '🇳🇬', country: 'Nigeria' },
  { code: '+47', flag: '🇳🇴', country: 'Noruega' },
  { code: '+64', flag: '🇳🇿', country: 'Nueva Zelanda' },
  { code: '+968', flag: '🇴🇲', country: 'Oman' },
  { code: '+31', flag: '🇳🇱', country: 'Paises Bajos' },
  { code: '+92', flag: '🇵🇰', country: 'Pakistan' },
  { code: '+680', flag: '🇵🇼', country: 'Palaos' },
  { code: '+507', flag: '🇵🇦', country: 'Panama' },
  { code: '+675', flag: '🇵🇬', country: 'Papua N. Guinea' },
  { code: '+595', flag: '🇵🇾', country: 'Paraguay' },
  { code: '+51', flag: '🇵🇪', country: 'Peru' },
  { code: '+48', flag: '🇵🇱', country: 'Polonia' },
  { code: '+351', flag: '🇵🇹', country: 'Portugal' },
  { code: '+974', flag: '🇶🇦', country: 'Catar' },
  { code: '+44', flag: '🇬🇧', country: 'Reino Unido' },
  { code: '+420', flag: '🇨🇿', country: 'Rep. Checa' },
  { code: '+1809', flag: '🇩🇴', country: 'Rep. Dominicana' },
  { code: '+250', flag: '🇷🇼', country: 'Ruanda' },
  { code: '+40', flag: '🇷🇴', country: 'Rumania' },
  { code: '+7', flag: '🇷🇺', country: 'Rusia' },
  { code: '+685', flag: '🇼🇸', country: 'Samoa' },
  { code: '+378', flag: '🇸🇲', country: 'San Marino' },
  { code: '+1869', flag: '🇰🇳', country: 'San Cristobal' },
  { code: '+1758', flag: '🇱🇨', country: 'Santa Lucia' },
  { code: '+1784', flag: '🇻🇨', country: 'San Vicente' },
  { code: '+239', flag: '🇸🇹', country: 'Santo Tome' },
  { code: '+221', flag: '🇸🇳', country: 'Senegal' },
  { code: '+381', flag: '🇷🇸', country: 'Serbia' },
  { code: '+248', flag: '🇸🇨', country: 'Seychelles' },
  { code: '+232', flag: '🇸🇱', country: 'Sierra Leona' },
  { code: '+65', flag: '🇸🇬', country: 'Singapur' },
  { code: '+963', flag: '🇸🇾', country: 'Siria' },
  { code: '+252', flag: '🇸🇴', country: 'Somalia' },
  { code: '+94', flag: '🇱🇰', country: 'Sri Lanka' },
  { code: '+27', flag: '🇿🇦', country: 'Sudafrica' },
  { code: '+249', flag: '🇸🇩', country: 'Sudan' },
  { code: '+211', flag: '🇸🇸', country: 'Sudan del Sur' },
  { code: '+46', flag: '🇸🇪', country: 'Suecia' },
  { code: '+41', flag: '🇨🇭', country: 'Suiza' },
  { code: '+597', flag: '🇸🇷', country: 'Surinam' },
  { code: '+66', flag: '🇹🇭', country: 'Tailandia' },
  { code: '+255', flag: '🇹🇿', country: 'Tanzania' },
  { code: '+992', flag: '🇹🇯', country: 'Tayikistan' },
  { code: '+670', flag: '🇹🇱', country: 'Timor Oriental' },
  { code: '+228', flag: '🇹🇬', country: 'Togo' },
  { code: '+676', flag: '🇹🇴', country: 'Tonga' },
  { code: '+1868', flag: '🇹🇹', country: 'Trinidad y Tobago' },
  { code: '+216', flag: '🇹🇳', country: 'Tunez' },
  { code: '+993', flag: '🇹🇲', country: 'Turkmenistan' },
  { code: '+90', flag: '🇹🇷', country: 'Turquia' },
  { code: '+688', flag: '🇹🇻', country: 'Tuvalu' },
  { code: '+380', flag: '🇺🇦', country: 'Ucrania' },
  { code: '+256', flag: '🇺🇬', country: 'Uganda' },
  { code: '+598', flag: '🇺🇾', country: 'Uruguay' },
  { code: '+998', flag: '🇺🇿', country: 'Uzbekistan' },
  { code: '+678', flag: '🇻🇺', country: 'Vanuatu' },
  { code: '+379', flag: '🇻🇦', country: 'Vaticano' },
  { code: '+58', flag: '🇻🇪', country: 'Venezuela' },
  { code: '+84', flag: '🇻🇳', country: 'Vietnam' },
  { code: '+967', flag: '🇾🇪', country: 'Yemen' },
  { code: '+260', flag: '🇿🇲', country: 'Zambia' },
  { code: '+263', flag: '🇿🇼', country: 'Zimbabue' },
];


// Saludo dinámico según hora del día
function getSaludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function App() {
  const [tab, setTab] = useState<Tab>('reservar');
  const [adminView, setAdminView] = useState<AdminView>('list');
  const [adminFilter, setAdminFilter] = useState<Estado | 'all'>('all');
  const [adminLogged, setAdminLogged] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [pendCount, setPendCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCode, setRejectCode] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPrefijoPicker, setShowPrefijoPicker] = useState(false);
  const [comensales, setComensales] = useState('2');
  const [nombre, setNombre] = useState('');
  const [prefijo, setPrefijo] = useState('+34');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err' | 'pend'; texto: string; codigo?: string } | null>(null);
  const [reservaConsultada, setReservaConsultada] = useState<Reserva | null>(null);

  useEffect(() => { cargarReservas(); }, []);

  const cargarReservas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservas`);
      const data = await res.json();
      const lista = data.reservas || [];
      setReservas(lista);
      setPendCount(lista.filter((r: Reserva) => r.estado === 'pendiente').length);
    } catch (e) { console.error(e); }
  };

  const enviarReserva = async () => {
    if (!nombre || !telefono || !comensales) { Alert.alert('Oops', 'Rellena todos los campos para continuar'); return; }
    const n = parseInt(comensales);
    if (isNaN(n) || n < 1) { Alert.alert('Oops', 'El número de personas no es válido'); return; }
    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fecha.toISOString().split('T')[0], hora: hora.toTimeString().slice(0, 5), comensales: n, cliente: { nombre, telefono: prefijo + telefono.replace(/\s/g, ''), email: email.trim() || '' } })
      });
      const data = await res.json();
      if (res.ok) { setMensaje({ tipo: 'pend', texto: 'Solicitud Recibida', codigo: data.codigo }); setNombre(''); setTelefono(''); setEmail(''); setComensales('2'); cargarReservas(); }
      else { setMensaje({ tipo: 'err', texto: data.mensaje || 'Algo salió mal' }); }
    } catch { setMensaje({ tipo: 'err', texto: 'Sin conexión al servidor' }); }
  };

  const buscarReserva = async () => {
    if (!codigo) return;
    try {
      const res = await fetch(`${API_URL}/api/reservas/${codigo.toUpperCase()}`);
      const data = await res.json();
      if (res.ok) setReservaConsultada(data);
      else { Alert.alert('Hmm...', 'No encontramos ninguna reserva con ese código'); setReservaConsultada(null); }
    } catch { Alert.alert('Error', 'No pudimos conectar con el servidor'); }
  };

  const cancelarReserva = async (cod: string) => {
    Alert.alert('¿Seguro?', 'Se cancelará tu reserva y avisaremos al restaurante.', [
      { text: 'Mejor no', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
        try {
          await fetch(`${API_URL}/api/reservas/${cod}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ canceladoPorCliente: true }) });
          setReservaConsultada(null); setCodigo(''); cargarReservas();
          Alert.alert('Listo', 'Reserva cancelada. El restaurante ha sido notificado.');
        } catch { Alert.alert('Error', 'No se pudo cancelar'); }
      }}
    ]);
  };

  const confirmarReserva = async (cod: string) => {
    Alert.alert('Confirmar reserva', 'Se enviará un SMS al cliente confirmando.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: async () => {
        try { await fetch(`${API_URL}/api/reservas/${cod}/confirmar`, { method: 'POST' }); cargarReservas(); }
        catch { Alert.alert('Error', 'No se pudo confirmar'); }
      }}
    ]);
  };

  const rechazarReserva = (cod: string) => { setRejectCode(cod); setRejectReason(''); setShowRejectModal(true); };

  const confirmarRechazo = async () => {
    if (!rejectReason.trim()) { Alert.alert('Falta el motivo', 'Escribe por qué rechazas la reserva'); return; }
    try {
      await fetch(`${API_URL}/api/reservas/${rejectCode}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ motivo: rejectReason }) });
      setShowRejectModal(false); setRejectCode(''); setRejectReason(''); cargarReservas();
      Alert.alert('Hecho', 'Reserva rechazada. El cliente recibirá un SMS.');
    } catch { Alert.alert('Error', 'No se pudo rechazar'); }
  };

  const loginAdmin = () => {
    if (adminPass === ADMIN_PASS) { setAdminLogged(true); setAdminPass(''); cargarReservas(); }
    else Alert.alert('Acceso denegado', 'La contraseña no es correcta');
  };

  const fmt = (f: string) => new Date(f).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear(), m = date.getMonth();
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const days: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let i = 1; i <= last.getDate(); i++) days.push(new Date(y, m, i));
    return days;
  };

  const getReservasForDate = (d: Date) => reservas.filter(r => r.fecha === d.toISOString().split('T')[0]);

  const estadoColor = (e: Estado) => e === 'confirmada' ? '#34c759' : e === 'pendiente' ? '#ff9f0a' : '#ff453a';
  const estadoLabel = (e: Estado) => e === 'confirmada' ? 'Confirmada' : e === 'pendiente' ? 'Pendiente' : 'Cancelada';

  // ─── VISTA CLIENTE: RESERVAR ───
  const renderReservar = () => (
    <View>
      {/* Fecha y Hora en una fila */}
      <View style={s.dualRow}>
        <TouchableOpacity style={s.dualField} onPress={() => setShowDatePicker(true)}>
          <Text style={s.dualLabel}>� Fecha</Text>
          <Text style={s.dualValue}>{fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.dualField} onPress={() => setShowTimePicker(true)}>
          <Text style={s.dualLabel}><Text style={{color:"#d4a855"}}>▫</Text> Hora</Text>
          <Text style={s.dualValue}>{hora.toTimeString().slice(0, 5)}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.formCard}>
        <View style={s.field}>
          <View style={[s.fieldIcon, {backgroundColor:"#5ac8c810", borderWidth:1, borderColor:"#5ac8c820"}]}><Text style={{fontSize:12,color:"#5ac8c8",fontWeight:"700"}}>#</Text></View>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Personas</Text>
            <TextInput style={s.fieldInput} value={comensales} onChangeText={setComensales} placeholder="2" placeholderTextColor="#555" keyboardType="number-pad" />
          </View>
        </View>

        <View style={s.fieldDivider} />

        <View style={s.field}>
          <View style={[s.fieldIcon, {backgroundColor:"#d4a85510", borderWidth:1, borderColor:"#d4a85520"}]}><Text style={{fontSize:11,color:"#d4a855",fontWeight:"700"}}>ab</Text></View>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Nombre</Text>
            <TextInput style={s.fieldInput} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor="#555" />
          </View>
        </View>

        <View style={s.fieldDivider} />

        {/* País + Teléfono en una fila dentro del card */}
        <View style={s.field}>
          <TouchableOpacity style={s.prefixBtn} onPress={() => setShowPrefijoPicker(true)}>
            <Text style={s.prefixText}>{PREFIJOS.find(p => p.code === prefijo)?.flag} {prefijo}</Text>
            <Text style={s.prefixChevron}>›</Text>
          </TouchableOpacity>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Teléfono</Text>
            <TextInput style={s.fieldInput} value={telefono} onChangeText={setTelefono} placeholder="600 000 000" placeholderTextColor="#555" keyboardType="phone-pad" />
          </View>
        </View>

        <View style={s.fieldDivider} />

        <View style={s.field}>
          <View style={[s.fieldIcon, {backgroundColor:"#88888810", borderWidth:1, borderColor:"#88888820"}]}><Text style={{fontSize:12,color:"#777",fontWeight:"600"}}>@</Text></View>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Email (opcional)</Text>
            <TextInput style={s.fieldInput} value={email} onChangeText={setEmail} placeholder="tu@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.mainBtn} onPress={enviarReserva} activeOpacity={0.8}>
        <Text style={s.mainBtnText}>Solicitar Reserva</Text>
      </TouchableOpacity>

      {/* Pickers */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetBar}><TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={s.sheetDone}>Listo</Text></TouchableOpacity></View>
              <DateTimePicker value={fecha} mode="date" display="spinner" minimumDate={new Date()} onChange={(_, d) => { if (d) setFecha(d); }} textColor="#fff" style={{ height: 216 }} />
            </View>
          </View>
        </Modal>
      )}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal transparent animationType="slide">
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetBar}><TouchableOpacity onPress={() => setShowTimePicker(false)}><Text style={s.sheetDone}>Listo</Text></TouchableOpacity></View>
              <DateTimePicker value={hora} mode="time" display="spinner" onChange={(_, d) => { if (d) setHora(d); }} textColor="#fff" style={{ height: 216 }} />
            </View>
          </View>
        </Modal>
      )}
      {showPrefijoPicker && (
        <Modal transparent animationType="slide">
          <View style={s.overlay}>
            <View style={s.sheet}>
              <View style={s.sheetBar}><TouchableOpacity onPress={() => setShowPrefijoPicker(false)}><Text style={s.sheetDone}>Listo</Text></TouchableOpacity></View>
              <Picker selectedValue={prefijo} onValueChange={setPrefijo} style={{ height: 216 }} itemStyle={{ color: '#fff', fontSize: 18, height: 216 }}>
                {PREFIJOS.map(p => <Picker.Item key={p.code} label={`${p.flag}  ${p.country}  ${p.code}`} value={p.code} />)}
              </Picker>
            </View>
          </View>
        </Modal>
      )}

      {mensaje && (
        <View style={[s.toast, mensaje.tipo === 'pend' ? s.toastPend : mensaje.tipo === 'ok' ? s.toastOk : s.toastErr]}>
          <Text style={s.toastEmoji}>{mensaje.tipo === 'pend' ? '⏳' : mensaje.tipo === 'ok' ? '✅' : '⚠️'}</Text>
          <Text style={s.toastTitle}>{mensaje.texto}</Text>
          {mensaje.codigo && <Text style={s.toastCode}>{mensaje.codigo}</Text>}
          {mensaje.tipo === 'pend' && <Text style={s.toastNote}>La confirmacion te llegara por SMS al numero que indicaste.</Text>}
        </View>
      )}
    </View>
  );

  // ─── VISTA CLIENTE: CONSULTAR ───
  const renderConsultar = () => (
    <View>
      <View style={{ alignItems: 'center', marginTop: 30, marginBottom: 28 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#d4a85510', borderWidth: 1.5, borderColor: '#d4a85520', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 24, color: '#d4a855' }}>?</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.3 }}>Tu reserva</Text>
        <Text style={{ fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center' }}>Escribe el codigo que te dimos</Text>
      </View>

      <View style={s.formCard}>
        <View style={s.field}>
          <View style={[s.fieldIcon, { backgroundColor: '#d4a85510', borderWidth: 1, borderColor: '#d4a85520' }]}>
            <Text style={{ fontSize: 12, color: '#d4a855', fontWeight: '700' }}>&lt;&gt;</Text>
          </View>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Codigo</Text>
            <TextInput style={[s.fieldInput, { letterSpacing: 4, fontSize: 22, fontWeight: '800', color: '#d4a855' }]} value={codigo} onChangeText={t => setCodigo(t.toUpperCase())} placeholder="ABCD1234" placeholderTextColor="#333" autoCapitalize="characters" maxLength={8} />
          </View>
        </View>
      </View>

      <TouchableOpacity style={[s.mainBtn, { marginTop: 16 }]} onPress={buscarReserva} activeOpacity={0.8}>
        <Text style={s.mainBtnText}>Consultar</Text>
      </TouchableOpacity>

      {reservaConsultada && (
        <View style={{ marginTop: 24 }}>
          {/* Estado grande arriba */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: estadoColor(reservaConsultada.estado) + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 20, color: estadoColor(reservaConsultada.estado), fontWeight: '800' }}>
                {reservaConsultada.estado === 'confirmada' ? '✓' : reservaConsultada.estado === 'pendiente' ? '…' : '✗'}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: estadoColor(reservaConsultada.estado) }}>{estadoLabel(reservaConsultada.estado)}</Text>
            <Text style={{ fontSize: 12, color: '#555', marginTop: 4 }}>#{reservaConsultada.codigo}</Text>
          </View>

          {/* Detalles en tarjeta */}
          <View style={{ backgroundColor: '#161618', borderRadius: 16, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#222' }}>
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18, borderRightWidth: 0.5, borderRightColor: '#222' }}>
                <Text style={{ fontSize: 10, color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Fecha</Text>
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{fmt(reservaConsultada.fecha)}</Text>
              </View>
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18 }}>
                <Text style={{ fontSize: 10, color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Hora</Text>
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{reservaConsultada.hora}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18, borderRightWidth: 0.5, borderRightColor: '#222' }}>
                <Text style={{ fontSize: 10, color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Personas</Text>
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{reservaConsultada.comensales}</Text>
              </View>
              <View style={{ flex: 1, paddingVertical: 16, paddingHorizontal: 18 }}>
                <Text style={{ fontSize: 10, color: '#555', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Nombre</Text>
                <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{reservaConsultada.cliente.nombre}</Text>
              </View>
            </View>
          </View>

          {reservaConsultada.estado !== 'cancelada' && (
            <TouchableOpacity style={{ borderWidth: 1.5, borderColor: '#ff453a40', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 20, backgroundColor: '#ff453a08' }} onPress={() => cancelarReserva(reservaConsultada.codigo)} activeOpacity={0.8}>
              <Text style={{ color: '#ff453a', fontSize: 15, fontWeight: '600' }}>Cancelar esta reserva</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  // ─── VISTA CLIENTE: LOGIN ADMIN ───
  const renderAdminLogin = () => (
    <View>
      <View style={{ alignItems: 'center', marginTop: 50, marginBottom: 34 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#5ac8c810', borderWidth: 1.5, borderColor: '#5ac8c825', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 32, color: '#5ac8c8' }}>☕</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', letterSpacing: -0.5 }}>Hola, equipo</Text>
        <Text style={{ fontSize: 14, color: '#777', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>Introduce la clave para gestionar{'\n'}las reservas del restaurante</Text>
      </View>
      <View style={s.formCard}>
        <View style={s.field}>
          <View style={[s.fieldIcon, { backgroundColor: '#d4a85512' }]}><Text style={{ fontSize: 16, color: '#d4a855' }}>⬥</Text></View>
          <View style={s.fieldBody}>
            <Text style={s.fieldLabel}>Clave de acceso</Text>
            <TextInput style={s.fieldInput} value={adminPass} onChangeText={setAdminPass} placeholder="Tu contraseña" placeholderTextColor="#444" secureTextEntry />
          </View>
        </View>
      </View>
      <TouchableOpacity style={[s.mainBtn, { marginTop: 18 }]} onPress={loginAdmin} activeOpacity={0.8}>
        <Text style={s.mainBtnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── TARJETA DE RESERVA (ADMIN) ───
  const renderReservaCard = (r: Reserva) => (
    <View key={r.codigo} style={s.rCard}>
      {/* Franja de color lateral */}
      <View style={[s.rStripe, { backgroundColor: estadoColor(r.estado) }]} />
      <View style={s.rBody}>
        <View style={s.rTop}>
          <View>
            <Text style={s.rTime}>{r.hora}</Text>
            <Text style={s.rDate}>{fmt(r.fecha)}</Text>
          </View>
          <View style={[s.pill, { backgroundColor: estadoColor(r.estado) + '20' }]}>
            <View style={[s.pillDot, { backgroundColor: estadoColor(r.estado) }]} />
            <Text style={[s.pillText, { color: estadoColor(r.estado) }]}>{estadoLabel(r.estado)}</Text>
          </View>
        </View>

        <View style={s.rInfo}>
          <View style={s.rInfoRow}>
            <Text style={[s.rInfoIcon, {color:"#5ac8c8"}]}>●</Text>
            <Text style={s.rInfoText}>{r.cliente.nombre}</Text>
          </View>
          <View style={s.rInfoRow}>
            <Text style={[s.rInfoIcon, {color:"#d4a855"}]}>●</Text>
            <Text style={s.rInfoText}>{r.comensales} {r.comensales === 1 ? 'persona' : 'personas'}</Text>
          </View>
          <View style={s.rInfoRow}>
            <Text style={[s.rInfoIcon, {color:"#888"}]}>●</Text>
            <Text style={s.rInfoText}>{r.cliente.telefono}</Text>
          </View>
        </View>

        <Text style={s.rCode}>#{r.codigo}</Text>

        {r.estado === 'pendiente' && (
          <View style={s.rActions}>
            <TouchableOpacity style={s.rBtnOk} onPress={() => confirmarReserva(r.codigo)} activeOpacity={0.8}>
              <Text style={s.rBtnOkText}>✓  Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rBtnNo} onPress={() => rechazarReserva(r.codigo)} activeOpacity={0.8}>
              <Text style={s.rBtnNoText}>✕  Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}
        {r.estado === 'confirmada' && (
          <TouchableOpacity style={s.rBtnCall} onPress={() => Linking.openURL(`tel:${r.cliente.telefono}`)} activeOpacity={0.8}>
            <Text style={s.rBtnCallText}>Llamar a {r.cliente.nombre.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── PANEL ADMIN COMPLETO ───
  const renderAdmin = () => {
    const pend = reservas.filter(r => r.estado === 'pendiente');
    const conf = reservas.filter(r => r.estado === 'confirmada');
    const canc = reservas.filter(r => r.estado === 'cancelada');
    const hoy = new Date().toISOString().split('T')[0];
    const reservasHoy = reservas.filter(r => r.fecha === hoy);
    const comensalesHoy = reservasHoy.reduce((s, r) => s + r.comensales, 0);
    const fechaSel = selectedDate.toISOString().split('T')[0];
    const reservasFecha = reservas.filter(r => r.fecha === fechaSel).sort((a, b) => a.hora.localeCompare(b.hora));

    return (
      <View>
        {/* Header con saludo */}
        <View style={s.admHead}>
          <View style={s.admHeadRow}>
            <Image source={require('./assets/icon.png')} style={s.admLogo} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.admSaludo}>{getSaludo()} 👋</Text>
              <Text style={s.admNombre}>El Rinconcito de Anaga</Text>
            </View>
            <TouchableOpacity onPress={() => setAdminLogged(false)} style={s.admLogout}>
              <Text style={{ fontSize: 13, color: '#888', fontWeight: '500' }}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats - tocables para filtrar */}
        <View style={s.statsWrap}>
          <TouchableOpacity style={[s.statBig, adminFilter === 'all' && { borderColor: '#5ac8c8', borderWidth: 1 }]} onPress={() => { setAdminFilter('all'); setAdminView('list'); }} activeOpacity={0.7}>
            <Text style={s.statBigNum}>{reservasHoy.length}</Text>
            <Text style={s.statBigLabel}>reservas hoy</Text>
            <Text style={s.statBigSub}>{comensalesHoy} comensales esperados</Text>
          </TouchableOpacity>
          <View style={s.statRow}>
            <TouchableOpacity style={[s.statSmall, { borderColor: '#ff9f0a' }, adminFilter === 'pendiente' && { backgroundColor: '#ff9f0a15' }]} onPress={() => { setAdminFilter('pendiente'); setAdminView('list'); }} activeOpacity={0.7}>
              <Text style={[s.statSmallNum, { color: '#ff9f0a' }]}>{pend.length}</Text>
              <Text style={s.statSmallLabel}>pendientes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.statSmall, { borderColor: '#34c759' }, adminFilter === 'confirmada' && { backgroundColor: '#34c75915' }]} onPress={() => { setAdminFilter('confirmada'); setAdminView('list'); }} activeOpacity={0.7}>
              <Text style={[s.statSmallNum, { color: '#34c759' }]}>{conf.length}</Text>
              <Text style={s.statSmallLabel}>confirmadas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.statSmall, { borderColor: '#ff453a' }, adminFilter === 'cancelada' && { backgroundColor: '#ff453a15' }]} onPress={() => { setAdminFilter('cancelada'); setAdminView('list'); }} activeOpacity={0.7}>
              <Text style={[s.statSmallNum, { color: '#ff453a' }]}>{canc.length}</Text>
              <Text style={s.statSmallLabel}>canceladas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Toggle vista */}
        <View style={s.toggle}>
          <TouchableOpacity style={[s.toggleItem, adminView === 'list' && s.toggleActive]} onPress={() => setAdminView('list')}>
            <Text style={[s.toggleText, adminView === 'list' && s.toggleTextActive]}>📋 Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleItem, adminView === 'calendar' && s.toggleActive]} onPress={() => setAdminView('calendar')}>
            <Text style={[s.toggleText, adminView === 'calendar' && s.toggleTextActive]}>📅 Agenda</Text>
          </TouchableOpacity>
        </View>

        {adminView === 'list' ? (
          <>
            <TouchableOpacity style={s.refreshBtn} onPress={cargarReservas} activeOpacity={0.7}>
              <Text style={s.refreshText}>↻  Actualizar</Text>
            </TouchableOpacity>

            {adminFilter !== 'all' && (
              <TouchableOpacity style={{ alignSelf: 'center', marginBottom: 12 }} onPress={() => setAdminFilter('all')} activeOpacity={0.7}>
                <Text style={{ color: '#5ac8c8', fontSize: 13, fontWeight: '600' }}>Ver todas</Text>
              </TouchableOpacity>
            )}

            {(adminFilter === 'all' || adminFilter === 'pendiente') && pend.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={[s.sectionTitle, { color: '#ff9f0a' }]}>Pendientes</Text>
                  <View style={[s.sectionCount, { backgroundColor: '#ff9f0a20' }]}><Text style={[s.sectionCountText, { color: '#ff9f0a' }]}>{pend.length}</Text></View>
                </View>
                {pend.map(renderReservaCard)}
              </View>
            )}

            {(adminFilter === 'all' || adminFilter === 'confirmada') && conf.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={[s.sectionTitle, { color: '#34c759' }]}>Confirmadas</Text>
                  <View style={[s.sectionCount, { backgroundColor: '#34c75920' }]}><Text style={[s.sectionCountText, { color: '#34c759' }]}>{conf.length}</Text></View>
                </View>
                {conf.map(renderReservaCard)}
              </View>
            )}

            {(adminFilter === 'all' || adminFilter === 'cancelada') && canc.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={[s.sectionTitle, { color: '#ff453a' }]}>Canceladas</Text>
                  <View style={[s.sectionCount, { backgroundColor: '#ff453a20' }]}><Text style={[s.sectionCountText, { color: '#ff453a' }]}>{canc.length}</Text></View>
                </View>
                {canc.slice(0, 5).map(renderReservaCard)}
              </View>
            )}

            {pend.length === 0 && conf.length === 0 && (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🍃</Text>
                <Text style={s.emptyTitle}>Todo tranquilo</Text>
                <Text style={s.emptySub}>No hay reservas por ahora. Buen momento para un café.</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Navegación de fecha */}
            <View style={s.dateNav}>
              <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }} style={s.dateNavArrow}>
                <Text style={s.dateNavArrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendarModal(true)} style={s.dateNavCenter}>
                <Text style={s.dateNavDay}>{selectedDate.toLocaleDateString('es-ES', { weekday: 'long' })}</Text>
                <Text style={s.dateNavFull}>{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }} style={s.dateNavArrow}>
                <Text style={s.dateNavArrowText}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.todayChip} onPress={() => setSelectedDate(new Date())} activeOpacity={0.7}>
              <Text style={s.todayChipText}>Ir a hoy</Text>
            </TouchableOpacity>

            {reservasFecha.length > 0 ? (
              <>
                <Text style={s.agendaSummary}>{reservasFecha.length} {reservasFecha.length === 1 ? 'reserva' : 'reservas'} · {reservasFecha.reduce((sum, r) => sum + r.comensales, 0)} comensales</Text>
                {reservasFecha.map(renderReservaCard)}
              </>
            ) : (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>📭</Text>
                <Text style={s.emptyTitle}>Día libre</Text>
                <Text style={s.emptySub}>No hay reservas para este día.</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // ─── RETURN PRINCIPAL ───
  return (
    <View style={s.safe}>
      <StatusBar style="light" />

      {adminLogged ? (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {renderAdmin()}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header cliente */}
          <View style={s.clientHead}>
            <Image source={require('./assets/icon.png')} style={s.clientLogo} />
            <View>
              <Text style={s.clientBrand}>El Rinconcito de Anaga</Text>
              <Text style={s.clientTag}>reservas online</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            {(['reservar', 'consultar', 'admin'] as Tab[]).map(t => (
              <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabActive]} onPress={() => { setTab(t); if (t === 'reservar') setMensaje(null); if (t === 'consultar') setReservaConsultada(null); }} activeOpacity={0.7}>
                <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                  {t === 'reservar' ? '🍴 Reservar' : t === 'consultar' ? '🔍 Consultar' : '⚙️ Admin'}
                </Text>
                {t === 'admin' && pendCount > 0 && <View style={s.tabBadge}><Text style={s.tabBadgeText}>{pendCount}</Text></View>}
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'reservar' && renderReservar()}
          {tab === 'consultar' && renderConsultar()}
          {tab === 'admin' && renderAdminLogin()}
        </ScrollView>
      )}

      {/* Modal Rechazo */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={s.modalEmoji}>🚫</Text>
            <Text style={s.modalTitle}>Rechazar reserva</Text>
            <Text style={s.modalSub}>Escribe el motivo. Se enviará al cliente por SMS.</Text>
            <TextInput style={s.modalInput} value={rejectReason} onChangeText={setRejectReason} placeholder="Ej: No hay disponibilidad a esa hora" placeholderTextColor="#555" multiline maxLength={160} />
            <Text style={s.modalCounter}>{rejectReason.length}/160</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setShowRejectModal(false)}><Text style={s.modalBtnCancelText}>Volver</Text></TouchableOpacity>
              <TouchableOpacity style={s.modalBtnDanger} onPress={confirmarRechazo}><Text style={s.modalBtnDangerText}>Rechazar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Calendario */}
      <Modal visible={showCalendarModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.calModal}>
            <View style={s.calHead}>
              <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); }}>
                <Text style={s.calArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={s.calTitle}>{selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</Text>
              <TouchableOpacity onPress={() => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); }}>
                <Text style={s.calArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)} style={{ marginLeft: 12 }}>
                <Text style={s.calClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.calWeek}>
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d, i) => <Text key={i} style={s.calWeekDay}>{d}</Text>)}
            </View>
            <View style={s.calGrid}>
              {getDaysInMonth(selectedDate).map((day, i) => {
                if (!day) return <View key={`e-${i}`} style={s.calCell} />;
                const rDay = getReservasForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSel = day.toDateString() === selectedDate.toDateString();
                return (
                  <TouchableOpacity key={i} style={[s.calCell, isToday && s.calCellToday, isSel && s.calCellSel]} onPress={() => { setSelectedDate(day); setShowCalendarModal(false); }}>
                    <Text style={[s.calNum, isToday && s.calNumToday, isSel && s.calNumSel]}>{day.getDate()}</Text>
                    {rDay.length > 0 && <View style={s.calDot}><Text style={s.calDotText}>{rDay.length}</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}


// ─── ESTILOS ───
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0a', paddingTop: 54 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  // ── Cliente Header ──
  clientHead: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 4, gap: 12 },
  clientLogo: { width: 44, height: 44, borderRadius: 12 },
  clientBrand: { fontSize: 19, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  clientTag: { fontSize: 9, color: '#5ac8c8', fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 },

  // ── Tabs ──
  tabs: { flexDirection: 'row', backgroundColor: '#161618', borderRadius: 12, padding: 3, marginTop: 12, marginBottom: 14 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 2 },
  tabActive: { backgroundColor: '#222225' },
  tabText: { color: '#555', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#ff9f0a', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  tabBadgeText: { color: '#000', fontSize: 10, fontWeight: '800' },

  // ── Hero (encabezado de cada sección) ──
  heroEmoji: { fontSize: 36, textAlign: 'center', marginBottom: 6 },
  heroTitle: { fontSize: 22, fontWeight: '700', color: '#fff', textAlign: 'center', letterSpacing: -0.5 },
  heroSub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 18, lineHeight: 18, paddingHorizontal: 10 },

  // ── Form Card ──
  formCard: { backgroundColor: '#161618', borderRadius: 16, overflow: 'hidden', marginBottom: 0 },
  field: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 54 },
  fieldIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#1e1e21', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 10, color: '#666', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldValue: { fontSize: 14, color: '#5ac8c8', fontWeight: '600' },
  fieldInput: { fontSize: 16, color: '#fff', fontWeight: '500', padding: 0, margin: 0, height: 24 },
  fieldChevron: { fontSize: 18, color: '#444', fontWeight: '300', marginLeft: 6 },
  fieldDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#2a2a2d', marginLeft: 54 },

  // ── Fila dual (fecha + hora) ──
  dualRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  dualField: { flex: 1, backgroundColor: '#161618', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 14, alignItems: 'center' },
  dualLabel: { fontSize: 10, color: '#666', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  dualValue: { fontSize: 22, color: '#5ac8c8', fontWeight: '700' },

  // ── Prefijo inline ──
  prefixBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e21', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 10, gap: 4 },
  prefixText: { fontSize: 13, color: '#5ac8c8', fontWeight: '600' },
  prefixChevron: { fontSize: 14, color: '#555' },

  // ── Botón principal ──
  mainBtn: { backgroundColor: '#5ac8c8', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 14, marginBottom: 4 },
  mainBtnText: { color: '#000', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },

  // ── Botón peligro ──
  dangerBtn: { borderWidth: 1.5, borderColor: '#ff453a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  dangerBtnText: { color: '#ff453a', fontSize: 15, fontWeight: '600' },

  // ── Toast / Mensaje ──
  toast: { borderRadius: 18, padding: 28, marginTop: 20, alignItems: 'center' },
  toastPend: { backgroundColor: '#5ac8c815', borderWidth: 1, borderColor: '#5ac8c830' },
  toastOk: { backgroundColor: '#34c75915', borderWidth: 1, borderColor: '#34c75930' },
  toastErr: { backgroundColor: '#ff453a15', borderWidth: 1, borderColor: '#ff453a30' },
  toastEmoji: { fontSize: 44, marginBottom: 12 },
  toastTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  toastCode: { fontSize: 32, fontWeight: '800', color: '#d4a855', letterSpacing: 4, marginTop: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  toastNote: { fontSize: 13, color: '#888', marginTop: 12, textAlign: 'center', lineHeight: 18 },

  // ── Resultado consulta ──
  resultCard: { backgroundColor: '#161618', borderRadius: 18, padding: 20, marginTop: 20 },
  resultTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#2a2a2d' },
  resultCode: { fontSize: 20, fontWeight: '800', color: '#d4a855', letterSpacing: 2, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  resultGrid: { gap: 12 },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  resultItemLabel: { fontSize: 13, color: '#666' },
  resultItemVal: { fontSize: 15, color: '#fff', fontWeight: '600' },

  // ── Pill / Badge de estado ──
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 6 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 12, fontWeight: '700' },

  // ── Picker Sheet ──
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 34 },
  sheetBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#333' },
  sheetDone: { color: '#5ac8c8', fontSize: 17, fontWeight: '600' },

  // ── Admin Header ──
  admHead: { marginTop: 4, marginBottom: 16 },
  admHeadRow: { flexDirection: 'row', alignItems: 'center' },
  admLogo: { width: 46, height: 46, borderRadius: 14 },
  admSaludo: { fontSize: 13, color: '#888', fontWeight: '500', lineHeight: 16 },
  admNombre: { fontSize: 17, fontWeight: '700', color: '#fff', marginTop: 1, letterSpacing: -0.3, lineHeight: 20 },
  admLogout: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#222225', alignItems: 'center', justifyContent: 'center' },

  // ── Stats orgánicos ──
  statsWrap: { marginBottom: 16 },
  statBig: { backgroundColor: '#161618', borderRadius: 18, padding: 18, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#5ac8c8' },
  statBigNum: { fontSize: 38, fontWeight: '800', color: '#5ac8c8', letterSpacing: -2, lineHeight: 42 },
  statBigLabel: { fontSize: 15, color: '#ccc', fontWeight: '500', marginTop: 4 },
  statBigSub: { fontSize: 13, color: '#555', marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 8 },
  statSmall: { flex: 1, backgroundColor: '#161618', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10, borderTopWidth: 3, alignItems: 'center', justifyContent: 'center', minHeight: 68 },
  statSmallNum: { fontSize: 22, fontWeight: '800', letterSpacing: -1, lineHeight: 26 },
  statSmallLabel: { fontSize: 10, color: '#666', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // ── Toggle ──
  toggle: { flexDirection: 'row', backgroundColor: '#161618', borderRadius: 14, padding: 4, marginBottom: 20 },
  toggleItem: { flex: 1, paddingVertical: 12, borderRadius: 11, alignItems: 'center' },
  toggleActive: { backgroundColor: '#222225' },
  toggleText: { color: '#666', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#5ac8c8' },

  // ── Refresh ──
  refreshBtn: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#161618', marginBottom: 20 },
  refreshText: { color: '#5ac8c8', fontSize: 13, fontWeight: '600' },

  // ── Secciones ──
  section: { marginBottom: 28 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  sectionCount: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  sectionCountText: { fontSize: 14, fontWeight: '800' },

  // ── Tarjeta reserva admin ──
  rCard: { flexDirection: 'row', backgroundColor: '#161618', borderRadius: 16, marginBottom: 10, overflow: 'hidden' },
  rStripe: { width: 4 },
  rBody: { flex: 1, padding: 16 },
  rTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rTime: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5, lineHeight: 26 },
  rDate: { fontSize: 12, color: '#777', marginTop: 2 },
  rInfo: { gap: 6, marginBottom: 10 },
  rInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rInfoIcon: { fontSize: 14, width: 20, textAlign: 'center' },
  rInfoText: { fontSize: 14, color: '#bbb', fontWeight: '500', flex: 1 },
  rCode: { fontSize: 11, color: '#444', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', marginBottom: 12 },
  rActions: { flexDirection: 'row', gap: 8 },
  rBtnOk: { flex: 1, backgroundColor: '#34c759', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  rBtnOkText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  rBtnNo: { flex: 1, backgroundColor: '#ff453a18', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ff453a35' },
  rBtnNoText: { color: '#ff453a', fontSize: 14, fontWeight: '700' },
  rBtnCall: { backgroundColor: '#5ac8c818', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#5ac8c835' },
  rBtnCallText: { color: '#5ac8c8', fontSize: 14, fontWeight: '600' },

  // ── Empty state ──
  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 30 },
  emptyEmoji: { fontSize: 52, marginBottom: 14, opacity: 0.7 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },

  // ── Navegación fecha (agenda) ──
  dateNav: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161618', borderRadius: 16, padding: 6, marginBottom: 12 },
  dateNavArrow: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#222225', alignItems: 'center', justifyContent: 'center' },
  dateNavArrowText: { fontSize: 24, color: '#5ac8c8', fontWeight: '300' },
  dateNavCenter: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dateNavDay: { fontSize: 15, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  dateNavFull: { fontSize: 12, color: '#777', marginTop: 2, textTransform: 'capitalize' },
  todayChip: { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#5ac8c812', borderWidth: 1, borderColor: '#5ac8c825', marginBottom: 16 },
  todayChipText: { color: '#5ac8c8', fontSize: 13, fontWeight: '600' },
  agendaSummary: { fontSize: 13, fontWeight: '600', color: '#777', marginBottom: 12 },

  // ── Modales ──
  modalBg: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: { backgroundColor: '#1c1c1e', borderRadius: 24, padding: 28, marginHorizontal: 24, alignItems: 'center' },
  modalEmoji: { fontSize: 44, marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  modalInput: { width: '100%', backgroundColor: '#0a0a0a', borderRadius: 14, padding: 16, color: '#fff', fontSize: 15, minHeight: 90, textAlignVertical: 'top', borderWidth: 1, borderColor: '#333' },
  modalCounter: { fontSize: 11, color: '#555', alignSelf: 'flex-end', marginTop: 6, marginBottom: 18 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnCancel: { flex: 1, backgroundColor: '#222', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnCancelText: { color: '#aaa', fontSize: 15, fontWeight: '600' },
  modalBtnDanger: { flex: 1, backgroundColor: '#ff453a', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalBtnDangerText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // ── Calendario modal ──
  calModal: { backgroundColor: '#1c1c1e', borderRadius: 24, padding: 22, marginHorizontal: 20 },
  calHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  calArrow: { fontSize: 28, color: '#5ac8c8', fontWeight: '300', paddingHorizontal: 10 },
  calTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center', textTransform: 'capitalize' },
  calClose: { fontSize: 22, color: '#666', fontWeight: '300' },
  calWeek: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  calWeekDay: { width: 38, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#555' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  calCellToday: { backgroundColor: '#ff9f0a20', borderRadius: 10 },
  calCellSel: { backgroundColor: '#5ac8c825', borderRadius: 10 },
  calNum: { fontSize: 16, color: '#ddd', fontWeight: '500' },
  calNumToday: { color: '#ff9f0a', fontWeight: '800' },
  calNumSel: { color: '#5ac8c8', fontWeight: '800' },
  calDot: { position: 'absolute', bottom: 3, backgroundColor: '#5ac8c8', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  calDotText: { fontSize: 9, color: '#000', fontWeight: '800' },
});
