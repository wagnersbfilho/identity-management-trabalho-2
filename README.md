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
