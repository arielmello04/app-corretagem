import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';
import { supabase } from '../utils/supabase';

const CODIGO_AUTORIZACAO = '7202';

export default function CadastroScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');

  const handleCadastro = async () => {
    if (codigo !== CODIGO_AUTORIZACAO) {
      Alert.alert('Código inválido', 'Você não está autorizado a se cadastrar.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      Alert.alert('Erro no cadastro', error.message);
    } else {
      Alert.alert('Cadastro realizado com sucesso!', 'Você já pode fazer login.');
      navigation.navigate('Login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Corretor</Text>

      <TextInput
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Código de Autorização"
        value={codigo}
        onChangeText={setCodigo}
        style={styles.input}
        keyboardType="numeric"
      />

      <Button title="Cadastrar" onPress={handleCadastro} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
});
