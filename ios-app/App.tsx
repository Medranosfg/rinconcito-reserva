import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, Image, Linking, Modal, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// URL de tu API - cambiar cuando despliegues
const API_URL = 'https://ungravitating-caroll-chemosynthetically.ngrok-free.dev';
const ADMIN_PASS = 'anaga2024';

type Tab = 'reservar' | 'consultar' | 'admin';
type AdminView = 'list' | 'calendar';
type Estado = 'pendiente' | 'confirmada' | 'cancelada';

interface Cliente {
  nombre: string;
  telefono: string;
}

interface Reserva {
  codigo: string;
  fecha: string;
  hora: string;
  comensales: number;
  cliente: Cliente;
  estado: Estado;
}

const PREFIJOS = [
  { code: '+34', flag: '🇪🇸', country: 'España' },
  { code: '+1', flag: '🇺🇸', country: 'Estados Unidos' },
  { code: '+52', flag: '🇲🇽', country: 'México' },
  { code: '+54', flag: '🇦🇷', country: 'Argentina' },
  { code: '+55', flag: '🇧🇷', country: 'Brasil' },
  { code: '+56', flag: '🇨🇱', country: 'Chile' },
  { code: '+57', flag: '🇨🇴', country: 'Colombia' },
  { code: '+58', flag: '🇻🇪', country: 'Venezuela' },
  { code: '+51', flag: '🇵🇪', country: 'Perú' },
  { code: '+593', flag: '🇪🇨', country: 'Ecuador' },
  { code: '+33', flag: '🇫🇷', country: 'Francia' },
  { code: '+49', flag: '🇩🇪', country: 'Alemania' },
  { code: '+39', flag: '🇮🇹', country: 'Italia' },
  { code: '+44', flag: '🇬🇧', country: 'Reino Unido' },
  { code: '+351', flag: '🇵🇹', country: 'Portugal' },
  { code: '+41', flag: '🇨🇭', country: 'Suiza' },
  { code: '+31', flag: '🇳🇱', country: 'Países Bajos' },
  { code: '+32', flag: '🇧🇪', country: 'Bélgica' },
  { code: '+46', flag: '🇸🇪', country: 'Suecia' },
  { code: '+47', flag: '🇳🇴', country: 'Noruega' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('reservar');
  const [adminView, setAdminView] = useState<AdminView>('list');
  const [adminLogged, setAdminLogged] = useState(false);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [pendCount, setPendCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectCode, setRejectCode] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Form states
  const [fecha, setFecha] = useState(new Date());
  const [hora, setHora] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showComensalesPicker, setShowComensalesPicker] = useState(false);
  const [showPrefijoPicker, setShowPrefijoPicker] = useState(false);
  const [comensales, setComensales] = useState('2');
  const [nombre, setNombre] = useState('');
  const [prefijo, setPrefijo] = useState('+34');
  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'err' | 'pend'; texto: string; codigo?: string } | null>(null);
  const [reservaConsultada, setReservaConsultada] = useState<Reserva | null>(null);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reservas`);
      const data = await res.json();
      const lista = data.reservas || [];
      setReservas(lista);
      setPendCount(lista.filter((r: Reserva) => r.estado === 'pendiente').length);
    } catch (e) {
      console.error(e);
    }
  };


  const enviarReserva = async () => {
    if (!nombre || !telefono || !comensales) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    const numComensales = parseInt(comensales);
    if (isNaN(numComensales) || numComensales < 1) {
      Alert.alert('Error', 'Número de personas inválido');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: fecha.toISOString().split('T')[0],
          hora: hora.toTimeString().slice(0, 5),
          comensales: numComensales,
          cliente: { nombre, telefono: prefijo + telefono.replace(/\s/g, ''), email: 'app@local' }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ tipo: 'pend', texto: 'Solicitud Recibida', codigo: data.codigo });
        setNombre('');
        setTelefono('');
        setComensales('2');
        cargarReservas();
      } else {
        setMensaje({ tipo: 'err', texto: data.mensaje || 'Error' });
      }
    } catch {
      setMensaje({ tipo: 'err', texto: 'Error de conexión' });
    }
  };

  const buscarReserva = async () => {
    if (!codigo) return;
    try {
      const res = await fetch(`${API_URL}/api/reservas/${codigo.toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setReservaConsultada(data);
      } else {
        Alert.alert('No encontrada', 'No existe reserva con ese código');
        setReservaConsultada(null);
      }
    } catch {
      Alert.alert('Error', 'Error de conexión');
    }
  };

  const cancelarReserva = async (cod: string) => {
    Alert.alert('Cancelar', '¿Cancelar esta reserva?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí', style: 'destructive', onPress: async () => {
          try {
            await fetch(`${API_URL}/api/reservas/${cod}`, { 
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ canceladoPorCliente: true })
            });
            setReservaConsultada(null);
            setCodigo('');
            cargarReservas();
            Alert.alert('Cancelada', 'Reserva cancelada. El restaurante ha sido notificado.');
          } catch {
            Alert.alert('Error', 'No se pudo cancelar');
          }
        }
      }
    ]);
  };

  const confirmarReserva = async (cod: string) => {
    Alert.alert('Confirmar', '¿Confirmar reserva? Se enviará SMS al cliente.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí', onPress: async () => {
          try {
            await fetch(`${API_URL}/api/reservas/${cod}/confirmar`, { method: 'POST' });
            cargarReservas();
          } catch {
            Alert.alert('Error', 'No se pudo confirmar');
          }
        }
      }
    ]);
  };

  const rechazarReserva = async (cod: string) => {
    setRejectCode(cod);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmarRechazo = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Por favor indica el motivo del rechazo');
      return;
    }
    
    try {
      // Aquí enviarías el motivo al backend para incluirlo en el SMS
      await fetch(`${API_URL}/api/reservas/${rejectCode}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: rejectReason })
      });
      setShowRejectModal(false);
      setRejectCode('');
      setRejectReason('');
      cargarReservas();
      Alert.alert('Rechazada', 'Reserva rechazada y cliente notificado');
    } catch {
      Alert.alert('Error', 'No se pudo rechazar');
    }
  };

  const loginAdmin = () => {
    if (adminPass === ADMIN_PASS) {
      setAdminLogged(true);
      setAdminPass('');
      cargarReservas();
    } else {
      Alert.alert('Error', 'Contraseña incorrecta');
    }
  };

  const formatFecha = (fechaStr: string) => {
    return new Date(fechaStr).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Días vacíos al inicio
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getReservasForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return reservas.filter(r => r.fecha === dateStr);
  };


  const renderReservar = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Nueva Reserva</Text>
      <Text style={styles.cardSubtitle}>Completa los datos</Text>

      <TouchableOpacity style={styles.formRow} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.label}>Fecha</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.formRow} onPress={() => setShowTimePicker(true)}>
        <Text style={styles.label}>Hora</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{hora.toTimeString().slice(0, 5)}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.formRow}>
        <Text style={styles.label}>Personas</Text>
        <TextInput
          style={styles.input}
          value={comensales}
          onChangeText={setComensales}
          placeholder="2"
          placeholderTextColor="#666"
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.formRow}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Tu nombre"
          placeholderTextColor="#666"
        />
      </View>

      <TouchableOpacity style={styles.formRow} onPress={() => setShowPrefijoPicker(true)}>
        <Text style={styles.label}>País</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{PREFIJOS.find(p => p.code === prefijo)?.flag} {prefijo}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.formRow}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="600 000 000"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={enviarReserva}>
        <Text style={styles.btnText}>Solicitar Reserva</Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.pickerDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={fecha}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(_, d) => { if (d) setFecha(d); }}
                textColor="#fff"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Time Picker Modal */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.pickerDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={hora}
                mode="time"
                display="spinner"
                onChange={(_, d) => { if (d) setHora(d); }}
                textColor="#fff"
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Prefijo Picker Modal */}
      {showPrefijoPicker && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setShowPrefijoPicker(false)}>
                  <Text style={styles.pickerDone}>Listo</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={prefijo}
                onValueChange={setPrefijo}
                style={styles.iosPicker}
                itemStyle={styles.pickerItem}
              >
                {PREFIJOS.map(p => (
                  <Picker.Item key={p.code} label={`${p.flag}  ${p.country}  ${p.code}`} value={p.code} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      )}

      {mensaje && (
        <View style={[styles.msg, mensaje.tipo === 'ok' ? styles.msgOk : mensaje.tipo === 'pend' ? styles.msgPend : styles.msgErr]}>
          <Text style={styles.msgIcon}>{mensaje.tipo === 'pend' ? '⏳' : mensaje.tipo === 'ok' ? '✅' : '⚠️'}</Text>
          <Text style={styles.msgTitle}>{mensaje.texto}</Text>
          {mensaje.codigo && <Text style={styles.code}>{mensaje.codigo}</Text>}
          {mensaje.tipo === 'pend' && <Text style={styles.msgNote}>Pendiente de confirmación. Te avisaremos por SMS.</Text>}
        </View>
      )}
    </View>
  );


  const renderConsultar = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Consultar Reserva</Text>
      <Text style={styles.cardSubtitle}>Introduce tu código</Text>

      <View style={styles.formRow}>
        <Text style={styles.label}>Código</Text>
        <TextInput
          style={styles.input}
          value={codigo}
          onChangeText={(t) => setCodigo(t.toUpperCase())}
          placeholder="XXXXXXXX"
          placeholderTextColor="#666"
          autoCapitalize="characters"
          maxLength={8}
        />
      </View>

      <TouchableOpacity style={styles.btn} onPress={buscarReserva}>
        <Text style={styles.btnText}>Buscar</Text>
      </TouchableOpacity>

      {reservaConsultada && (
        <View style={[styles.msg, reservaConsultada.estado === 'confirmada' ? styles.msgOk : reservaConsultada.estado === 'pendiente' ? styles.msgPend : styles.msgErr]}>
          <Text style={styles.code}>{reservaConsultada.codigo}</Text>
          <View style={[styles.status, reservaConsultada.estado === 'confirmada' ? styles.statusConf : reservaConsultada.estado === 'pendiente' ? styles.statusPend : styles.statusCanc]}>
            <Text style={styles.statusText}>{reservaConsultada.estado.toUpperCase()}</Text>
          </View>
          <View style={styles.details}>
            <View style={styles.detail}><Text style={styles.detailLabel}>Fecha</Text><Text style={styles.detailValue}>{formatFecha(reservaConsultada.fecha)}</Text></View>
            <View style={styles.detail}><Text style={styles.detailLabel}>Hora</Text><Text style={styles.detailValue}>{reservaConsultada.hora}</Text></View>
            <View style={styles.detail}><Text style={styles.detailLabel}>Personas</Text><Text style={styles.detailValue}>{reservaConsultada.comensales}</Text></View>
            <View style={styles.detail}><Text style={styles.detailLabel}>Nombre</Text><Text style={styles.detailValue}>{reservaConsultada.cliente.nombre}</Text></View>
          </View>
          {reservaConsultada.estado !== 'cancelada' && (
            <TouchableOpacity style={styles.btnCancel} onPress={() => cancelarReserva(reservaConsultada.codigo)}>
              <Text style={styles.btnCancelText}>Cancelar Reserva</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderAdminLogin = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Panel Admin</Text>
      <Text style={styles.cardSubtitle}>Introduce la contraseña</Text>
      <TextInput
        style={styles.inputCenter}
        value={adminPass}
        onChangeText={setAdminPass}
        placeholder="Contraseña"
        placeholderTextColor="#666"
        secureTextEntry
      />
      <TouchableOpacity style={styles.btn} onPress={loginAdmin}>
        <Text style={styles.btnText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReservaAdmin = (r: Reserva) => (
    <View key={r.codigo} style={styles.adminCard}>
      <View style={styles.adminHeader}>
        <View style={styles.adminCodeContainer}>
          <Text style={styles.adminCodeLabel}>CÓDIGO</Text>
          <Text style={styles.adminCode}>{r.codigo}</Text>
        </View>
        <View style={[styles.statusBadge, r.estado === 'confirmada' ? styles.statusBadgeConf : r.estado === 'pendiente' ? styles.statusBadgePend : styles.statusBadgeCanc]}>
          <Text style={styles.statusBadgeText}>{r.estado === 'pendiente' ? 'PENDIENTE' : r.estado === 'confirmada' ? 'CONFIRMADA' : 'CANCELADA'}</Text>
        </View>
      </View>
      
      <View style={styles.reservaDetails}>
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(90,200,200,0.15)' }]}>
            <Text style={styles.iconText}>📆</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>FECHA</Text>
            <Text style={styles.detailValue}>{formatFecha(r.fecha)}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(212,168,85,0.15)' }]}>
            <Text style={styles.iconText}>🕐</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>HORA</Text>
            <Text style={styles.detailValue}>{r.hora}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,149,0,0.15)' }]}>
            <Text style={styles.iconText}>👤</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>COMENSALES</Text>
            <Text style={styles.detailValue}>{r.comensales} {r.comensales === 1 ? 'persona' : 'personas'}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
            <Text style={styles.iconText}>👨</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>CLIENTE</Text>
            <Text style={styles.detailValue}>{r.cliente.nombre}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
            <Text style={styles.iconText}>☎️</Text>
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>TELÉFONO</Text>
            <Text style={styles.detailValue}>{r.cliente.telefono}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.adminActions}>
        {r.estado === 'pendiente' ? (
          <>
            <TouchableOpacity style={styles.btnConfirm} onPress={() => confirmarReserva(r.codigo)}>
              <Text style={styles.btnConfirmIcon}>✓</Text>
              <Text style={styles.btnConfirmText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnReject} onPress={() => rechazarReserva(r.codigo)}>
              <Text style={styles.btnRejectIcon}>✕</Text>
              <Text style={styles.btnRejectText}>Rechazar</Text>
            </TouchableOpacity>
          </>
        ) : r.estado === 'confirmada' ? (
          <TouchableOpacity style={styles.btnCall} onPress={() => Linking.openURL(`tel:${r.cliente.telefono}`)}>
            <Text style={styles.btnCallIcon}>📞</Text>
            <Text style={styles.btnCallText}>Llamar Cliente</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );


  const renderAdmin = () => {
    const pend = reservas.filter(r => r.estado === 'pendiente');
    const conf = reservas.filter(r => r.estado === 'confirmada');
    const canc = reservas.filter(r => r.estado === 'cancelada');
    const hoy = new Date().toISOString().split('T')[0];
    const reservasHoy = reservas.filter(r => r.fecha === hoy);
    const totalComensalesHoy = reservasHoy.reduce((sum, r) => sum + r.comensales, 0);

    // Filtrar reservas por fecha seleccionada para vista calendario
    const fechaSeleccionada = selectedDate.toISOString().split('T')[0];
    const reservasFecha = reservas.filter(r => r.fecha === fechaSeleccionada).sort((a, b) => a.hora.localeCompare(b.hora));

    return (
      <View>
        {/* Header Admin Premium */}
        <View style={styles.adminTopHeader}>
          <Image source={require('./assets/icon.png')} style={styles.adminLogoBig} />
          <Text style={styles.adminTitleBig}>El Rinconcito de Anaga</Text>
          <Text style={styles.adminSubtitleBig}>Panel de Administración</Text>
          <TouchableOpacity style={styles.btnLogoutNew} onPress={() => setAdminLogged(false)}>
            <Text style={styles.btnLogoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas Premium - Grid 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={[styles.statCardNew, styles.statCardTeal]}>
              <View style={styles.statIconBox}>
                <Text style={styles.statIconNew}>📊</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumberNew}>{reservasHoy.length}</Text>
                <Text style={styles.statLabelNew}>Reservas Hoy</Text>
              </View>
            </View>
            <View style={[styles.statCardNew, styles.statCardGold]}>
              <View style={styles.statIconBox}>
                <Text style={styles.statIconNew}>🍽️</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statNumberNew}>{totalComensalesHoy}</Text>
                <Text style={styles.statLabelNew}>Comensales</Text>
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCardNew, styles.statCardOrange]}>
              <View style={styles.statIconBox}>
                <Text style={styles.statIconNew}>⏳</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statNumberNew, { color: '#ff9500' }]}>{pend.length}</Text>
                <Text style={styles.statLabelNew}>Pendientes</Text>
              </View>
            </View>
            <View style={[styles.statCardNew, styles.statCardGreen]}>
              <View style={styles.statIconBox}>
                <Text style={styles.statIconNew}>✅</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={[styles.statNumberNew, { color: '#34c759' }]}>{conf.length}</Text>
                <Text style={styles.statLabelNew}>Confirmadas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Toggle Vista Lista / Agenda */}
        <View style={styles.viewToggle}>
          <TouchableOpacity 
            style={[styles.toggleBtn, adminView === 'list' && styles.toggleBtnActive]} 
            onPress={() => setAdminView('list')}
          >
            <Text style={styles.toggleIcon}>📋</Text>
            <Text style={[styles.toggleText, adminView === 'list' && styles.toggleTextActive]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, adminView === 'calendar' && styles.toggleBtnActive]} 
            onPress={() => setAdminView('calendar')}
          >
            <Text style={styles.toggleIcon}>📅</Text>
            <Text style={[styles.toggleText, adminView === 'calendar' && styles.toggleTextActive]}>Agenda</Text>
          </TouchableOpacity>
        </View>

        {adminView === 'list' ? (
          // Vista Lista
          <>
            <TouchableOpacity style={styles.refresh} onPress={cargarReservas}>
              <Text style={styles.refreshText}>↻ Actualizar reservas</Text>
            </TouchableOpacity>

            {pend.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { borderLeftColor: '#ff9500' }]}>
                  <Text style={[styles.sectionTitle, { color: '#ff9500' }]}>⏳ PENDIENTES</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: 'rgba(255,149,0,0.2)' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#ff9500' }]}>{pend.length}</Text>
                  </View>
                </View>
                {pend.map(renderReservaAdmin)}
              </View>
            )}

            {conf.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { borderLeftColor: '#34c759' }]}>
                  <Text style={[styles.sectionTitle, { color: '#34c759' }]}>✅ CONFIRMADAS</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: 'rgba(52,199,89,0.2)' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#34c759' }]}>{conf.length}</Text>
                  </View>
                </View>
                {conf.map(renderReservaAdmin)}
              </View>
            )}

            {canc.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={[styles.sectionHeader, { borderLeftColor: '#ff3b30' }]}>
                  <Text style={[styles.sectionTitle, { color: '#ff3b30' }]}>❌ CANCELADAS</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: 'rgba(255,59,48,0.2)' }]}>
                    <Text style={[styles.sectionBadgeText, { color: '#ff3b30' }]}>{canc.length}</Text>
                  </View>
                </View>
                {canc.slice(0, 5).map(renderReservaAdmin)}
              </View>
            )}

            {pend.length === 0 && conf.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🍴</Text>
                <Text style={styles.emptyText}>No hay reservas</Text>
              </View>
            )}
          </>
        ) : (
          // Vista Agenda
          <>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}>
                <Text style={styles.calendarArrow}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendarModal(true)}>
                <Text style={styles.calendarDate}>
                  {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
                <Text style={styles.calendarTap}>Toca para ver calendario</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}>
                <Text style={styles.calendarArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.todayBtn} onPress={() => setSelectedDate(new Date())}>
              <Text style={styles.todayBtnText}>Hoy</Text>
            </TouchableOpacity>

            {reservasFecha.length > 0 ? (
              <>
                <Text style={styles.agendaTitle}>
                  {reservasFecha.length} {reservasFecha.length === 1 ? 'reserva' : 'reservas'} • {reservasFecha.reduce((sum, r) => sum + r.comensales, 0)} comensales
                </Text>
                {reservasFecha.map(renderReservaAdmin)}
              </>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>No hay reservas este día</Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {adminLogged ? (
        // Vista Admin - Completamente separada
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderAdmin()}
        </ScrollView>
      ) : (
        // Vista Cliente - Con tabs
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Image source={require('./assets/icon.png')} style={styles.logo} />
            <Text style={styles.subtitle}>RESERVAS ONLINE</Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === 'reservar' && styles.tabActive]} onPress={() => { setTab('reservar'); setMensaje(null); }}>
              <Text style={[styles.tabText, tab === 'reservar' && styles.tabTextActive]}>Reservar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'consultar' && styles.tabActive]} onPress={() => { setTab('consultar'); setReservaConsultada(null); }}>
              <Text style={[styles.tabText, tab === 'consultar' && styles.tabTextActive]}>Consultar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'admin' && styles.tabActive]} onPress={() => setTab('admin')}>
              <Text style={[styles.tabText, tab === 'admin' && styles.tabTextActive]}>Admin</Text>
              {pendCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{pendCount}</Text></View>}
            </TouchableOpacity>
          </View>

          {tab === 'reservar' && renderReservar()}
          {tab === 'consultar' && renderConsultar()}
          {tab === 'admin' && renderAdminLogin()}
        </ScrollView>
      )}

      {/* Modal de Rechazo con Motivo */}
      <Modal visible={showRejectModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModal}>
            <Text style={styles.rejectTitle}>Rechazar Reserva</Text>
            <Text style={styles.rejectSubtitle}>Indica el motivo (se enviará al cliente por SMS)</Text>
            <TextInput
              style={styles.rejectInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Ej: No hay disponibilidad para esa hora"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              maxLength={160}
            />
            <Text style={styles.rejectCounter}>{rejectReason.length}/160</Text>
            <View style={styles.rejectActions}>
              <TouchableOpacity style={styles.rejectCancel} onPress={() => setShowRejectModal(false)}>
                <Text style={styles.rejectCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectConfirm} onPress={confirmarRechazo}>
                <Text style={styles.rejectConfirmText}>Rechazar y Notificar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Calendario Mensual */}
      <Modal visible={showCalendarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>
                {selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Text style={styles.calendarModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weekDays}>
              {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((day, i) => (
                <Text key={i} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            <View style={styles.monthGrid}>
              {getDaysInMonth(selectedDate).map((day, index) => {
                if (!day) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }
                
                const reservasDay = getReservasForDate(day);
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = day.toDateString() === selectedDate.toDateString();
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected
                    ]}
                    onPress={() => {
                      setSelectedDate(day);
                      setShowCalendarModal(false);
                    }}
                  >
                    <Text style={[
                      styles.dayNumber,
                      isToday && styles.dayNumberToday,
                      isSelected && styles.dayNumberSelected
                    ]}>
                      {day.getDate()}
                    </Text>
                    {reservasDay.length > 0 && (
                      <View style={styles.dayDot}>
                        <Text style={styles.dayDotText}>{reservasDay.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#5ac8c8' }]} />
                <Text style={styles.legendText}>Día seleccionado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff9500' }]} />
                <Text style={styles.legendText}>Hoy</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 20 },
  logo: { width: 100, height: 100, marginBottom: 6 },
  subtitle: { color: '#5ac8c8', fontSize: 10, fontWeight: '500', letterSpacing: 2 },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 10, padding: 3, marginBottom: 20 },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#fff' },
  badge: { backgroundColor: '#ff9500', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8, marginLeft: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  card: { backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 4 },
  cardSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  formRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, marginBottom: 10 },
  label: { fontSize: 15, color: '#fff' },
  valueContainer: { flexDirection: 'row', alignItems: 'center' },
  value: { color: '#5ac8c8', fontSize: 16, fontWeight: '500' },
  chevron: { color: 'rgba(255,255,255,0.3)', fontSize: 20, marginLeft: 8, fontWeight: '300' },
  input: { color: '#5ac8c8', fontSize: 16, fontWeight: '500', textAlign: 'right', minWidth: 120, flex: 1 },
  inputCenter: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 10 },
  phoneGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pickerContainer: { width: 100, marginRight: 8 },
  picker: { color: '#5ac8c8', height: 30 },
  btn: { backgroundColor: '#5ac8c8', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '600' },
  btnCancel: { borderWidth: 1, borderColor: '#ff3b30', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  btnCancelText: { color: '#ff3b30', fontSize: 16, fontWeight: '600' },
  msg: { padding: 24, borderRadius: 14, marginTop: 16, alignItems: 'center' },
  msgOk: { backgroundColor: 'rgba(52,199,89,0.12)', borderWidth: 1, borderColor: 'rgba(52,199,89,0.3)' },
  msgErr: { backgroundColor: 'rgba(255,59,48,0.12)', borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  msgPend: { backgroundColor: 'rgba(90,200,200,0.12)', borderWidth: 1, borderColor: 'rgba(90,200,200,0.3)' },
  msgIcon: { fontSize: 40, marginBottom: 10 },
  msgTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 6 },
  msgNote: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 10, textAlign: 'center' },
  code: { fontSize: 28, fontWeight: '700', color: '#d4a855', letterSpacing: 3, marginVertical: 12, fontFamily: 'monospace' },
  status: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  statusText: { fontSize: 11, fontWeight: '600' },
  statusPend: { backgroundColor: 'rgba(255,149,0,0.15)' },
  statusConf: { backgroundColor: 'rgba(52,199,89,0.15)' },
  statusCanc: { backgroundColor: 'rgba(255,59,48,0.15)' },
  details: { marginTop: 16, width: '100%' },
  detail: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  refresh: { backgroundColor: 'rgba(90,200,200,0.1)', borderWidth: 1, borderColor: 'rgba(90,200,200,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 },
  refreshText: { color: '#5ac8c8', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  adminCard: { backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 14 },
  adminHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  adminCodeContainer: { flex: 1 },
  adminCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  adminCode: { fontSize: 20, fontWeight: '700', color: '#d4a855', letterSpacing: 2, fontFamily: 'monospace' },
  reservaDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText: { fontSize: 20 },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: '#fff', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  statusBadgePend: { backgroundColor: 'rgba(255,149,0,0.2)' },
  statusBadgeConf: { backgroundColor: 'rgba(52,199,89,0.2)' },
  statusBadgeCanc: { backgroundColor: 'rgba(255,59,48,0.2)' },
  adminActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnConfirm: { flex: 1, backgroundColor: '#34c759', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnConfirmIcon: { fontSize: 18, color: '#fff' },
  btnConfirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnReject: { flex: 1, backgroundColor: '#ff3b30', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnRejectIcon: { fontSize: 18, color: '#fff' },
  btnRejectText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnCall: { flex: 1, backgroundColor: '#5ac8c8', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  btnCallIcon: { fontSize: 18, color: '#000' },
  btnCallText: { color: '#000', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40, backgroundColor: 'rgba(28,28,30,0.5)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' },
  emptyIcon: { fontSize: 48, marginBottom: 12, opacity: 0.5 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  // iOS Picker Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerModal: { backgroundColor: '#1c1c1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  pickerDone: { color: '#5ac8c8', fontSize: 17, fontWeight: '600' },
  iosPicker: { width: '100%', height: 216 },
  pickerItem: { color: '#fff', fontSize: 20, height: 216 },
  // Admin Panel Styles
  adminTopHeader: { alignItems: 'center', marginBottom: 24, paddingTop: 20, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: 'rgba(28,28,30,0.95)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  adminLogoBig: { width: 80, height: 80, borderRadius: 20, marginBottom: 12 },
  adminTitleBig: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4, textAlign: 'center' },
  adminSubtitleBig: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textAlign: 'center' },
  btnLogoutNew: { backgroundColor: 'rgba(255,59,48,0.15)', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,59,48,0.3)' },
  btnLogoutText: { color: '#ff3b30', fontSize: 14, fontWeight: '600' },
  // Stats Grid 2x2
  statsGrid: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCardNew: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(28,28,30,0.95)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statCardTeal: { borderLeftWidth: 4, borderLeftColor: '#5ac8c8' },
  statCardGold: { borderLeftWidth: 4, borderLeftColor: '#d4a855' },
  statCardOrange: { borderLeftWidth: 4, borderLeftColor: '#ff9500' },
  statCardGreen: { borderLeftWidth: 4, borderLeftColor: '#34c759' },
  statIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statIconNew: { fontSize: 22 },
  statInfo: { flex: 1 },
  statNumberNew: { fontSize: 24, fontWeight: '700', color: '#5ac8c8', marginBottom: 2 },
  statLabelNew: { fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 },
  // Section Styles
  sectionContainer: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingLeft: 12, borderLeftWidth: 3 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  sectionBadgeText: { fontSize: 13, fontWeight: '700' },
  // View Toggle
  viewToggle: { flexDirection: 'row', backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  toggleBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  toggleBtnActive: { backgroundColor: 'rgba(90,200,200,0.2)' },
  toggleIcon: { fontSize: 16 },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#5ac8c8' },
  // Calendar View
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(28,28,30,0.85)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  calendarArrow: { fontSize: 28, color: '#5ac8c8', fontWeight: '300', paddingHorizontal: 12 },
  calendarDate: { fontSize: 16, fontWeight: '600', color: '#fff', textTransform: 'capitalize' },
  todayBtn: { backgroundColor: 'rgba(90,200,200,0.15)', borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(90,200,200,0.3)' },
  todayBtnText: { color: '#5ac8c8', fontSize: 14, fontWeight: '600' },
  agendaTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  // Reject Modal
  rejectModal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 24, marginHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rejectTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  rejectSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 20, textAlign: 'center' },
  rejectInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rejectCounter: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: 8, marginBottom: 16 },
  rejectActions: { flexDirection: 'row', gap: 12 },
  rejectCancel: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  rejectCancelText: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
  rejectConfirm: { flex: 1, backgroundColor: '#ff3b30', borderRadius: 12, padding: 14, alignItems: 'center' },
  rejectConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Calendar Modal
  calendarModal: { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20, marginHorizontal: 20, marginVertical: 60, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  calendarModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  calendarModalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textTransform: 'capitalize' },
  calendarModalClose: { fontSize: 28, color: 'rgba(255,255,255,0.6)', fontWeight: '300' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  weekDay: { width: 40, textAlign: 'center', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 4 },
  dayCellToday: { backgroundColor: 'rgba(255,149,0,0.15)', borderRadius: 8 },
  dayCellSelected: { backgroundColor: 'rgba(90,200,200,0.2)', borderRadius: 8 },
  dayNumber: { fontSize: 16, color: '#fff', fontWeight: '500' },
  dayNumberToday: { color: '#ff9500', fontWeight: '700' },
  dayNumberSelected: { color: '#5ac8c8', fontWeight: '700' },
  dayDot: { position: 'absolute', bottom: 4, backgroundColor: '#5ac8c8', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  dayDotText: { fontSize: 10, color: '#000', fontWeight: '700' },
  calendarLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  calendarTap: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, textAlign: 'center' },
});
