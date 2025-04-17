import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import colors from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';
import BaseInput from '../components/BaseInput';
import BaseButton from '../components/BaseButton';

export default function VisualizarPDFScreen({ route }) {
  const { url } = route.params;

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: url, cache: true }}
        style={styles.pdf}
        onError={(error) => console.error('Erro ao carregar PDF:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
