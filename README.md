# SGI Trabalho 02

Repositório do Trabalho 02 de SGGI (Sistemas de Gestão de Identidade)

Universidade Lusófona Lisboa

---
## Contexto

### Aplicação Web
Esta aplicação web é implementada em Node.js/Express e simula um portal empresarial com múltiplos métodos de autenticação. 

A aplicação utiliza templates EJS para as vistas, sessões Express para gestão de estado, e um ficheiro JSON como base de dados local de utilizadores (dispensando a necessidade de um servidor de base de dados).

A aplicação inicial já suporta autenticação local (utilizador e palavra-passe). Em cada etapa do desenvolvimento, será adicionado um novo método de autenticação:
- Etapa 1: Autenticação SAML via IdP empresarial
- Etapa 2: Autenticação OpenID Connect via Google
- Etapa 3: Verificação de Verifiable Credentials

---
## Etapa 1: Service Provider SAML 2.0

#### Visão Geral

Implementação de autenticação SAML à aplicação web (Node/Express), transformando-a num Service Provider (SP) SAML capaz de autenticar utilizadores através de um Identity Provider (IdP) empresarial

#### Objetivos:
- Implementar funcionalidade de Service Provider SAML 2.0
- Configurar relações de confiança entre SP e IdP
- Processar asserções SAML e atributos de utilizador
- Compreender fluxos de single sign-on (SSO)

#### SAML em Ambientes Empresariais
O SAML (Security Assertion Markup Language) permite single sign-on entre aplicações empresariais.

Quando um utilizador tenta aceder a uma aplicação:
1. O Service Provider (SP) — a sua app — redireciona para o Identity Provider (IdP)
2. O IdP autentica o utilizador (se ainda não autenticado)
3. O IdP envia uma asserção SAML de volta para o SP
4. O SP valida a asserção e cria uma sessão

#### Aplicação e Identity Provider
A aplicação está configurada e disponível na URL: http://localhost:3000.

O IdP da unidade curricular é uma instância SimpleSAMLphp em **saml.jcraveiro.com**. 

Dados para comunicação SAML:

- (1) URL SSO do IdP (entry point): https://saml.jcraveiro.com/saml2/idp/SSOService.php
- (2) Entity ID do seu SP:http://localhost:3000/aXXXXXXXX
- (3) URL de Callback: http://localhost:3000/login/saml/callback
- (4) Certificado do IdP (para validação de assinaturas) 

#### Visão Geral do  fluxo SAML
```
Utilizador 	    ServiceProvider(SP)     IdentityProvider(IdP)
|                           |                       |
| Aceder app (localhost)    |                       |
|-------------------------> |                       |
|                           |                       |
| Redirecionar para IdP (1)                         |
|---------------------------------------------->    |
|                       |                           |
|                       | Utilizador faz login (2)  |
|                       |                           |
| Redirecionar de volta para SP com                 |
|   SAMLResponse (3)                                |
|<------------------------------------------------- |
|---------------------> |                           |
|                       |                           |
|                       | Validar asserção (4)      |
|                       |                           |
| Acesso concedido      |                           |
|<--------------------- |                           |
```

#### Desafios Encontrados no desenvolvimento da aplicação SAML

- Falta de familiaridade com Node.js / EJS
  - Dificuldade inicial em compreender a estrutura da aplicação em Node.js e o funcionamento do Express.  
  - Curva de aprendizagem associada ao uso de templates EJS para renderização de páginas dinâmicas.  
  - Necessidade de entender conceitos como rotas, middleware e separação entre lógica e apresentação.

- Configuração do certificado do IdP (`idpCert`)
  - Problemas ao configurar corretamente o certificado utilizado na autenticação SAML.  
  - Verificação de que o formato do certificado é crítico, funcionando apenas quando incluído entre: **BEGIN CERTIFICATE / END CERTIFICATE**.
  
- Serialização e desserialização do utilizador
  - Complexidade na gestão do objeto `user` após autenticação.  
  - Problemas ao implementar corretamente os métodos de serialização e desserialização.  
  - Impacto direto na apresentação correta dos dados do utilizador na página de perfil.

- Ausência do componente de logout SAML
  - Funcionalidade de logout SAML não estava inicialmente implementada.  
  - Implementação posterior com apoio do professor.  
  - Necessidade de compreender o fluxo de Single Logout (SLO) no contexto do SAML.  
