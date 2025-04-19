// src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import { supabase } from '../utils/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      Alert.alert('Erro no login', error.message);
    } else {
      navigation.navigate('Empreendimentos');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Login do Corretor</Text>

        <BaseInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <BaseInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <TouchableOpacity style={styles.forgotWrapper} onPress={() => navigation.navigate('EsqueciMinhaSenha')}>
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <View style={styles.buttonWrapper}>
          <BaseButton
            title="Entrar"
            onPress={handleLogin}
            containerStyle={styles.buttonWrapper}
            textStyle={{ fontSize: typography.h3 }}
          />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
          <Text style={styles.link}>Ainda não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  buttonWrapper: {
    marginTop: spacing.xl,          
    height: spacing.xl * 4,        
    justifyContent: 'center',      
    width: '100%',                 
    borderRadius: spacing.sm,     
    overflow: 'hidden',          
  },
  button: {},
  forgotWrapper: {
    marginTop: spacing.sm,
    alignItems: 'flex-end',
  },
  forgotText: {
    color: colors.primary, 
    fontSize: typography.caption,
    textDecorationLine: 'underline',
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: 'bold',
  },
});
