import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';

import LoginScreen from './screens/LoginScreen';
import EmpreendimentosScreen from './screens/EmpreendimentosScreen';
import PlantaScreen from './screens/PlantaScreen';
import PropostaScreen from './screens/PropostaScreen';
import PropostasSalvasScreen from './screens/PropostasSalvasScreen';
import CadastroScreen from './screens/CadastroScreen';
import EsqueciMinhaSenhaScreen from './screens/EsqueciMinhaSenhaScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ActionSheetProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="EsqueciMinhaSenhaScreen" component={EsqueciMinhaSenhaScreen} />
          <Stack.Screen name="Empreendimentos" component={EmpreendimentosScreen} />
          <Stack.Screen name="Planta" component={PlantaScreen} />
          <Stack.Screen name="Proposta" component={PropostaScreen} />
          <Stack.Screen name="PropostasSalvas" component={PropostasSalvasScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ActionSheetProvider>
  );
}