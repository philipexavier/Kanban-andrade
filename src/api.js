// api.js
import { debugLog } from './debug';

// Configurações da API do Chatwoot vindas do window._env_ (injetadas pelo .env.js)
const CHATWOOT_URL = (window._env_ && window._env_.REACT_APP_CHATWOOT_URL) || '';
const ACCOUNT_ID = (window._env_ && window._env_.REACT_APP_CHATWOOT_ACCOUNT_ID) || '';
const TOKEN = (window._env_ && window._env_.REACT_APP_CHATWOOT_TOKEN) || '';

// Headers padrão para todas as chamadas
const chatwootHeaders = {
  'Content-Type': 'application/json',
  'api_access_token': TOKEN, // nome exato exigido pela API
};

async function chatwootFetch(endpoint, options = {}) {
  // Garante que não haja barra duplicada na URL
  const baseUrl = CHATWOOT_URL.endsWith('/')
    ? CHATWOOT_URL.slice(0, -1)
    : CHATWOOT_URL;

  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // /api/v1/accounts/{ACCOUNT_ID}{endpoint}
  const url = `${baseUrl}/api/v1/accounts/${ACCOUNT_ID}${path}`;

  debugLog('chatwootFetch', url, options);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...chatwootHeaders,
        ...(options.headers || {}), // permite sobrescrever/adicionar headers se precisar
      },
    });

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      const errorDetails = {
        message: `Erro na API: ${url} ${response.status}`,
        status: response.status,
        url,
        method: options.method || 'GET',
        requestBody: options.body,
        headers: chatwootHeaders,
        response: responseData,
        stack: new Error().stack,
      };
      debugLog('Detalhes do erro Chatwoot:', errorDetails);
      const error = new Error(errorDetails.message);
      Object.assign(error, errorDetails);
      throw error;
    }

    return responseData;
  } catch (error) {
    debugLog('Erro na requisição Chatwoot:', error);
    throw error;
  }
}

debugLog('api.js: módulo carregado');

// Retorna todos os contatos
export async function getContacts() {
  debugLog('api.js: getContacts chamado');
  try {
    const data = await chatwootFetch('/contacts', { method: 'GET' });
    return data.payload || [];
  } catch (error) {
    debugLog('Erro ao buscar contatos:', error);
    throw error;
  }
}

// Retorna todos os atributos customizados (lista) apenas do tipo contact_attribute
export async function getCustomAttributes() {
  debugLog('api.js: getCustomAttributes chamado');
  try {
    const data = await chatwootFetch('/custom_attribute_definitions', {
      method: 'GET',
    });
    const all = data.payload || data || [];
    const filtered = Array.isArray(all)
      ? all.filter(attr => attr.attribute_model === 'contact_attribute')
      : [];
    return filtered;
  } catch (error) {
    debugLog('Erro ao buscar atributos customizados:', error);
    throw error;
  }
}

// Retorna um atributo customizado específico pelo ID
export async function getCustomAttributeById(id) {
  debugLog('api.js: getCustomAttributeById chamado', id);
  try {
    const data = await chatwootFetch(`/custom_attribute_definitions/${id}`, {
      method: 'GET',
    });
    return data.payload || data;
  } catch (error) {
    debugLog('Erro ao buscar atributo customizado por ID:', error);
    throw error;
  }
}

// Atualiza o valor de um atributo customizado do contato
export async function updateContactCustomAttribute(contactId, attributeKey, value) {
  debugLog(
    'api.js: updateContactCustomAttribute chamado',
    contactId,
    attributeKey,
    value
  );
  try {
    return await chatwootFetch(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({
        custom_attributes: { [attributeKey]: value },
      }),
    });
  } catch (error) {
    debugLog('Erro ao atualizar atributo customizado:', error);
    throw error;
  }
}
