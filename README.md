App de corretagem

Aplicativo mobile React Native para criação, reserva e gerenciamento de propostas de compra de lotes.

Funcionalidades

Cadastro e login de corretores com código de autorização

Listagem de empreendimentos e plantas interativas de lotes

Reserva de lotes com proposta completa (dados pessoais, endereço, condições de pagamento)

Cálculo dinâmico de entrada, sinal e parcelas (pix, cartão e boleto)

Geração de PDF da proposta e compartilhamento/download

Listagem e gerenciamento de propostas salvas (editar, excluir, filtrar por nome/CPF)

Recuperação de CEP via ViaCEP

Tela de "Esqueci minha senha" com fluxo de recuperação

Tecnologias e bibliotecas

React Native

Expo (Print, FileSystem, Sharing)

React Navigation (Native Stack)

Supabase (autenticação e banco de dados)

react-hook-form para gerenciamento de formulários

@react-native-picker/picker para selects

react-native-pdf para visualização de PDF

Estrutura de pastas

/root
├── App.js
├── screens/
│   ├── LoginScreen.js
│   ├── CadastroScreen.js
│   ├── EmpreendimentosScreen.js
│   ├── PlantaScreen.js
│   ├── PropostaScreen.js
│   ├── PropostasSalvasScreen.js
│   ├── VisualizarPDFScreen.js
│   └── ForgotPasswordScreen.js (nova)
├── components/
│   ├── BaseInput.js
│   └── BaseButton.js
├── theme/
│   ├── colors.js
│   ├── spacing.js
│   └── typography.js
├── utils/
│   └── supabase.js
└── assets/
    └── logo.png (opcional)

Primeiros passos

Clone o repositório:

git clone https://github.com/usuario/repo.git
cd repo

Instale as dependências:

npm install
# ou yarn install

Configure variáveis de ambiente:

Crie um arquivo .env na raiz com as chaves:

SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

Inicie o servidor Expo:

npm start
# ou expo start

Abra no simulador ou dispositivo físico via QR Code.

Fluxos

Cadastro: inserção de e-mail, senha e código de autorização.

Login: e-mail + senha.

Esqueci minha senha: solicitar reset por e-mail.

Reservar lote: tap em lote disponível → preencher proposta → gerar ou salvar PDF.

Propostas salvas: editar, filtrar, compartilhar, excluir.

Personalização e temas

Utiliza objetos colors, spacing e typography para padronizar estilos.

Contribuição

Fork do repositório

Nova branch (git checkout -b feature/nova-funcionalidade)

Commit das mudanças (git commit -m 'Adiciona nova funcionalidade')

Push na branch (git push origin feature/nova-funcionalidade)

Abra um Pull Request
