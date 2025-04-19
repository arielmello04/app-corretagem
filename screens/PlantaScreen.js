import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';
import { supabase } from '../utils/supabase';

const NUM_COLUMNS = 10;
const TOTAL_LOTES = 350;
const DIAS_EXPIRACAO = 5 * 24 * 60 * 60 * 1000;

export default function PlantaScreen({ route, navigation }) {
  const { nomeEmpreendimento } = route.params;
  const [lotes, setLotes] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    const verificarSessao = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    };

    const carregarUsuario = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUsuarioLogado(data.user);
    };

    verificarSessao();
    carregarUsuario();
  }, []);

  const carregarReservas = async () => {
    const { data: reservas } = await supabase.from('propostas').select('*');
    const lotesGerados = Array.from({ length: TOTAL_LOTES }, (_, i) => {
      const numero = i + 1;
      const proposta = reservas?.find((p) => p.lote === numero);
      let status = proposta ? 'reservado' : numero <= 200 ? 'vendido' : 'disponivel';
      return {
        numero,
        status,
        dataReserva: proposta?.created_at ? new Date(proposta.created_at).getTime() : null,
        proposta,
      };
    });
    setLotes(lotesGerados);
  };

  useEffect(() => {
    if (isFocused) {
      carregarReservas();
    }
  }, [isFocused]);

  useEffect(() => {
    const agora = Date.now();
    setLotes((prev) =>
      prev.map((lote) => {
        if (
          lote.status === 'reservado' &&
          lote.dataReserva &&
          agora - lote.dataReserva > DIAS_EXPIRACAO
        ) {
          return { ...lote, status: 'disponivel', dataReserva: null, proposta: null };
        }
        return lote;
      })
    );
  }, []);

  const cancelarProposta = async (numeroLote) => {
    const { error } = await supabase
      .from('propostas')
      .delete()
      .eq('lote', numeroLote)
      .eq('user_id', usuarioLogado?.id);

    if (!error) {
      setLotes((prev) =>
        prev.map((l) =>
          l.numero === numeroLote
            ? { ...l, status: 'disponivel', dataReserva: null, proposta: null }
            : l
        )
      );
      Alert.alert('Proposta cancelada com sucesso.');
    }
  };

  const handlePressLote = (lote) => {
    const isAutor = lote?.proposta?.user_id === usuarioLogado?.id;

    if (lote.status === 'disponivel') {
      Alert.alert(`Reservar Lote ${lote.numero}`, 'Deseja continuar com a reserva?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim',
          onPress: () => {
            navigation.navigate('Proposta', {
              lote: lote.numero,
              valor: 78999.9,
              onReservaConfirmada: (numeroLote, dadosProposta) => {
                setLotes((prev) =>
                  prev.map((l) =>
                    l.numero === numeroLote
                      ? {
                          ...l,
                          status: 'reservado',
                          dataReserva: Date.now(),
                          proposta: { ...dadosProposta },
                        }
                      : l
                  )
                );
              },
              onAtualizar: carregarReservas,
            });
          },
        },
      ]);
    } else if (lote.status === 'reservado' && isAutor) {
      Alert.alert(`Lote ${lote.numero}`, 'Escolha uma ação:', [
        {
          text: 'Editar Proposta',
          onPress: () => {
            navigation.navigate('Proposta', {
              lote: lote.numero,
              valor: lote.proposta?.valor || 78999.9,
              propostaExistente: lote.proposta,
              modoEdicao: true,
              onAtualizar: carregarReservas,
            });
          },
        },
        {
          text: 'Cancelar Proposta',
          style: 'destructive',
          onPress: () => cancelarProposta(lote.numero),
        },
        { text: 'Fechar', style: 'cancel' },
      ]);
    } else {
      Alert.alert(`Lote ${lote.numero}`, 'Lote vendido.');
    }
  };

  const renderItem = ({ item }) => {
    const backgroundColor =
      item.status === 'vendido' ? '#ef9a9a' : item.status === 'reservado' ? '#fff59d' : '#d3e5ff';

    return (
      <TouchableOpacity
        style={[styles.lote, { backgroundColor }]}
        onPress={() => handlePressLote(item)}
      >
        <Text style={styles.loteText}>{item.numero}</Text>
      </TouchableOpacity>
    );
  };

  const etapa1 = lotes.filter((l) => l.numero <= 100);
  const etapa2 = lotes.filter((l) => l.numero > 100 && l.numero <= 200);
  const etapa3 = lotes.filter((l) => l.numero > 200);

  return (
    <ScrollView style={styles.container}>
      <View style={{ paddingHorizontal: 8, marginBottom: 12 }}>
        <TouchableOpacity
          style={{ backgroundColor: '#2196f3', padding: 12, borderRadius: 8, alignItems: 'center' }}
          onPress={() => navigation.navigate('PropostasSalvas')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ver Propostas Salvas</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Planta - {nomeEmpreendimento}</Text>

      {[etapa1, etapa2, etapa3].map((etapaData, idx) => (
        <View key={idx} style={styles.etapaContainer}>
          <Text style={styles.etapaTitulo}>{idx + 1} ª Etapa</Text>
          <ScrollView horizontal>
            <FlatList
              data={etapaData}
              renderItem={renderItem}
              keyExtractor={(item) => item.numero.toString()}
              numColumns={NUM_COLUMNS}
              scrollEnabled={false}
              contentContainerStyle={styles.grid}
            />
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}

const screenWidth = Dimensions.get('window').width;
const loteSize = screenWidth / NUM_COLUMNS - 8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  etapaContainer: {
    marginBottom: 24,
  },
  etapaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'left',
    color: '#444',
  },
  grid: {
    alignItems: 'center',
    minWidth: screenWidth + 100,
  },
  lote: {
    width: loteSize,
    height: loteSize,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  loteText: {
    fontWeight: 'bold',
    color: '#333',
  },
});
