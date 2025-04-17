import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';
import { supabase } from '../utils/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function PropostasSalvasScreen() {
  const [propostas, setPropostas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  const isFocused = useIsFocused();
  const navigation = useNavigation();

  useEffect(() => {
    if (isFocused) {
      carregarSessao();
      carregarPropostas();
    }
  }, [isFocused]);

  const carregarSessao = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      setUsuarioLogado(data.user);
    }
  };

  const carregarPropostas = async () => {
    const { data, error } = await supabase
      .from('propostas')
      .select('*')
      .order('id', { ascending: false });

    if (!error) {
      setPropostas(data);
    } else {
      console.error('Erro ao carregar propostas:', error);
    }
  };

  const confirmarExclusao = (id) => {
    Alert.alert(
      'Excluir Proposta',
      'Tem certeza que deseja excluir esta proposta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirProposta(id),
        },
      ]
    );
  };

  const excluirProposta = async (id) => {
    const { error } = await supabase.from('propostas').delete().eq('id', id);
    if (!error) {
      carregarPropostas();
    } else {
      console.error('Erro ao excluir:', error);
    }
  };

  const baixarPDF = async (url, nomeArquivo = 'proposta.pdf') => {
    try {
      const localUri = `${FileSystem.documentDirectory}${nomeArquivo}`;
      const download = await FileSystem.downloadAsync(url, localUri);
      Alert.alert('Download concluído', `Arquivo salvo em:\n${download.uri}`);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      Alert.alert('Erro ao baixar o PDF');
    }
  };

  const compartilharPDFLocal = async (url, nomeArquivo = 'proposta.pdf') => {
    try {
      const localUri = `${FileSystem.documentDirectory}${nomeArquivo}`;
      const download = await FileSystem.downloadAsync(url, localUri);

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Compartilhamento não disponível neste dispositivo');
        return;
      }

      await Sharing.shareAsync(download.uri);
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error);
      Alert.alert('Erro ao compartilhar o PDF');
    }
  };

  const propostasFiltradas = propostas.filter((item) => {
    const nome = item.dados_cliente?.nome?.toLowerCase() || '';
    const cpf = item.dados_cliente?.cpfOuCnpj|| '';
    const autor = item.user_id === usuarioLogado?.id;
    return autor && (nome.includes(filtro.toLowerCase()) || cpf.includes(filtro));
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Propostas Salvas</Text>

      <TextInput
        style={styles.filtroInput}
        placeholder="Buscar por nome ou CPF"
        value={filtro}
        onChangeText={setFiltro}
      />

      {propostasFiltradas.length === 0 && (
        <Text style={styles.subheader}>Nenhuma proposta encontrada.</Text>
      )}

      {propostasFiltradas.map((item) => (
        <View key={item.id} style={styles.card}>
          <Text style={styles.title}>Lote: {item.lote}</Text>
          <Text>Cliente: {item.dados_cliente?.nome}</Text>
          <Text>CPF: {item.dados_cliente?.cpfOuCnpj}</Text>
          <Text>Email: {item.dados_cliente?.email}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#4caf50' }]}
              onPress={() =>
                navigation.navigate('Proposta', {
                  lote: item.lote,
                  valor: item.valor,
                  propostaExistente: item,
                  modoEdicao: true,
                  onAtualizar: carregarPropostas,
                })
              }
            >
              <Text style={styles.buttonText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f44336' }]}
              onPress={() => confirmarExclusao(item.id)}
            >
              <Text style={styles.buttonText}>Excluir</Text>
            </TouchableOpacity>

            {item.pdf_url && (
              <>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#9c27b0' }]}
                  onPress={() =>
                    compartilharPDFLocal(item.pdf_url, `proposta_lote_${item.lote}.pdf`)
                  }
                >
                  <Text style={styles.buttonText}>Compartilhar PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#ff9800' }]}
                  onPress={() => baixarPDF(item.pdf_url, `proposta_lote_${item.lote}.pdf`)}
                >
                  <Text style={styles.buttonText}>Baixar PDF</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subheader: {
    textAlign: 'center',
    color: '#999',
  },
  filtroInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  button: {
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 4,
    flexGrow: 1,
    flexBasis: '48%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
