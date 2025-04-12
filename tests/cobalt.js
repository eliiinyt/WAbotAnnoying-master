class CobaltAPI {
    /**
     * Constructor para inicializar la clase CobaltAPI.
     * @param {string} baseUrl - La URL base de la API.
     * @param {string} [authToken=null] - El token de autenticación.
     * @param {string} [authScheme='Api-Key'] - El esquema de autenticación.
     */
    constructor(baseUrl, authToken = null, authScheme = 'Api-Key') {
      this.baseUrl = baseUrl;
      this.authToken = authToken;
      this.authScheme = authScheme;
    }
  
    /**
     * Método privado para realizar solicitudes fetch.
     * @param {string} endpoint - El endpoint de la API.
     * @param {object} options - Opciones para la solicitud fetch.
     * @returns {Promise<object>} - La respuesta JSON de la solicitud.
     * @throws {Error} - Si la solicitud falla.
     */
    async _fetch(endpoint, options) {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(this.authToken && { 'Authorization': `${this.authScheme} ${this.authToken}` })
      };
  
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error: ${errorData.error?.code || 'Unknown error'}, Message: ${errorData.error?.message || 'No message'}`);
      }
  
      return response.json();
    }
  
    /**
     * Procesa una descarga.
     * @param {object} data - Los datos de la descarga.
     * @returns {Promise<object>} - La respuesta de la descarga.
     */
    async processDownload(data) {
      return this._fetch('/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    /**
     * Obtiene información del servidor.
     * @returns {Promise<object>} - La información del servidor.
     */
    async getServerInfo() {
      return this._fetch('/', {
        method: 'GET',
      });
    }
  
    /**
     * Genera un token de sesión JWT.
     * @param {string} turnstileResponse - La respuesta del desafío Turnstile.
     * @returns {Promise<object>} - La información del token de sesión.
     */
    async generateSessionToken(turnstileResponse) {
      return this._fetch('/session', {
        method: 'POST',
        headers: {
          'cf-turnstile-response': turnstileResponse,
        },
      });
    }
  }
  
module.exports = CobaltAPI;