import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Print from 'expo-print';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';
import { supabase } from '../utils/supabase';

// Define a constante para o valor da parcela fixa do financiamento
const VALOR_PARCELA_FINANCIAMENTO = 592.50;

export default function PropostaScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { lote, valor, propostaExistente, modoEdicao, onAtualizar, onReservaConfirmada } = route.params;
  // Define um valor padrão caso 'valor' não seja passado ou seja inválido
  const VALOR_LOTE = typeof valor === 'number' && valor > 0 ? valor : 78999.90;

  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // Inicializa useForm
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    // Valores iniciais baseados na proposta existente ou nos padrões
    defaultValues: propostaExistente?.dados_cliente || {
      tipoPessoa: 'fisica', cpfOuCnpj: '', nome: '', email: '', nascimento: '', rg: '', emissor: '', emissao: '',
      naturalidade: '', celular: '', telefone: '', cep: '', endereco: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '',
      // Define 'avista' como padrão inicial
      formaEntrada: 'avista',
      // Valor da entrada inicial será calculado no useEffect com base na forma 'avista'
      valorEntrada: VALOR_LOTE.toFixed(2),
      parcelasEntrada: '1', // Para 'avista', significa 1 pagamento (o total)
      parcelasFinanciamento: '120', // Padrão inicial
      sinal: 'nao', valorSinal: ''
    }
  });

  // Observa todos os dados do formulário para reatividade
  const dados = watch();
  const formaEntradaAtual = watch('formaEntrada');

  // Efeito para carregar dados do usuário e verificar sessão
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
  }, [navigation]);

  // Efeito para calcular valorEntrada e parcelasEntrada baseado na formaEntrada
  useEffect(() => {
    // Converte sinal para número
    const sinalNum = parseFloat(dados.valorSinal) || 0;
  
    let newValorEntrada = 0;
    let newParcelasEntrada = '1';
  
    if (formaEntradaAtual === 'avista') {
      // À vista: paga tudo, subtrai o sinal
      newValorEntrada = VALOR_LOTE - sinalNum;
      newParcelasEntrada = '1';
    } else if (formaEntradaAtual === 'cartao') {
      // 10% de entrada menos sinal
      newValorEntrada = VALOR_LOTE * 0.10 - sinalNum;
      // mantém valor atual ou default em '1'
      const cur = parseInt(dados.parcelasEntrada, 10);
      newParcelasEntrada = (cur >= 1 && cur <= 18) ? String(cur) : '1';
    } else if (formaEntradaAtual === 'boleto') {
      // 15% de entrada menos sinal
      newValorEntrada = VALOR_LOTE * 0.15 - sinalNum;
      // se já estiver em 2 ou 3, mantém; senão, usa 2 como padrão
      const curBoleto = parseInt(dados.parcelasEntrada, 10);
      newParcelasEntrada =
        (curBoleto >= 2 && curBoleto <= 3) ? String(curBoleto) : '2';
    }
  
    // Atualiza formulário
    setValue('valorEntrada', newValorEntrada.toFixed(2), { shouldValidate: true });
    setValue('parcelasEntrada', newParcelasEntrada, { shouldValidate: true });
  
    // Zera ou restaura financiamento
    if (formaEntradaAtual === 'avista') {
      setValue('parcelasFinanciamento', '0');
    } else {
      const curFin = parseInt(dados.parcelasFinanciamento, 10);
      if (curFin === 0) setValue('parcelasFinanciamento', '120');
    }
  }, [
    formaEntradaAtual,
    VALOR_LOTE,
    dados.valorSinal,
    dados.parcelasEntrada,
    dados.parcelasFinanciamento,
    setValue
  ]);


  // --- Funções de Formatação (mantidas como antes) ---
  const formatarCpfCnpj = (value = '', tipoPessoa) => { 
    const digits = value.replace(/\D/g, '');
    const limitedDigits = tipoPessoa === 'juridica' ? digits.slice(0, 14) : digits.slice(0, 11);
    if (tipoPessoa === 'juridica') {
      // CNPJ: XX.XXX.XXX/XXXX-XX
      return limitedDigits
        .replace(/^(\d{2})/, '$1')
        .replace(/^(\d{2})(\d{3})/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d{3})/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{4})/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } else {
      // CPF: XXX.XXX.XXX-XX
      return limitedDigits
        .replace(/^(\d{3})/, '$1')
        .replace(/^(\d{3})(\d{3})/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d{3})/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
  };
  const formatarNascimento = (value = '') => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };
  const formatarTelefone = (value = '') => { 
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  };
  const formatarCelular = (value = '') => { 
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };
  const formatCurrency = (value) => { 
    if (value === null || value === undefined || value === '') return '';
    const number = parseFloat(String(value).replace(',', '.'));
    if (isNaN(number)) return '';
    // Garante pelo menos R$0,00 se o valor for 0
    return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
  };
  const handleCurrencyChange = (text, onChange) => { 
    const digits = text.replace(/\D/g, '');
    if (digits === '') { onChange(''); return; }
    const numericValue = parseInt(digits, 10) / 100;
    onChange(numericValue.toFixed(2));
  };
  const buscarEnderecoViaCEP = async (cep) => { 
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setValue('endereco', data.logradouro);
        setValue('bairro', data.bairro);
        setValue('cidade', data.localidade);
        setValue('estado', data.uf);
      } else {
        Alert.alert('CEP não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      Alert.alert('Erro ao buscar endereço', 'Verifique sua conexão ou tente novamente.');
    }
  };

  // Gera o HTML para impressão/PDF - ATUALIZADO
  const gerarHTML = () => {
    const valorLoteFormatado = formatCurrency(VALOR_LOTE);
    const valorEntradaFormatado = formatCurrency(dados.valorEntrada);
    const valorSinalFormatado = dados.sinal === 'sim' ? formatCurrency(dados.valorSinal) : '';
    const valorParcelaFinanciamentoFormatado = formatCurrency(VALOR_PARCELA_FINANCIAMENTO);

    let descricaoEntrada = '';
    if (dados.formaEntrada === 'avista') {
        descricaoEntrada = `${valorEntradaFormatado} (Pagamento à vista)`;
    } else if (dados.formaEntrada === 'cartao') {
        descricaoEntrada = `${valorEntradaFormatado} em ${dados.parcelasEntrada || '1'}x no Cartão de Crédito`;
    } else if (dados.formaEntrada === 'boleto') {
        descricaoEntrada = `${valorEntradaFormatado} em ${dados.parcelasEntrada || '2'}x no Boleto Bancário`; 
    }

    let descricaoFinanciamento = '';
    if (dados.formaEntrada !== 'avista' && parseInt(dados.parcelasFinanciamento || '0', 10) > 0) {
        descricaoFinanciamento = `Saldo financiado em ${dados.parcelasFinanciamento} parcelas fixas de ${valorParcelaFinanciamentoFormatado}.`;
    } else if (dados.formaEntrada === 'avista') {
        descricaoFinanciamento = "Pagamento integral realizado na entrada.";
    } else {
         descricaoFinanciamento = "Sem financiamento.";
    }

    return `
      <html>
        <head><meta charset="UTF-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 24px; font-size: 12px;">
          <h1 style="text-align: center; font-size: 18px; margin-bottom: 20px;">Proposta de Compra - Lote ${lote}</h1>
          <p style="text-align: center; font-size: 14px; margin-bottom: 25px;"><strong>Valor Total do Lote:</strong> ${valorLoteFormatado}</p>

          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px;">Dados do Proponente</h2>
          <p><strong>Tipo:</strong> ${dados.tipoPessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</p>
          <p><strong>${dados.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'}:</strong> ${formatarCpfCnpj(dados.cpfOuCnpj, dados.tipoPessoa)}</p>
          <p><strong>Nome / Razão Social:</strong> ${dados.nome || ''}</p>
          <p><strong>Data de Nascimento / Fundação:</strong> ${formatarNascimento(dados.nascimento)}</p>
          <p><strong>Email:</strong> ${dados.email || ''}</p>
          <p><strong>Celular:</strong> ${formatarCelular(dados.celular)}</p>
          <p><strong>Telefone:</strong> ${formatarTelefone(dados.telefone)}</p>
          ${dados.tipoPessoa === 'fisica' ? `
            <p><strong>RG:</strong> ${dados.rg || ''}</p>
            <p><strong>Órgão Emissor:</strong> ${dados.emissor || ''}</p>
            <p><strong>Data de Emissão:</strong> ${formatarNascimento(dados.emissao)}</p>
            <p><strong>Naturalidade:</strong> ${dados.naturalidade || ''}</p>
          ` : ''}

          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px;">Endereço</h2>
          <p><strong>CEP:</strong> ${dados.cep ? dados.cep.replace(/(\d{5})(\d{3})/, '$1-$2') : ''}</p>
          <p>${dados.endereco || ''}, ${dados.numero || 'S/N'} ${dados.complemento ? `- ${dados.complemento}` : ''}</p>
          <p>${dados.bairro || ''} - ${dados.cidade || ''} / ${dados.estado || ''}</p>


          <h2 style="font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; margin-bottom: 15px;">Condições de Pagamento</h2>
          <p><strong>Forma de Pagamento da Entrada:</strong> ${dados.formaEntrada === 'avista' ? 'À vista (PIX/TED)' : (dados.formaEntrada === 'cartao' ? 'Cartão de Crédito' : 'Boleto Bancário')}</p>
          <p><strong>Condição da Entrada:</strong> ${descricaoEntrada}</p>
          ${dados.sinal === 'sim' ? `<p><strong>Valor do Sinal:</strong> ${valorSinalFormatado}</p>` : ''}
          <p><strong>Condição do Financiamento:</strong> ${descricaoFinanciamento}</p>


          <p style="margin-top: 30px; font-size: 10px; text-align: right;">Proposta emitida em: ${new Date().toLocaleDateString('pt-BR')}</p>
        </body>
      </html>
    `;
  };

  // Salva ou atualiza a proposta no Supabase
  const salvarProposta = async (formData) => {
    // Garante que valores numéricos sejam salvos como números se necessário
    const propostaData = {
      lote,
      valor: VALOR_LOTE,
      dados_cliente: {
        ...formData,
        // Converte valores que devem ser numéricos, se a API esperar números
        valorEntrada: parseFloat(formData.valorEntrada) || 0,
        valorSinal: parseFloat(formData.valorSinal) || 0,
        parcelasEntrada: parseInt(formData.parcelasEntrada, 10) || 0,
        parcelasFinanciamento: parseInt(formData.parcelasFinanciamento, 10) || 0,
      },
      user_id: usuarioLogado?.id,
    };

    // Validação extra antes de salvar
    if (formData.formaEntrada === 'cartao' && (parseInt(formData.parcelasEntrada, 10) < 1 || parseInt(formData.parcelasEntrada, 10) > 18)) {
         Alert.alert('Erro de Validação', 'Número de parcelas no cartão deve ser entre 1 e 18.');
         return; // Impede o envio
    }
     if (formData.formaEntrada !== 'avista' && parseInt(formData.parcelasFinanciamento, 10) > 120) {
         Alert.alert('Erro de Validação', 'Número de parcelas do financiamento não pode exceder 120.');
         return; // Impede o envio
     }


    let result;
    try {
      if (modoEdicao && propostaExistente?.id) {
        const { error } = await supabase
          .from('propostas')
          .update(propostaData)
          .eq('id', propostaExistente.id);
        if (error) throw error;
        Alert.alert('Sucesso', 'Proposta atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('propostas')
          .insert([propostaData]);
         if (error) throw error;
         Alert.alert('Sucesso', 'Proposta salva com sucesso!');
      }

      if (onReservaConfirmada) onReservaConfirmada(lote, { ...formData, valor: VALOR_LOTE });
      if (onAtualizar) onAtualizar();
      navigation.goBack();

    } catch (error) {
      console.error('Erro ao salvar proposta:', error);
      Alert.alert('Erro', `Não foi possível salvar a proposta. Detalhes: ${error.message}`);
    }
  };

  // --- Renderização do Componente ---
return (
  <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>Proposta para Lote {lote}</Text>
        <Text style={styles.subheader}>Valor do Lote: {formatCurrency(VALOR_LOTE)}</Text>

        {/* --- Seção Dados Pessoais --- */}
        <Text style={styles.sectionTitle}>Dados Pessoais</Text>
        <Text style={styles.label}>Tipo de Pessoa:</Text>
        <Controller
          control={control}
          name="tipoPessoa"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                style={styles.picker}
                onValueChange={(itemValue) => {
                  onChange(itemValue);
                  setValue('cpfOuCnpj', '');
                }}
              >
                <Picker.Item label="Pessoa Física" value="fisica" />
                <Picker.Item label="Pessoa Jurídica" value="juridica" />
              </Picker>
            </View>
          )}
        />

        <Text style={styles.label}>
          {dados.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'}:
        </Text>
        <Controller
          control={control}
          name="cpfOuCnpj"
          rules={{
            required: `${dados.tipoPessoa === 'juridica' ? 'CNPJ' : 'CPF'} é obrigatório`
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                value={formatarCpfCnpj(value, dados.tipoPessoa)}
                onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                placeholder={dados.tipoPessoa === 'juridica' ? '00.000.000/0000-00' : '000.000.000-00'}
                keyboardType="numeric"
                style={[styles.input, errors.cpfOuCnpj && styles.inputError]}
              />
              {errors.cpfOuCnpj && (
                <Text style={styles.errorText}>{errors.cpfOuCnpj.message}</Text>
              )}
            </>
          )}
        />

        <Text style={styles.label}>
          {dados.tipoPessoa === 'juridica' ? 'Razão Social' : 'Nome Completo'}:
        </Text>
        <Controller
          control={control}
          name="nome"
          rules={{ required: 'Nome é obrigatório' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                placeholder={dados.tipoPessoa === 'juridica' ? 'Razão Social da Empresa' : 'Nome Completo'}
                style={[styles.input, errors.nome && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
              {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>
          Data de {dados.tipoPessoa === 'juridica' ? 'Fundação' : 'Nascimento'}:
        </Text>
        <Controller
          control={control}
          name="nascimento"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="DD/MM/AAAA"
              style={styles.input}
              value={formatarNascimento(value)}
              keyboardType="numeric"
              maxLength={10}
              onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
            />
          )}
        />

        <Text style={styles.label}>Email:</Text>
        <Controller
          control={control}
          name="email"
          rules={{
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                placeholder="seuemail@exemplo.com"
                style={[styles.input, errors.email && styles.inputError]}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </>
          )}
        />

        {dados.tipoPessoa === 'fisica' && (
          <>
            <Text style={styles.label}>RG:</Text>
            <Controller
              control={control}
              name="rg"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Número do RG"
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                />
              )}
            />

            <Text style={styles.label}>Órgão Emissor:</Text>
            <Controller
              control={control}
              name="emissor"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Ex: SSP/BA"
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="characters"
                />
              )}
            />

            <Text style={styles.label}>Data de Emissão:</Text>
            <Controller
              control={control}
              name="emissao"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="DD/MM/AAAA"
                  style={styles.input}
                  value={formatarNascimento(value)}
                  keyboardType="numeric"
                  maxLength={10}
                  onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                />
              )}
            />

            <Text style={styles.label}>Naturalidade:</Text>
            <Controller
              control={control}
              name="naturalidade"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  placeholder="Cidade / UF"
                  style={styles.input}
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
          </>
        )}

        <Text style={styles.label}>Celular:</Text>
        <Controller
          control={control}
          name="celular"
          rules={{ required: 'Celular é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="(XX) XXXXX-XXXX"
                style={[styles.input, errors.celular && styles.inputError]}
                value={formatarCelular(value)}
                keyboardType="numeric"
                maxLength={15}
                onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
              />
              {errors.celular && <Text style={styles.errorText}>{errors.celular.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Telefone Fixo (Opcional):</Text>
        <Controller
          control={control}
          name="telefone"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="(XX) XXXX-XXXX"
              style={styles.input}
              value={formatarTelefone(value)}
              keyboardType="numeric"
              maxLength={14}
              onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Endereço</Text>
        <Text style={styles.label}>CEP:</Text>
        <Controller
          control={control}
          name="cep"
          rules={{
            required: 'CEP é obrigatório',
            pattern: { value: /^\d{8}$/, message: 'CEP inválido' }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <TextInput
                value={value ? value.replace(/(\d{5})(\d{3})/, '$1-$2') : ''}
                placeholder="00000-000"
                style={[styles.input, errors.cep && styles.inputError]}
                keyboardType="numeric"
                maxLength={9}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '');
                  onChange(digits);
                  if (digits.length === 8) buscarEnderecoViaCEP(digits);
                }}
                onBlur={onBlur}
              />
              {errors.cep && <Text style={styles.errorText}>{errors.cep.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Endereço:</Text>
        <Controller
          control={control}
          name="endereco"
          rules={{ required: 'Endereço é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="Rua, Avenida, etc."
                style={[styles.input, errors.endereco && styles.inputError]}
                value={value}
                onChangeText={onChange}
              />
              {errors.endereco && <Text style={styles.errorText}>{errors.endereco.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Número:</Text>
        <Controller
          control={control}
          name="numero"
          rules={{ required: 'Número é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="Número ou S/N"
                style={[styles.input, errors.numero && styles.inputError]}
                value={value}
                onChangeText={onChange}
              />
              {errors.numero && <Text style={styles.errorText}>{errors.numero.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Complemento (Opcional):</Text>
        <Controller
          control={control}
          name="complemento"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Apto, Bloco, Casa"
              style={styles.input}
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        <Text style={styles.label}>Bairro:</Text>
        <Controller
          control={control}
          name="bairro"
          rules={{ required: 'Bairro é obrigatório' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="Bairro"
                style={[styles.input, errors.bairro && styles.inputError]}
                value={value}
                onChangeText={onChange}
              />
              {errors.bairro && <Text style={styles.errorText}>{errors.bairro.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Cidade:</Text>
        <Controller
          control={control}
          name="cidade"
          rules={{ required: 'Cidade é obrigatória' }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="Cidade"
                style={[styles.input, errors.cidade && styles.inputError]}
                value={value}
                onChangeText={onChange}
              />
              {errors.cidade && <Text style={styles.errorText}>{errors.cidade.message}</Text>}
            </>
          )}
        />

        <Text style={styles.label}>Estado (UF):</Text>
        <Controller
          control={control}
          name="estado"
          rules={{
            required: 'Estado é obrigatório',
            maxLength: { value: 2, message: 'UF inválida' }
          }}
          render={({ field: { onChange, value } }) => (
            <>
              <TextInput
                placeholder="UF"
                style={[styles.input, errors.estado && styles.inputError]}
                value={value}
                onChangeText={onChange}
                maxLength={2}
                autoCapitalize="characters"
              />
              {errors.estado && <Text style={styles.errorText}>{errors.estado.message}</Text>}
            </>
          )}
        />

        <Text style={styles.sectionTitle}>Condições de Pagamento</Text>
        <Text style={styles.label}>Forma de Pagamento da Entrada:</Text>
        <Controller
          control={control}
          name="formaEntrada"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker selectedValue={value} style={styles.picker} onValueChange={onChange}>
                <Picker.Item label="À vista (PIX/TED)" value="avista" />
                <Picker.Item label="Cartão de Crédito (Entrada 10%)" value="cartao" />
                <Picker.Item label="Boleto Bancário (Entrada 15%)" value="boleto" />
              </Picker>
            </View>
          )}
        />

        <Text style={styles.label}>Valor Calculado da Entrada:</Text>
        <Controller
          control={control}
          name="valorEntrada"
          render={({ field: { value } }) => (
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={formatCurrency(value)}
              editable={false}
            />
          )}
        />

        <Text style={styles.label}>Parcelas da Entrada:</Text>
        <Controller
          control={control}
          name="parcelasEntrada"
          rules={{
            required: 'Número de parcelas da entrada é obrigatório',
            validate: (v) => {
              if (dados.formaEntrada === 'cartao') {
                const n = parseInt(v, 10);
                return (n >= 1 && n <= 18) || 'Cartão: 1 a 18 parcelas';
              }
              if (dados.formaEntrada === 'boleto') {
                const n = parseInt(v, 10);
                return (n >= 2 && n <= 3) || 'Boleto: 2 ou 3 parcelas';
              }
              return true;
            }
          }}
          render={({ field: { onChange, value } }) => {
            // Se for À vista, só mostra '1'
            if (dados.formaEntrada === 'avista') {
              return (
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value="1"
                  editable={false}
                />
              );
            }

            // Determina o total de entrada já com sinal abatido
            const totalEntrada = parseFloat(dados.valorEntrada) || 0;

            // Define opções de quantidade
            const options =
              dados.formaEntrada === 'cartao'
                ? Array.from({ length: 18 }, (_, i) => i + 1)
                : [2, 3];

            return (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={value}
                  onValueChange={(v) => onChange(v)}
                  style={styles.picker}
                >
                  {options.map((n) => {
                    const valorParcela = totalEntrada / n;
                    return (
                      <Picker.Item
                        key={n}
                        label={`${n}x – ${formatCurrency(valorParcela)}`}
                        value={String(n)}
                      />
                    );
                  })}
                </Picker>
              </View>
            );
          }}
        />

        {dados.formaEntrada !== 'avista' && (
          <>
            <Text style={styles.label}>Parcelas do Financiamento (Saldo Restante):</Text>
            <Controller
              control={control}
              name="parcelasFinanciamento"
              rules={{
                required: 'Número de parcelas é obrigatório',
                min: { value: 1, message: 'Mínimo de 1 parcela' },
                max: { value: 120, message: 'Máximo de 120 parcelas' }
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="1 a 120"
                    style={[styles.input, errors.parcelasFinanciamento && styles.inputError]}
                    value={String(value)}
                    onChangeText={(text) => onChange(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    editable={dados.formaEntrada !== 'avista'}
                  />
                  {errors.parcelasFinanciamento && (
                    <Text style={styles.errorText}>{errors.parcelasFinanciamento.message}</Text>
                  )}
                  <Text style={styles.infoText}>
                    Valor da Parcela Fixa:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {formatCurrency(VALOR_PARCELA_FINANCIAMENTO)}
                    </Text>
                  </Text>
                </>
              )}
            />
          </>
        )}

        <Text style={styles.label}>Haverá Sinal de Negócio?</Text>
        <Controller
          control={control}
          name="sinal"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                style={styles.picker}
                onValueChange={(itemValue) => {
                  onChange(itemValue);
                  if (itemValue === 'nao') setValue('valorSinal', '');
                }}
              >
                <Picker.Item label="Não" value="nao" />
                <Picker.Item label="Sim" value="sim" />
              </Picker>
            </View>
          )}
        />
        {dados.sinal === 'sim' && (
          <>
            <Text style={styles.label}>Valor do Sinal:</Text>
            <Controller
              control={control}
              name="valorSinal"
              rules={{ required: 'Valor do sinal é obrigatório' }}
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    placeholder="R$ 0,00"
                    style={[styles.input, errors.valorSinal && styles.inputError]}
                    value={formatCurrency(value)}
                    keyboardType="numeric"
                    onChangeText={(text) => handleCurrencyChange(text, onChange)}
                  />
                  {errors.valorSinal && (
                    <Text style={styles.errorText}>{errors.valorSinal.message}</Text>
                  )}
                </>
              )}
            />
          </>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }
        ]}
      >
        <TouchableOpacity
          style={[styles.button, styles.buttonConfirm]}
          onPress={handleSubmit(salvarProposta)}
        >
          <Text style={styles.buttonText}>
            {modoEdicao ? 'Atualizar Proposta' : 'Confirmar Proposta'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonPdf]}
          onPress={async () => {
            try {
              const htmlContent = gerarHTML();
              const { uri } = await Print.printToFileAsync({ html: htmlContent });
              await Print.printAsync({ uri });
            } catch (error) {
              console.error('Erro ao gerar PDF:', error);
              Alert.alert('Erro', 'Não foi possível gerar o PDF.');
            }
          }}
        >
          <Text style={styles.buttonText}>Gerar PDF</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>
);

}

// --- Estilos (Adicionado hintText e infoText) ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f0f0f0', },
  scrollView: { flex: 1, backgroundColor: '#ffffff', },
  scrollContentContainer: { padding: 20, paddingBottom: 120, }, 
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: 8, },
  subheader: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 24, },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#005A9C', marginTop: 24, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingBottom: 6, },
  label: { fontSize: 14, color: '#444', marginBottom: 4, marginTop: 10, fontWeight: '500', },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', marginBottom: 6, },
  inputError: { borderColor: '#D32F2F', },
  inputDisabled: { backgroundColor: '#e9e9e9', color: '#555', }, 
  errorText: { color: '#D32F2F', fontSize: 12, marginBottom: 8, marginTop: -2 }, 
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff', marginBottom: 6, marginTop: 10, },
  picker: { height: 50, width: '100%', },
  footer: { backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingTop: 16, position: 'absolute', bottom: 0, left: 0, right: 0, }, // PaddingBottom dinâmico inline
  button: { flex: 1, marginHorizontal: 8, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', },
  buttonConfirm: { backgroundColor: '#4CAF50', },
  buttonPdf: { backgroundColor: '#2196F3', },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', },
  hintText: { 
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 8,
  },
  inputBlock: {
    marginBottom: 12,
  },
   infoText: { 
    fontSize: 13,
    color: '#333',
    marginTop: 4,
    marginBottom: 8,
  }
});