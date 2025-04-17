
import React, { useState } from 'react'
import { View, Text, StyleSheet, Alert } from 'react-native'
import BaseInput from '../components/BaseInput'
import BaseButton from '../components/BaseButton'
import colors from '../theme/colors'
import spacing from '../theme/spacing'
import typography from '../theme/typography'
import { supabase } from '../utils/supabase'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Informe seu e‑mail', 'Campo e‑mail não pode ficar vazio.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)

    if (error) {
      Alert.alert('Erro', error.message)
    } else {
      Alert.alert(
        'Verifique seu e‑mail',
        'Enviamos um link para você redefinir sua senha.'
      )
      navigation.goBack()
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Recuperar Senha</Text>

        <BaseInput
          label="E‑mail cadastrado"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={null}
        />

        <BaseButton
          title={loading ? 'Enviando...' : 'Enviar Link'}
          onPress={handleReset}
          containerStyle={styles.buttonWrapper}
          textStyle={{ fontSize: typography.h3 }}
          disabled={loading}
        />

        <Text
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          Voltar ao login
        </Text>
      </View>
    </View>
  )
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
    height: spacing.xl * 3,
    justifyContent: 'center',
    width: '100%',
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  back: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primary,
    textDecorationLine: 'underline',
    fontSize: typography.body,
  },
})
